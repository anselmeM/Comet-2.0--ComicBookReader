import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openDB } from 'idb';
import {
  getDB,
  setCachedComic,
  getCachedComic,
  evictCachedComic,
  getAllCachedComicsMetadata,
  getCacheTotalSizeBytes,
  clearAllParsedComics,
  closeDB,
  deleteUserDB,
} from '../idb';

vi.mock('idb', () => ({
  openDB: vi.fn(),
}));

describe('idb.ts (IndexedDB adapter)', () => {
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

  describe('getDB', () => {
    it('should open database with user-scoped name', async () => {
      const db = await getDB('user-456');
      expect(openDB).toHaveBeenCalledWith('comet-cache-user-456', 2, expect.any(Object));
      expect(db).toBe(mockDb);
    });

    it('should open database with anonymous name when user ID is missing', async () => {
      const db = await getDB();
      expect(openDB).toHaveBeenCalledWith('comet-cache-anonymous', 2, expect.any(Object));
      expect(db).toBe(mockDb);
    });
  });

  describe('closeDB and deleteUserDB', () => {
    it('should close DB connection if open', async () => {
      await getDB('user-789');
      await closeDB('user-789');
      expect(mockDb.close).toHaveBeenCalled();
    });
  });

  describe('CRUD operations', () => {
    const mockComic = {
      comicId: 'comic-123',
      pages: [{ blob: new Blob(['page1']), width: 100, height: 150 }],
      coverUrl: 'blob:cover',
      cachedAt: 123456,
      sizeBytes: 1000,
      lastAccessedAt: 123456,
    };

    it('should set cached comic', async () => {
      await setCachedComic(mockComic, 'user-123');
      expect(mockDb.put).toHaveBeenCalledWith('comics', expect.objectContaining({
        comicId: 'comic-123',
      }));
    });

    it('should get cached comic', async () => {
      mockDb.get.mockResolvedValue(mockComic);
      const comic = await getCachedComic('comic-123', 'user-123');
      expect(mockDb.get).toHaveBeenCalledWith('comics', 'comic-123');
      expect(comic).toEqual(mockComic);
    });

    it('should evict cached comic', async () => {
      await evictCachedComic('comic-123', 'user-123');
      expect(mockDb.delete).toHaveBeenCalledWith('comics', 'comic-123');
    });

    it('should clear all parsed comics', async () => {
      await clearAllParsedComics('user-123');
      expect(mockDb.clear).toHaveBeenCalledWith('comics');
    });

    it('should get metadata only', async () => {
      mockDb.getAll.mockResolvedValue([mockComic]);
      const meta = await getAllCachedComicsMetadata('user-123');
      expect(meta[0]).not.toHaveProperty('pages');
      expect(meta[0]?.comicId).toBe('comic-123');
    });

    it('should calculate total size', async () => {
      mockDb.getAll.mockResolvedValue([mockComic]);
      const size = await getCacheTotalSizeBytes('user-123');
      expect(size).toBe(mockComic.pages[0].blob.size);
    });
  });
});
