import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from './route';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { Session } from 'next-auth';

vi.mock('@/lib/auth-utils', () => ({
  validateSession: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    comic: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    readingProgress: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe('Reading Progress API Route', () => {
  type CometSession = Session & {
    user: { id: string; plan: string; hasCompletedOnboarding: boolean };
  };
  const mockSession: CometSession = {
    user: { id: 'user-123', plan: 'FREE', hasCompletedOnboarding: true },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return progress for owned comic', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });

      const mockComicWithProgress = {
        id: 'comic-1',
        userId: 'user-123',
        progress: { lastPage: 5, totalPages: 20, zoomLevel: 1.0, readStatus: 'READING' as const },
      };
      vi.mocked(db.comic.findUnique).mockResolvedValue(mockComicWithProgress as any);

      const params = Promise.resolve({ comicId: 'comic-1' });
      const response = await GET(new Request('http://localhost:3100'), { params });
      const data = (await response.json()) as { lastPage: number };

      expect(response.status).toBe(200);
      expect(data.lastPage).toBe(5);
    });

    it('should return 403 if comic belongs to another user', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });

      const mockOtherComic = {
        id: 'comic-1',
        userId: 'other-user',
      };
      vi.mocked(db.comic.findUnique).mockResolvedValue(mockOtherComic as any);

      const params = Promise.resolve({ comicId: 'comic-1' });
      const response = await GET(new Request('http://localhost:3100'), { params });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT', () => {
    it('should update progress', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });
      vi.mocked(db.comic.findUnique).mockResolvedValue({
        id: 'comic-1',
        userId: 'user-123',
      } as any);
      vi.mocked(db.readingProgress.upsert).mockResolvedValue({
        lastPage: 10,
        totalPages: 20,
        zoomLevel: 1.0,
        readStatus: 'READING',
      } as any);

      const payload = {
        lastPage: 10,
        totalPages: 20,
      };

      const params = Promise.resolve({ comicId: 'comic-1' });
      const req = new Request('http://localhost:3100', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await PUT(req, { params });
      expect(response.status).toBe(200);
      expect(db.readingProgress.upsert).toHaveBeenCalled();
    });
  });
});
