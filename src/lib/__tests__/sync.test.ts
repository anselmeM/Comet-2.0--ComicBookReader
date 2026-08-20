import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queueSyncTask, processSyncQueue, initSyncManager } from '../sync';
import { getDB } from '@/lib/idb';

vi.mock('@/lib/idb', () => ({
  getDB: vi.fn(),
}));

describe('sync.ts (Sync Manager)', () => {
  const mockDb = {
    put: vi.fn(),
    getAll: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDB).mockResolvedValue(mockDb as any);
    global.fetch = vi.fn();
  });

  describe('queueSyncTask', () => {
    it('stores task in IndexedDB sync_tasks store', async () => {
      await queueSyncTask('/api/comics/123/progress', 'PUT', { lastPage: 5 });

      expect(mockDb.put).toHaveBeenCalledWith(
        'sync_tasks',
        expect.objectContaining({
          url: '/api/comics/123/progress',
          method: 'PUT',
          body: { lastPage: 5 },
          attempts: 0,
        }),
      );
    });
  });

  describe('processSyncQueue', () => {
    it('processes queued tasks when online and removes successful tasks', async () => {
      const task = {
        id: 'task-1',
        url: '/api/comics/123/progress',
        method: 'PUT' as const,
        body: { lastPage: 5 },
        headers: { 'Content-Type': 'application/json' },
        timestamp: Date.now(),
        attempts: 0,
      };

      mockDb.getAll.mockResolvedValue([task]);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as any);

      const count = await processSyncQueue();

      expect(count).toBe(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/comics/123/progress',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ lastPage: 5 }),
        }),
      );
      expect(mockDb.delete).toHaveBeenCalledWith('sync_tasks', 'task-1');
    });

    it('increments attempts on failed requests', async () => {
      const task = {
        id: 'task-1',
        url: '/api/comics/123/progress',
        method: 'PUT' as const,
        body: { lastPage: 5 },
        headers: { 'Content-Type': 'application/json' },
        timestamp: Date.now(),
        attempts: 2,
      };

      mockDb.getAll.mockResolvedValue([task]);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      const count = await processSyncQueue();

      expect(count).toBe(0);
      expect(mockDb.put).toHaveBeenCalledWith(
        'sync_tasks',
        expect.objectContaining({
          id: 'task-1',
          attempts: 3,
        }),
      );
    });

    it('drops tasks after exceeding max attempts', async () => {
      const task = {
        id: 'task-1',
        url: '/api/comics/123/progress',
        method: 'PUT' as const,
        body: { lastPage: 5 },
        headers: { 'Content-Type': 'application/json' },
        timestamp: Date.now(),
        attempts: 10,
      };

      mockDb.getAll.mockResolvedValue([task]);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      const count = await processSyncQueue();

      expect(count).toBe(0);
      expect(mockDb.delete).toHaveBeenCalledWith('sync_tasks', 'task-1');
    });
  });

  describe('initSyncManager', () => {
    it('processes queue on startup when online', () => {
      mockDb.getAll.mockResolvedValue([]);
      initSyncManager();
      expect(getDB).toHaveBeenCalled();
    });
  });
});
