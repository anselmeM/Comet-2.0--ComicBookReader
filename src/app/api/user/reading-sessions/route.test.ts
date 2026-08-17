/**

 * Route tests: GET/DELETE /api/user/reading-sessions — history + cleanup.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, getRequest } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));

vi.mock('@/lib/db', () => ({
  db: {
    readingSession: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

const { GET, DELETE } = await import('./route');

describe('GET /api/user/reading-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.readingSession.findMany.mockResolvedValue([
      { id: 's1', startedAt: new Date(), endedAt: new Date(), createdAt: new Date(), pagesRead: 3 },
    ]);
  });

  it('lists the user sessions (recent + period)', async () => {
    const res = await GET(
      getRequest('http://localhost/api/user/reading-sessions'),
      undefined,
      fakeSession,
    );

    expect(res.status).toBe(200);

    expect(db.readingSession.findMany).toHaveBeenCalledTimes(2);
  });
});

describe('DELETE /api/user/reading-sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    db.readingSession.findUnique.mockResolvedValue({ id: 's1', userId: 'user-1' });

    db.readingSession.delete.mockResolvedValue({ id: 's1' });
  });

  it('deletes a session the user owns', async () => {
    const res = await DELETE(
      getRequest('http://localhost/api/user/reading-sessions?id=s1', { method: 'DELETE' }),

      undefined,

      fakeSession,
    );

    expect(res.status).toBe(200);

    expect(db.readingSession.delete).toHaveBeenCalled();
  });

  it('clears all sessions when no id is given', async () => {
    db.readingSession.deleteMany.mockResolvedValue({ count: 4 });

    const res = await DELETE(
      getRequest('http://localhost/api/user/reading-sessions', { method: 'DELETE' }),

      undefined,

      fakeSession,
    );

    expect(res.status).toBe(200);

    expect(db.readingSession.deleteMany).toHaveBeenCalled();
  });
});
