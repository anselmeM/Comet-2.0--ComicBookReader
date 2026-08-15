import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import * as cache from '@/lib/cache';
import * as badges from '@/lib/badges';
import * as notifications from '@/lib/notifications';
import { Session } from 'next-auth';
import { ReadingProgressSchema } from '@/types/schemas';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock('@/lib/badges', () => ({
  evaluateBadges: vi.fn(),
  BADGES: [{ id: 'b1', name: 'First Blood', description: 'Read your first comic' }],
}));

vi.mock('@/lib/db', () => ({
  db: {
    comic: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    readingProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { totalTimeSpent: 0 } }),
    },
    readingSession: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userBadge: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({}),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: vi.fn((arg) => {
      if (typeof arg === 'function') {
        return arg(db);
      }
      return Promise.all(arg);
    }),
  },
}));

type CometSession = Session & {
  user: { id: string; plan: string; hasCompletedOnboarding: boolean };
};

describe('Reading Progress API Route ([id])', () => {
  const mockSession: CometSession = {
    user: {
      id: 'user-123',
      plan: 'FREE',
      hasCompletedOnboarding: true,
      role: 'USER',
      defaultReadingMode: 'single-page',
      theme: 'dark',
    },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      (auth as any).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await GET(new Request('http://localhost:3100'), { params });
      expect(response.status).toBe(401);
    });

    it('should return 404 if comic not found', async () => {
      (auth as any).mockResolvedValue(mockSession);
      vi.mocked(db.comic.findUnique).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await GET(new Request('http://localhost:3100'), { params });
      expect(response.status).toBe(404);
    });

    it('should return 403 if comic belongs to another user', async () => {
      (auth as any).mockResolvedValue(mockSession);
      vi.mocked(db.comic.findUnique).mockResolvedValue({ userId: 'other-user' } as any);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await GET(new Request('http://localhost:3100'), { params });
      expect(response.status).toBe(403);
    });

    it('should return progress for owned comic', async () => {
      (auth as any).mockResolvedValue(mockSession);
      const mockComicWithProgress = {
        id: 'comic-1',
        userId: 'user-123',
        progress: { lastPage: 5, totalPages: 20, zoomLevel: 1.0, readStatus: 'READING' },
      };
      vi.mocked(db.comic.findUnique).mockResolvedValue(mockComicWithProgress as any);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await GET(new Request('http://localhost:3100'), { params });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.lastPage).toBe(5);

      // Contract test assertion
      const validationResult = ReadingProgressSchema.safeParse(data);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('PUT', () => {
    it('should return 401 if unauthorized', async () => {
      (auth as any).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await PUT(
        new Request('http://localhost:3100', { method: 'PUT', body: '{}' }),
        { params },
      );
      expect(response.status).toBe(401);
    });

    it('should return 400 on validation failure', async () => {
      (auth as any).mockResolvedValue(mockSession);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await PUT(
        new Request('http://localhost:3100', {
          method: 'PUT',
          body: JSON.stringify({ lastPage: -1 }), // Invalid page index
        }),
        { params },
      );
      expect(response.status).toBe(400);
    });

    it('should update progress and handle user streak', async () => {
      (auth as any).mockResolvedValue(mockSession);
      vi.mocked(db.comic.findUnique).mockResolvedValue({
        id: 'comic-1',
        userId: 'user-123',
      } as any);
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: 'user-123',
        readingStreak: 1,
        lastReadDate: new Date(),
      } as any);
      vi.mocked(db.readingProgress.findUnique).mockResolvedValue(null);
      vi.mocked(db.readingProgress.upsert).mockResolvedValue({
        lastPage: 10,
        totalPages: 20,
        zoomLevel: 1.0,
        readStatus: 'READING',
      } as any);

      const params = Promise.resolve({ id: 'comic-1' });
      const response = await PUT(
        new Request('http://localhost:3100', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ lastPage: 10, totalPages: 20 }),
        }),
        { params },
      );

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(db.readingProgress.upsert).toHaveBeenCalled();

      // Contract test assertion
      const validationResult = ReadingProgressSchema.safeParse(data);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('PUT — heavy work throttle', () => {
    // Badge evaluation + library invalidation are throttled to once per
    // 5 minutes per user; milestone events force them immediately.
    // lastReadDate is computed per-test (module-scope Date would flake if
    // the suite crosses midnight).
    const user = { id: 'user-123', readingStreak: 3, lastReadDate: '' };
    const comic = { id: 'comic-1', userId: 'user-123', title: 'Test' };

    function mockMidSession() {
      user.lastReadDate = new Date().toISOString();
      vi.mocked(db.comic.findUnique).mockResolvedValue(comic as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(user as any);
      vi.mocked(db.readingProgress.findUnique).mockResolvedValue({
        id: 'p1',
        lastPage: 1,
        totalPages: 10,
        readStatus: 'READING',
      } as any);
      vi.mocked(db.readingProgress.upsert).mockResolvedValue({
        id: 'p1',
        lastPage: 3,
        totalPages: 10,
        readStatus: 'READING',
      } as any);
      vi.mocked(db.comic.update).mockResolvedValue({} as any);
      vi.mocked(db.user.update).mockResolvedValue({} as any);
      vi.mocked(db.readingSession.findFirst).mockResolvedValue(null);
      vi.mocked(db.readingSession.create).mockResolvedValue({} as any);
      vi.mocked(cache.getCache).mockResolvedValue('1'); // heavy work ran < 5 min ago
      vi.mocked(cache.setCache).mockResolvedValue(undefined);
      vi.mocked(cache.invalidateCache).mockResolvedValue(undefined);
      vi.mocked(badges.evaluateBadges).mockResolvedValue([]);
      (auth as any).mockResolvedValue(mockSession);
    }

    function putProgress(lastPage: number, totalPages = 10) {
      return PUT(
        new Request('http://localhost:3100', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ lastPage, totalPages }),
        }),
        { params: Promise.resolve({ id: 'comic-1' }) },
      );
    }

    it('runs heavy work on the first save (no prior progress)', async () => {
      mockMidSession();
      vi.mocked(db.readingProgress.findUnique).mockResolvedValue(null); // first save
      vi.mocked(cache.getCache).mockResolvedValue(null);

      await putProgress(2);

      expect(cache.invalidateCache).toHaveBeenCalledWith('comet:u:user-123:library', true);
      expect(badges.evaluateBadges).toHaveBeenCalledWith('user-123');
      expect(cache.setCache).toHaveBeenCalledWith('comet:u:user-123:progress:heavy', '1', 300);
    });

    it('skips heavy work mid-session while the throttle is active', async () => {
      mockMidSession(); // getCache -> '1', same status, existing streak

      const response = await putProgress(3);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.newlyEarnedBadges).toEqual([]);
      expect(badges.evaluateBadges).not.toHaveBeenCalled();
      expect(cache.invalidateCache).not.toHaveBeenCalled();
    });

    it('re-runs heavy work when the throttle expires', async () => {
      mockMidSession();
      vi.mocked(cache.getCache).mockResolvedValue(null);

      await putProgress(3);

      expect(badges.evaluateBadges).toHaveBeenCalled();
      expect(cache.invalidateCache).toHaveBeenCalled();
    });

    it('forces heavy work on a status change even mid-throttle', async () => {
      mockMidSession();
      // lastPage 9 of 10 -> COMPLETED, changing the stored READING status
      const response = await putProgress(9);
      await response.json();

      expect(badges.evaluateBadges).toHaveBeenCalled();
      expect(notifications.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Comic Completed!' }),
      );
    });

    it('returns newly earned badges in the response', async () => {
      mockMidSession();
      vi.mocked(cache.getCache).mockResolvedValue(null);
      vi.mocked(badges.evaluateBadges).mockResolvedValue(['b1']);

      const response = await putProgress(2);
      const data = await response.json();

      expect(data.newlyEarnedBadges).toEqual([
        expect.objectContaining({ id: 'b1', name: 'First Blood' }),
      ]);
    });
  });

  describe('DELETE', () => {
    it('should return 401 if unauthorized', async () => {
      (auth as any).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await DELETE(new Request('http://localhost:3100'), { params });
      expect(response.status).toBe(401);
    });

    it('should delete progress', async () => {
      (auth as any).mockResolvedValue(mockSession);
      vi.mocked(db.comic.findUnique).mockResolvedValue({
        id: 'comic-1',
        userId: 'user-123',
      } as any);
      vi.mocked(db.readingProgress.delete).mockResolvedValue({} as any);
      vi.mocked(db.comic.update).mockResolvedValue({} as any);

      const params = Promise.resolve({ id: 'comic-1' });
      const response = await DELETE(new Request('http://localhost:3100', { method: 'DELETE' }), {
        params,
      });

      expect(response.status).toBe(200);
      expect(db.readingProgress.delete).toHaveBeenCalled();
    });
  });
});
