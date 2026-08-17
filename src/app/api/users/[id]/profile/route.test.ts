/**
 * Route tests: GET /api/users/[id]/profile — public profile visibility.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { fakeSession, getRequest } from '@/test/api-helpers';

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    friendship: { findFirst: vi.fn() },
    userBadge: { findMany: vi.fn() },
    comic: { count: vi.fn() },
    readingProgress: { count: vi.fn(), findMany: vi.fn() },
  },
}));

const auth = vi.hoisted(() => ({ validateSession: vi.fn() }));
vi.mock('@/lib/auth-utils', () => ({
  validateSession: (...args: unknown[]) => auth.validateSession(...args),
}));

const { GET } = await import('./route');

describe('GET /api/users/[id]/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });
    db.user.findUnique.mockResolvedValue({
      id: 'u2',
      name: 'Friend',
      image: null,
      createdAt: new Date('2026-01-01'),
    });
    db.friendship.findFirst.mockResolvedValue({ id: 'f1' });
    db.userBadge.findMany.mockResolvedValue([]);
    db.comic.count.mockResolvedValue(5);
    db.readingProgress.count.mockResolvedValue(2);
    db.readingProgress.findMany.mockResolvedValue([]);
  });

  it('rejects unauthenticated requests', async () => {
    auth.validateSession.mockResolvedValue({
      session: null,
      errorResponse: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });
    const res = await GET(getRequest('http://localhost/api/users/u2/profile'), {
      params: Promise.resolve({ id: 'u2' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 404 when the user does not exist', async () => {
    db.user.findUnique.mockResolvedValue(null);
    const res = await GET(getRequest('http://localhost/api/users/u2/profile'), {
      params: Promise.resolve({ id: 'u2' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns the profile with stats and friend status', async () => {
    const res = await GET(getRequest('http://localhost/api/users/u2/profile'), {
      params: Promise.resolve({ id: 'u2' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.name).toBe('Friend');
    expect(body.profile.stats.libraryCount).toBe(5);
    expect(body.profile.isFriend).toBe(true);
  });
});
