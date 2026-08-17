/**

 * Route tests: GET /api/feed — per-user cached community feed.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, getRequest } from '@/test/api-helpers';

vi.mock('@/lib/db', () => ({
  db: {
    friendship: { findMany: vi.fn() },

    readingProgress: { findMany: vi.fn() },
  },
}));

const auth = vi.hoisted(() => ({ validateSession: vi.fn() }));

vi.mock('@/lib/auth-utils', () => ({
  validateSession: (...args: unknown[]) => auth.validateSession(...args),
}));

const cache = vi.hoisted(() => ({ getCache: vi.fn(), setCache: vi.fn() }));

vi.mock('@/lib/cache', () => ({
  getCache: (...a: unknown[]) => cache.getCache(...a),

  setCache: (...a: unknown[]) => cache.setCache(...a),
}));

const { GET } = await import('./route');

describe('GET /api/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });

    db.friendship.findMany.mockResolvedValue([]);

    db.readingProgress.findMany.mockResolvedValue([]);

    cache.getCache.mockResolvedValue(null);

    cache.setCache.mockResolvedValue(undefined);
  });

  it('rejects unauthenticated requests', async () => {
    auth.validateSession.mockResolvedValue({
      session: null,

      errorResponse: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    const res = await GET(getRequest('http://localhost/api/feed'));

    expect(res.status).toBe(401);
  });

  it('serves the cached feed with a per-user key', async () => {
    cache.getCache.mockResolvedValue([{ id: 'a1', type: 'READING', createdAt: 'now' }]);

    const res = await GET(getRequest('http://localhost/api/feed'));

    expect(cache.getCache).toHaveBeenCalledWith('comet:feed:user-1');

    const body = await res.json();

    expect(body.activities).toHaveLength(1);

    expect(db.readingProgress.findMany).not.toHaveBeenCalled();
  });

  it('builds and caches the feed on a cache miss', async () => {
    db.readingProgress.findMany.mockResolvedValue([
      {
        id: 'a1',

        type: 'READING',

        comicId: 'c1',

        userId: 'u2',

        user: { id: 'u2', name: 'Friend', image: null },

        comic: { id: 'c1', title: 'Comic', coverUrl: null, series: null, issue: 1 },

        reactions: [],
      },
    ]);

    const res = await GET(getRequest('http://localhost/api/feed'));

    expect(res.status).toBe(200);

    expect(db.readingProgress.findMany).toHaveBeenCalled();

    expect(cache.setCache).toHaveBeenCalledWith('comet:feed:user-1', expect.any(Array), 60);

    const body = await res.json();

    expect(body.activities).toHaveLength(1);
  });
});
