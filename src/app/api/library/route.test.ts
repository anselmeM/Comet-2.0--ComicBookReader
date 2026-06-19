import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { auth } from '@/auth';
import { PaginatedLibraryResponseSchema, ComicDTOSchema } from '@/types/schemas';

vi.mock('@/auth', () => ({
  auth: vi.fn() as any,
}));

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
}));

// More precise type for the session we use in the app
type CometSession = Session & {
  user: { id: string; plan: string; hasCompletedOnboarding: boolean };
};

vi.mock('@/lib/db', () => ({
  db: {
    comic: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    userBadge: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe('Library API Route', () => {
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
    it('should return paginated comics', async () => {
      (auth as any).mockResolvedValue(mockSession);
      vi.mocked(db.comic.count).mockResolvedValue(1);

      const mockComics = [
        {
          id: 'cl0123456000008l987654321',
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
        },
      ];
      vi.mocked(db.comic.findMany).mockResolvedValue(mockComics as unknown as []);

      const req = new Request('http://localhost:3100/api/library?page=1&limit=10');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.pagination.total).toBe(1);

      // Contract test assertion
      const validationResult = PaginatedLibraryResponseSchema.safeParse(data);
      expect(validationResult.success).toBe(true);

      expect(db.comic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        }),
      );
    });

    it('should return unauthorized if session is invalid', async () => {
      (auth as any).mockResolvedValue(null);

      const req = new Request('http://localhost:3100/api/library');
      const response = await GET(req);

      expect(response.status).toBe(401);
    });
  });

  describe('POST', () => {
    it('should add a new comic', async () => {
      (auth as any).mockResolvedValue(mockSession);
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'user-123' } as any);

      const mockComic = {
        id: 'cl0123456000008l987654321',
        title: 'New Comic',
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
      };
      vi.mocked(db.comic.findUnique).mockResolvedValue(null);
      vi.mocked(db.comic.create).mockResolvedValue(mockComic as any);

      const payload = {
        title: 'New Comic',
        filehash: 'a'.repeat(64),
        pageCount: 10,
      };

      const req = new Request('http://localhost:3100/api/library', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('New Comic');

      // Contract test assertion
      const validationResult = ComicDTOSchema.safeParse(data);
      expect(validationResult.success).toBe(true);
    });

    it('should return 415 if content-type is not application/json', async () => {
      (auth as any).mockResolvedValue(mockSession);

      const req = new Request('http://localhost:3100/api/library', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'not json',
      });

      const response = await POST(req);
      expect(response.status).toBe(415);
    });

    it('should return 400 for invalid payload', async () => {
      (auth as any).mockResolvedValue(mockSession);

      const req = new Request('http://localhost:3100/api/library', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: '' }), // Invalid: missing filehash, pageCount, etc.
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
    });
  });
});
