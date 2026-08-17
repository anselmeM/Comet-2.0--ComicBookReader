/**

 * Route tests: GET/POST/DELETE /api/notifications — list, mark-read, clear.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, getRequest } from '@/test/api-helpers';

vi.mock('@/lib/db', () => ({
  db: {
    notification: { findMany: vi.fn(), count: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

const auth = vi.hoisted(() => ({ validateSession: vi.fn() }));

vi.mock('@/lib/auth-utils', () => ({
  validateSession: (...args: unknown[]) => auth.validateSession(...args),
}));

const { GET, PATCH, DELETE } = await import('./route');

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });

    db.notification.findMany.mockResolvedValue([{ id: 'n1', message: 'hi' }]);

    db.notification.count.mockResolvedValue(1);
  });

  it('rejects unauthenticated requests', async () => {
    auth.validateSession.mockResolvedValue({
      session: null,

      errorResponse: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    const res = await GET(getRequest('http://localhost/api/notifications'));

    expect(res.status).toBe(401);
  });

  it('lists notifications with an unread count', async () => {
    const res = await GET(getRequest('http://localhost/api/notifications'));

    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body.notifications).toHaveLength(1);

    expect(body.unreadCount).toBe(1);
  });
});

describe('PATCH /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });

    db.notification.updateMany.mockResolvedValue({ count: 2 });
  });

  it('marks all notifications as read', async () => {
    const res = await PATCH(new Request('http://localhost/api/notifications', { method: 'PATCH' }));

    expect(res.status).toBe(200);

    expect(db.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    );
  });
});

describe('DELETE /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });

    db.notification.deleteMany.mockResolvedValue({ count: 3 });
  });

  it('clears all notifications', async () => {
    const res = await DELETE(
      new Request('http://localhost/api/notifications', { method: 'DELETE' }),
    );

    expect(res.status).toBe(200);

    expect(db.notification.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    );
  });
});
