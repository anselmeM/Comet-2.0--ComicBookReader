import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReadingProgress } from '../useReadingProgress';
import { useReaderStore } from '@/stores/readerStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/stores/readerStore', () => ({
  useReaderStore: vi.fn(),
}));

vi.mock('@/lib/sync', () => ({
  queueSyncTask: vi.fn(),
}));

vi.mock('../useAuthCallback', () => ({
  useAuthCallback: vi.fn(() => ({ handleAuthError: vi.fn() })),
}));

describe('useReadingProgress', () => {
  const mockMutate = vi.fn();
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (useMutation as any).mockReturnValue({ mutate: mockMutate });
    (useQueryClient as any).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
    
    // Simulate reader store state
    (useReaderStore as any).mockImplementation((selector: any) => {
      const state = {
        currentPage: 0,
        totalPages: 100,
        zoomLevel: 1.0,
      };
      return selector(state);
    });

    vi.useFakeTimers();
  });

  it('should not sync if comicId is null', () => {
    renderHook(() => useReadingProgress({ comicId: null }));
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should sync progress when page changes', () => {
    let currentPage = 0;
    (useReaderStore as any).mockImplementation((selector: any) => {
      const state = {
        currentPage,
        totalPages: 100,
        zoomLevel: 1.0,
      };
      return selector(state);
    });

    const { rerender } = renderHook(() => useReadingProgress({ comicId: 'comic-1' }));

    // Change page
    currentPage = 1;
    rerender();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      lastPage: 1,
      totalPages: 100,
    }));
  });

  it('should track reading time and include it in sync', () => {
    (useReaderStore as any).mockImplementation((selector: any) => {
      const state = {
        currentPage: 5,
        totalPages: 100,
        zoomLevel: 1.0,
      };
      return selector(state);
    });

    renderHook(() => useReadingProgress({ comicId: 'comic-1' }));

    // Advance time by 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Mutation should be triggered by significant time pass (30s)
    act(() => {
      vi.advanceTimersByTime(3000); // 2s debounce
    });

    expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({
      timeDelta: 30,
    }));
  });
});
