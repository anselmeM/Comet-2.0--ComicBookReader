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

  it('returns the profile with stats and friend status to a friend', async () => {
    const res = await GET(getRequest('http://localhost/api/users/u2/profile'), {
      params: Promise.resolve({ id: 'u2' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.name).toBe('Friend');
    expect(body.profile.stats.libraryCount).toBe(5);
    expect(body.profile.isFriend).toBe(true);
    expect(db.userBadge.findMany).toHaveBeenCalled();
  });

  it('returns only basic identity fields to a stranger', async () => {
    db.friendship.findFirst.mockResolvedValue(null);
    const res = await GET(getRequest('http://localhost/api/users/u2/profile'), {
      params: Promise.resolve({ id: 'u2' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile).toEqual({
      id: 'u2',
      name: 'Friend',
      image: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      isFriend: false,
      isSelf: false,
    });
    // Private data must not even be queried for strangers.
    expect(db.userBadge.findMany).not.toHaveBeenCalled();
    expect(db.comic.count).not.toHaveBeenCalled();
    expect(db.readingProgress.count).not.toHaveBeenCalled();
    expect(db.readingProgress.findMany).not.toHaveBeenCalled();
  });

  it('lets the profile owner see their own private data', async () => {
    db.friendship.findFirst.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      image: null,
      createdAt: new Date('2026-01-01'),
    });
    db.userBadge.findMany.mockResolvedValue([{ id: 'b1', badgeId: 'badge-1' }]);
    db.readingProgress.findMany
      .mockResolvedValueOnce([{ totalTimeSpent: 3600 }])
      .mockResolvedValueOnce([]);

    const res = await GET(getRequest('http://localhost/api/users/user-1/profile'), {
      params: Promise.resolve({ id: 'user-1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.isSelf).toBe(true);
    expect(body.profile.isFriend).toBe(false);
    expect(body.profile.stats).toEqual({
      libraryCount: 5,
      completedCount: 2,
      totalTimeSpent: 3600,
    });
    expect(body.profile.badges).toHaveLength(1);
  });

  it('maps recent activity with a computed read percentage', async () => {
    db.readingProgress.findMany
      .mockResolvedValueOnce([{ totalTimeSpent: 120 }])
      .mockResolvedValueOnce([
        {
          comicId: 'c1',
          lastPage: 5,
          totalPages: 10,
          readStatus: 'READING',
          lastReadAt: new Date('2026-02-01'),
          comic: { title: 'Saga', coverUrl: null, series: 'Saga', issue: 1 },
        },
      ]);

    const res = await GET(getRequest('http://localhost/api/users/u2/profile'), {
      params: Promise.resolve({ id: 'u2' }),
    });
    const body = await res.json();
    expect(body.profile.recentActivity).toHaveLength(1);
    expect(body.profile.recentActivity[0]).toMatchObject({
      comicId: 'c1',
      title: 'Saga',
      percent: 50,
    });
  });
});
