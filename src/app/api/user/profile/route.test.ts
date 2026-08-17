/**
 * Route tests: PUT /api/user/profile — validation + rate limit + update.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { fakeSession, jsonRequest } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));
vi.mock('@/lib/db', () => ({
  db: { user: { update: vi.fn() } },
}));

const { mockRateLimit } = vi.hoisted(() => ({
  mockRateLimit: vi.fn(),
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

const { PUT } = await import('./route');

describe('PUT /api/user/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue({ isLimited: false, headers: {} });
    db.user.update.mockResolvedValue({ id: 'user-1', name: 'New' });
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ isLimited: true, headers: {} });
    const res = await PUT(
      jsonRequest('http://localhost/api/user/profile', { name: 'x' }),
      undefined,
      fakeSession,
    );
    expect(res.status).toBe(429);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('rejects an invalid body', async () => {
    const res = await PUT(
      jsonRequest('http://localhost/api/user/profile', { name: 'a' }), // too short
      undefined,
      fakeSession,
    );
    expect(res.status).toBe(400);
  });

  it('updates the profile', async () => {
    const res = await PUT(
      jsonRequest('http://localhost/api/user/profile', { name: 'New Name' }),
      undefined,
      fakeSession,
    );
    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ name: 'New Name' }),
      }),
    );
  });
});
