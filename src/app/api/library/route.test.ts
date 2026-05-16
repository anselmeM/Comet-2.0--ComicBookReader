import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { validateSession } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Session } from 'next-auth';

vi.mock('@/lib/auth-utils', () => ({
  validateSession: vi.fn(),
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
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

describe('Library API Route', () => {
  const mockSession: CometSession = {
    user: { id: 'user-123', plan: 'FREE', hasCompletedOnboarding: true },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return paginated comics', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });
      vi.mocked(db.comic.count).mockResolvedValue(1);

      const mockComics = [
        {
          id: 'comic-1',
          title: 'Test Comic',
          pageCount: 10,
          coverUrl: null,
          series: null,
          issue: null,
          year: null,
          addedAt: new Date(),
          lastReadAt: null,
          progress: null,
        },
      ];
      vi.mocked(db.comic.findMany).mockResolvedValue(mockComics as unknown as []);

      const req = new Request('http://localhost:3100/api/library?page=1&limit=10');
      const response = await GET(req);
      const data = (await response.json()) as {
        data: typeof mockComics;
        pagination: { total: number };
      };

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.pagination.total).toBe(1);
      expect(db.comic.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 0,
        }),
      );
    });

    it('should return unauthorized if session is invalid', async () => {
      vi.mocked(validateSession).mockResolvedValue({
        session: null,
        errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      });

      const req = new Request('http://localhost:3100/api/library');
      const response = await GET(req);

      expect(response.status).toBe(401);
    });
  });

  describe('POST', () => {
    it('should add a new comic', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'user-123' } as any);

      const mockComic = {
        id: 'comic-1',
        title: 'New Comic',
        pageCount: 10,
        coverUrl: null,
        series: null,
        issue: null,
        year: null,
        addedAt: new Date(),
        lastReadAt: null,
        progress: null,
      };
      vi.mocked(db.comic.upsert).mockResolvedValue(mockComic as any);

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
      const data = (await response.json()) as { title: string };

      expect(response.status).toBe(201);
      expect(data.title).toBe('New Comic');
    });

    it('should return 415 if content-type is not application/json', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });

      const req = new Request('http://localhost:3100/api/library', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'not json',
      });

      const response = await POST(req);
      expect(response.status).toBe(415);
    });

    it('should return 400 for invalid payload', async () => {
      vi.mocked(validateSession).mockResolvedValue({ session: mockSession, errorResponse: null });

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
