import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { Session } from 'next-auth';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    comic: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    readingProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
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
      theme: 'dark'
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
    });
  });

  describe('PUT', () => {
    it('should return 401 if unauthorized', async () => {
      (auth as any).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await PUT(new Request('http://localhost:3100', { method: 'PUT', body: '{}' }), { params });
      expect(response.status).toBe(401);
    });

    it('should return 400 on validation failure', async () => {
      (auth as any).mockResolvedValue(mockSession);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await PUT(new Request('http://localhost:3100', {
        method: 'PUT',
        body: JSON.stringify({ lastPage: -1 }), // Invalid page index
      }), { params });
      expect(response.status).toBe(400);
    });

    it('should update progress and handle user streak', async () => {
      (auth as any).mockResolvedValue(mockSession);
      vi.mocked(db.comic.findUnique).mockResolvedValue({ id: 'comic-1', userId: 'user-123' } as any);
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'user-123', readingStreak: 1, lastReadDate: new Date() } as any);
      vi.mocked(db.readingProgress.findUnique).mockResolvedValue(null);
      vi.mocked(db.readingProgress.upsert).mockResolvedValue({
        lastPage: 10,
        totalPages: 20,
        zoomLevel: 1.0,
        readStatus: 'READING',
      } as any);

      const params = Promise.resolve({ id: 'comic-1' });
      const response = await PUT(new Request('http://localhost:3100', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lastPage: 10, totalPages: 20 }),
      }), { params });

      expect(response.status).toBe(200);
      expect(db.readingProgress.upsert).toHaveBeenCalled();
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
      vi.mocked(db.comic.findUnique).mockResolvedValue({ id: 'comic-1', userId: 'user-123' } as any);
      vi.mocked(db.readingProgress.delete).mockResolvedValue({} as any);
      vi.mocked(db.comic.update).mockResolvedValue({} as any);

      const params = Promise.resolve({ id: 'comic-1' });
      const response = await DELETE(new Request('http://localhost:3100', { method: 'DELETE' }), { params });

      expect(response.status).toBe(200);
      expect(db.readingProgress.delete).toHaveBeenCalled();
    });
  });
});
