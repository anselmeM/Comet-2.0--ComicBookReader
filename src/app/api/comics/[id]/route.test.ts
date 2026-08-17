/**

 * Route tests: GET/PATCH/DELETE /api/comics/[id] — ownership + metadata update.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, getRequest, jsonRequest } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));

vi.mock('@/lib/cache', () => ({ invalidateCache: vi.fn() }));

vi.mock('@/lib/db', () => ({
  db: {
    comic: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

const { GET, PATCH, DELETE } = await import('./route');

const params = Promise.resolve({ id: 'comic-1' });

describe('GET /api/comics/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.comic.findFirst.mockResolvedValue({ id: 'comic-1', userId: 'user-1', title: 'C' });
  });

  it('returns 404 when the comic is not owned', async () => {
    db.comic.findFirst.mockResolvedValue(null);

    const res = await GET(
      getRequest('http://localhost/api/comics/comic-1'),
      { params },
      fakeSession,
    );

    expect(res.status).toBe(404);
  });

  it('returns the comic', async () => {
    const res = await GET(
      getRequest('http://localhost/api/comics/comic-1'),
      { params },
      fakeSession,
    );

    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body.id).toBe('comic-1');
  });
});

describe('PATCH /api/comics/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.comic.findFirst.mockResolvedValue({ id: 'comic-1', userId: 'user-1' });

    db.comic.update.mockResolvedValue({ id: 'comic-1', title: 'New Title' });
  });

  it('returns 404 when the comic is not owned', async () => {
    db.comic.findFirst.mockResolvedValue(null);

    const res = await PATCH(
      jsonRequest(
        'http://localhost/api/comics/comic-1',
        { title: 'New Title' },
        { method: 'PATCH' },
      ),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(404);
  });

  it('updates the comic metadata', async () => {
    const res = await PATCH(
      jsonRequest(
        'http://localhost/api/comics/comic-1',
        { title: 'New Title' },
        { method: 'PATCH' },
      ),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(200);

    expect(db.comic.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'comic-1' },

        data: expect.objectContaining({ title: 'New Title' }),
      }),
    );
  });
});

describe('DELETE /api/comics/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.comic.findFirst.mockResolvedValue({ id: 'comic-1', userId: 'user-1' });

    db.comic.delete.mockResolvedValue({ id: 'comic-1' });
  });

  it('deletes an owned comic', async () => {
    const res = await DELETE(
      new Request('http://localhost/api/comics/comic-1', { method: 'DELETE' }),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(200);

    expect(db.comic.delete).toHaveBeenCalledWith({ where: { id: 'comic-1' } });
  });

  it('returns 404 for a comic the user does not own', async () => {
    db.comic.findFirst.mockResolvedValue(null);

    const res = await DELETE(
      new Request('http://localhost/api/comics/comic-1', { method: 'DELETE' }),

      { params },

      fakeSession,
    );

    expect(res.status).toBe(404);
  });
});
