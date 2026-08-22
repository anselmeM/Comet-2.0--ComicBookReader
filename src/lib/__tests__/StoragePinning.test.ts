import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openDB } from 'idb';
import {
  pinCachedComic,
  clearUnpinnedParsedComics,
  setCachedComic,
  getCachedComic,
} from '../idb';

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('StoragePinning and Selective Clear (IndexedDB)', () => {
  const mockDb = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    clear: vi.fn(),
    close: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(openDB).mockResolvedValue(mockDb as any);
  });

  it('pins and unpins a cached comic in IndexedDB', async () => {
    const mockComic = {
      comicId: 'comic-1',
      title: 'Test Comic',
      pages: [{ blob: new Blob(['data']), width: 800, height: 1200 }],
      coverUrl: 'blob:cover',
      cachedAt: 1000,
      lastAccessedAt: 1000,
      sizeBytes: 500,
      isPinned: false,
    };

    mockDb.get.mockResolvedValue(mockComic);

    await pinCachedComic('comic-1', true, 'user-1');
    expect(mockDb.get).toHaveBeenCalledWith('comics', 'comic-1');
    expect(mockDb.put).toHaveBeenCalledWith('comics', expect.objectContaining({
      comicId: 'comic-1',
      isPinned: true,
    }));
  });

  it('clearUnpinnedParsedComics deletes only unpinned items', async () => {
    const comicsInDb = [
      { comicId: 'pinned-1', isPinned: true, pages: [], sizeBytes: 100 },
      { comicId: 'unpinned-1', isPinned: false, pages: [], sizeBytes: 100 },
      { comicId: 'unpinned-2', pages: [], sizeBytes: 100 }, // undefined isPinned
    ];

    mockDb.getAll.mockResolvedValue(comicsInDb);

    const count = await clearUnpinnedParsedComics('user-1');
    expect(count).toBe(2);
    expect(mockDb.delete).toHaveBeenCalledWith('comics', 'unpinned-1');
    expect(mockDb.delete).toHaveBeenCalledWith('comics', 'unpinned-2');
    expect(mockDb.delete).not.toHaveBeenCalledWith('comics', 'pinned-1');
  });
});
