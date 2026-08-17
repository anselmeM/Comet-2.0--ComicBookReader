/**

 * Route tests: GET /api/user/stats — aggregated reading stats.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, getRequest } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));

vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn() },

    readingProgress: { aggregate: vi.fn(), count: vi.fn() },

    $transaction: vi.fn(),
  },
}));

const { GET } = await import('./route');

describe('GET /api/user/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Me' });

    db.readingProgress.aggregate.mockResolvedValue({
      _sum: { totalTimeSpent: 3600 },

      _max: { lastReadAt: new Date('2026-08-01') },
    });

    db.readingProgress.count.mockResolvedValue(3);

    db.$transaction.mockImplementation(async (arr: Promise<unknown>[]) => Promise.all(arr));
  });

  it('returns the aggregated stats', async () => {
    const res = await GET(getRequest('http://localhost/api/user/stats'), undefined, fakeSession);

    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body.timeSpentSeconds).toBe(3600);

    expect(body.comicsFinished).toBe(3);

    expect(db.readingProgress.aggregate).toHaveBeenCalled();
  });
});
