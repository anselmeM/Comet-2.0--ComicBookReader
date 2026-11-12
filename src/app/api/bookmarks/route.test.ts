import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { db } from '@/lib/db';
import { validateSession } from '@/lib/auth-utils';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth-utils', () => ({
  validateSession: vi.fn(),
}));

type CometSession = Session & {
  user: { id: string; plan: string; hasCompletedOnboarding: boolean };
};

vi.mock('@/lib/db', () => ({
  db: {
    comic: {
      findUnique: vi.fn(),
    },
    readingProgress: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    bookmark: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe('Bookmarks API Route', () => {
  const mockSession: CometSession = {
    user: {
      id: 'user-123',
      plan: 'FREE',
      hasCompletedOnboarding: true,
    },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(validateSession).mockResolvedValue({
        session: null,
        errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      });
      const req = new Request('http://localhost:3100/api/bookmarks?comicId=comic-123');
      const response = await GET(req);
      expect(response.status).toBe(401);
    });

    it('should return 404 if comic does not belong to user', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });
      vi.mocked(db.comic.findUnique).mockResolvedValue(null); // Not found or different user

      const req = new Request('http://localhost:3100/api/bookmarks?comicId=comic-123');
      const response = await GET(req);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('access denied');
    });

    it('should return bookmarks if comic belongs to user', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });
      vi.mocked(db.comic.findUnique).mockResolvedValue({
        id: 'comic-123',
        userId: 'user-123',
      } as any);
      vi.mocked(db.bookmark.findMany).mockResolvedValue([{ id: 'b-1', pageNumber: 1 }] as any);

      const req = new Request('http://localhost:3100/api/bookmarks?comicId=comic-123');
      const response = await GET(req);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.bookmarks).toHaveLength(1);
    });
  });

  describe('POST', () => {
    it('should return 404 if comic does not belong to user', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });
      vi.mocked(db.comic.findUnique).mockResolvedValue(null); // Not found or different user

      const req = new Request('http://localhost:3100/api/bookmarks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ comicId: 'comic-123', pageNumber: 5 }),
      });
      const response = await POST(req);
      expect(response.status).toBe(404);
    });

    it('should upsert bookmark if comic belongs to user', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });
      vi.mocked(db.comic.findUnique).mockResolvedValue({
        id: 'comic-123',
        userId: 'user-123',
        pageCount: 10,
      } as any);
      vi.mocked(db.readingProgress.findUnique).mockResolvedValue({ id: 'p-1' } as any);
      vi.mocked(db.bookmark.upsert).mockResolvedValue({ id: 'b-1' } as any);

      const req = new Request('http://localhost:3100/api/bookmarks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ comicId: 'comic-123', pageNumber: 5 }),
      });
      const response = await POST(req);
      expect(response.status).toBe(200);
      expect(db.bookmark.upsert).toHaveBeenCalled();
    });

    it('should auto-create the reading progress record when missing', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });
      vi.mocked(db.comic.findUnique).mockResolvedValue({
        id: 'comic-123',
        userId: 'user-123',
        pageCount: 10,
      } as any);
      vi.mocked(db.readingProgress.findUnique).mockResolvedValue(null); // no progress yet
      vi.mocked(db.readingProgress.create).mockResolvedValue({ id: 'p-new' } as any);
      vi.mocked(db.bookmark.upsert).mockResolvedValue({ id: 'b-1' } as any);

      const req = new Request('http://localhost:3100/api/bookmarks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ comicId: 'comic-123', pageNumber: 5 }),
      });
      const response = await POST(req);
      expect(response.status).toBe(200);
      expect(db.readingProgress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-123', comicId: 'comic-123' }),
        }),
      );
    });
  });
});
