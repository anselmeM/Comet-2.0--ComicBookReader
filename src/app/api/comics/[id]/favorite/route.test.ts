import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from './route';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { Session } from 'next-auth';
import { ComicDTOSchema } from '@/types/schemas';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    comic: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  invalidateCache: vi.fn(),
}));

type CometSession = Session & {
  user: { id: string; plan: string; hasCompletedOnboarding: boolean };
};

describe('Comic Favorite API Route ([id])', () => {
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

  describe('POST (favorite)', () => {
    it('should return 401 if unauthorized', async () => {
      (auth as any).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await POST(new Request('http://localhost:3100'), { params });
      expect(response.status).toBe(401);
    });

    it('should return 404 if comic not found or not owned', async () => {
      (auth as any).mockResolvedValue(mockSession);
      (db.comic.findFirst as any).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await POST(new Request('http://localhost:3100'), { params });
      expect(response.status).toBe(404);
    });

    it('should favorite the comic and return 200 on success', async () => {
      (auth as any).mockResolvedValue(mockSession);
      const comicId = 'cl0123456000008l987654321';
      const mockComicBefore = {
        id: comicId,
        title: 'Test Comic',
        pageCount: 10,
        coverUrl: null,
        series: null,
        issue: null,
        year: null,
        addedAt: new Date(),
        lastReadAt: null,
        progress: null,
        isFavorite: false,
        rating: 0,
        syncStatus: 'LOCAL',
        userId: 'user-123',
      };
      const mockComicAfter = {
        ...mockComicBefore,
        isFavorite: true,
      };
      (db.comic.findFirst as any).mockResolvedValue(mockComicBefore);
      (db.comic.update as any).mockResolvedValue(mockComicAfter);

      const params = Promise.resolve({ id: comicId });
      const response = await POST(new Request('http://localhost:3100'), { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isFavorite).toBe(true);
      expect(db.comic.update).toHaveBeenCalledWith({
        where: { id: comicId },
        data: { isFavorite: true },
      });

      // Contract test assertion
      const validationResult = ComicDTOSchema.safeParse(data);
      expect(validationResult.success).toBe(true);
    });
  });

  describe('DELETE (unfavorite)', () => {
    it('should return 401 if unauthorized', async () => {
      (auth as any).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await DELETE(new Request('http://localhost:3100'), { params });
      expect(response.status).toBe(401);
    });

    it('should return 404 if comic not found or not owned', async () => {
      (auth as any).mockResolvedValue(mockSession);
      (db.comic.findFirst as any).mockResolvedValue(null);
      const params = Promise.resolve({ id: 'comic-1' });
      const response = await DELETE(new Request('http://localhost:3100'), { params });
      expect(response.status).toBe(404);
    });

    it('should unfavorite the comic and return 200 on success', async () => {
      (auth as any).mockResolvedValue(mockSession);
      const comicId = 'cl0123456000008l987654321';
      const mockComicBefore = {
        id: comicId,
        title: 'Test Comic',
        pageCount: 10,
        coverUrl: null,
        series: null,
        issue: null,
        year: null,
        addedAt: new Date(),
        lastReadAt: null,
        progress: null,
        isFavorite: true,
        rating: 0,
        syncStatus: 'LOCAL',
        userId: 'user-123',
      };
      const mockComicAfter = {
        ...mockComicBefore,
        isFavorite: false,
      };
      (db.comic.findFirst as any).mockResolvedValue(mockComicBefore);
      (db.comic.update as any).mockResolvedValue(mockComicAfter);

      const params = Promise.resolve({ id: comicId });
      const response = await DELETE(new Request('http://localhost:3100'), { params });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.isFavorite).toBe(false);
      expect(db.comic.update).toHaveBeenCalledWith({
        where: { id: comicId },
        data: { isFavorite: false },
      });

      // Contract test assertion
      const validationResult = ComicDTOSchema.safeParse(data);
      expect(validationResult.success).toBe(true);
    });
  });
});
