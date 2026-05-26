import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runLRUEviction } from '../lru';
import { getAllCachedComicsMetadata, evictCachedComic, getCacheTotalSizeBytes } from '@/lib/idb';

vi.mock('@/lib/idb', () => ({
  getAllCachedComicsMetadata: vi.fn(),
  evictCachedComic: vi.fn(),
  getCacheTotalSizeBytes: vi.fn(),
}));

describe('lru.ts (LRU Cache Eviction Policy)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not evict any comics if total size is within budget', async () => {
    vi.mocked(getCacheTotalSizeBytes).mockResolvedValue(100 * 1024 * 1024); // 100MB
    const evicted = await runLRUEviction('user-123');
    expect(evicted).toBe(0);
    expect(evictCachedComic).not.toHaveBeenCalled();
  });

  it('should evict oldest comics first if size exceeds budget', async () => {
    vi.mocked(getCacheTotalSizeBytes).mockResolvedValue(600 * 1024 * 1024); // 600MB (limit is 500MB)

    const mockComicsMeta = [
      { comicId: 'comic-old', sizeBytes: 150 * 1024 * 1024, lastAccessedAt: 1000 },
      { comicId: 'comic-new', sizeBytes: 200 * 1024 * 1024, lastAccessedAt: 2000 },
    ];
    vi.mocked(getAllCachedComicsMetadata).mockResolvedValue(mockComicsMeta as any);

    const evicted = await runLRUEviction('user-123');
    expect(evicted).toBe(1);
    expect(evictCachedComic).toHaveBeenCalledWith('comic-old', 'user-123');
    expect(evictCachedComic).not.toHaveBeenCalledWith('comic-new', 'user-123');
  });
});
