/**

 * Route tests: GET/POST /api/comics/[id]/comments — visibility + create.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, getRequest, jsonRequest } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));

vi.mock('@/lib/db', () => ({
  db: {
    comic: { findUnique: vi.fn() },

    friendship: { findMany: vi.fn() },

    comicComment: { findMany: vi.fn(), create: vi.fn() },
  },
}));

const { GET, POST } = await import('./route');

const params = Promise.resolve({ id: 'comic-1' });

describe('GET /api/comics/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.comic.findUnique.mockResolvedValue({ id: 'comic-1', userId: 'user-1' });

    db.friendship.findMany.mockResolvedValue([]);

    db.comicComment.findMany.mockResolvedValue([{ id: 'cm-1', message: 'hi' }]);
  });

  it('returns 404 when the comic does not exist', async () => {
    db.comic.findUnique.mockResolvedValue(null);

    const res = await GET(
      getRequest('http://localhost/api/comics/comic-1/comments'),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(404);
  });

  it('fetches comments with a visibility filter', async () => {
    const res = await GET(
      getRequest('http://localhost/api/comics/comic-1/comments'),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(200);

    expect(db.comicComment.findMany).toHaveBeenCalled();

    const body = await res.json();

    expect(body.comments).toHaveLength(1);
  });
});

describe('POST /api/comics/[id]/comments', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.comic.findUnique.mockResolvedValue({ id: 'comic-1', userId: 'user-1' });

    db.comicComment.create.mockResolvedValue({ id: 'cm-1', message: 'nice' });
  });

  it('rejects an empty message', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/comics/comic-1/comments', { message: '  ' }),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(400);

    expect(db.comicComment.create).not.toHaveBeenCalled();
  });

  it('returns 403 when the comic belongs to someone else', async () => {
    db.comic.findUnique.mockResolvedValue({ id: 'comic-1', userId: 'other-user' });

    const res = await POST(
      jsonRequest('http://localhost/api/comics/comic-1/comments', { message: 'hi' }),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(403);
  });

  it('creates a trimmed comment', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/comics/comic-1/comments', { message: '  nice  ' }),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(201);

    expect(db.comicComment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ comicId: 'comic-1', userId: 'user-1', message: 'nice' }),
      }),
    );
  });
});
