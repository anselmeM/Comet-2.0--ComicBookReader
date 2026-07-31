import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLibrary, useDeleteComic } from '../useLibrary';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
  keepPreviousData: vi.fn(),
}));

// Mock Auth Callback
vi.mock('../useAuthCallback', () => ({
  useAuthCallback: vi.fn(() => ({ handleAuthError: vi.fn() })),
}));

// Mock useSession
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: { user: { id: 'user-1' } } })),
}));

// Mock IndexedDB
vi.mock('@/lib/idb', () => ({
  evictCachedComic: vi.fn(),
}));

describe('useLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetch with correct parameters', async () => {
    const mockData = { data: [], pagination: { total: 0 } };
    (useQuery as any).mockImplementation(({ queryFn }: any) => {
      // Simulate calling the query function
      queryFn();
      return { data: mockData, isLoading: false };
    });

    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });
    vi.stubGlobal('fetch', globalFetch);

    renderHook(() => useLibrary({ search: 'batman', page: 2 }));

    expect(globalFetch).toHaveBeenCalledWith(expect.stringContaining('search=batman'));
    expect(globalFetch).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });
});

describe('useDeleteComic', () => {
  const mockMutate = vi.fn();
  const mockInvalidateQueries = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockReturnValue({ mutate: mockMutate });
    (useQueryClient as any).mockReturnValue({ invalidateQueries: mockInvalidateQueries });
  });

  it('should return mutation object', () => {
    const { result } = renderHook(() => useDeleteComic());
    expect(result.current.mutate).toBeDefined();
  });

  it('should call delete API and evict from cache', async () => {
    let mutationFn: any;
    (useMutation as any).mockImplementation(({ mutationFn: fn, onSuccess }: any) => {
      mutationFn = fn;
      return {
        mutate: async (id: string) => {
          await fn(id);
          onSuccess();
        },
      };
    });

    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', globalFetch);

    const { result } = renderHook(() => useDeleteComic());

    await result.current.mutate('comic-123');

    expect(globalFetch).toHaveBeenCalledWith(
      '/api/library/comic-123',
      expect.objectContaining({ method: 'DELETE' }),
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['library'] });
  });
});
