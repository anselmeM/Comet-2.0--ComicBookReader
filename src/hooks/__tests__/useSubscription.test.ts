import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSubscription } from '../useSubscription';

// Mock Toast notification
vi.mock('@/components/atoms/Toast', () => ({
  useNotification: vi.fn(() => ({ triggerNotification: vi.fn() })),
}));

describe('useSubscription', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).location = { ...originalLocation, href: '' };
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  it('should redirect to checkout URL on success', async () => {
    const mockUrl = 'https://stripe.com/checkout';
    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: mockUrl }),
    });
    vi.stubGlobal('fetch', globalFetch);

    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.handleCheckout();
    });

    expect(window.location.href).toBe(mockUrl);
  });

  it('should redirect to portal URL on success', async () => {
    const mockUrl = 'https://stripe.com/portal';
    const globalFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: mockUrl }),
    });
    vi.stubGlobal('fetch', globalFetch);

    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.handlePortal();
    });

    expect(window.location.href).toBe(mockUrl);
  });
});
