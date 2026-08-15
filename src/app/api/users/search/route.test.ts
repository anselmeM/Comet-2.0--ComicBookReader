import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSession, getRequest } from '@/test/api-helpers';

const { mockDb, authUtils, logger } = vi.hoisted(() => ({
  mockDb: {} as any,
  authUtils: { validateSession: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/db', async () => {
  const { createMockDb } = await import('@/test/api-helpers');
  const db = createMockDb();
  Object.assign(mockDb, db);
  return { db };
});
vi.mock('@/lib/auth-utils', () => authUtils);
vi.mock('@/lib/logger', () => ({ logger }));

import { GET } from './route';

function callGet(q?: string) {
  const url = q ? `http://test/api/users/search?q=${encodeURIComponent(q)}` : 'http://test/api/users/search';
  return GET(getRequest(url));
}

beforeEach(() => {
  vi.clearAllMocks();
  authUtils.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });
  mockDb.user.findMany.mockResolvedValue([]);
  mockDb.friendship.findMany.mockResolvedValue([]);
  mockDb.friendRequest.findMany.mockResolvedValue([]);
});

describe('GET /api/users/search', () => {
  it('returns an empty list when the query is missing or too short', async () => {
    for (const q of [undefined, 'a']) {
      const res = await callGet(q);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users).toEqual([]);
      expect(mockDb.user.findMany).not.toHaveBeenCalled();
    }
  });

  it('excludes the current user and only matches by name', async () => {
    mockDb.user.findMany.mockResolvedValue([{ id: 'u2', name: 'Alice' }]);
    await callGet('ali');
    expect(mockDb.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [{ name: { contains: 'ali' } }, { id: { not: 'user-1' } }],
        },
      }),
    );
  });

  it('marks friends, sent, and received request statuses from batched queries', async () => {
    mockDb.user.findMany.mockResolvedValue([
      { id: 'u-friend', name: 'Friend' },
      { id: 'u-sent', name: 'Sent' },
      { id: 'u-received', name: 'Received' },
      { id: 'u-none', name: 'None' },
    ]);
    mockDb.friendship.findMany.mockResolvedValue([
      { userId: 'user-1', friendId: 'u-friend' },
    ]);
    mockDb.friendRequest.findMany.mockResolvedValue([
      { id: 'req-1', senderId: 'user-1', receiverId: 'u-sent' },
      { id: 'req-2', senderId: 'u-received', receiverId: 'user-1' },
    ]);

    const res = await callGet('zz');
    const body = await res.json();

    expect(body.users).toEqual([
      expect.objectContaining({ id: 'u-friend', status: 'FRIEND' }),
      expect.objectContaining({ id: 'u-sent', status: 'REQUEST_SENT', requestId: 'req-1' }),
      expect.objectContaining({ id: 'u-received', status: 'REQUEST_RECEIVED', requestId: 'req-2' }),
      expect.objectContaining({ id: 'u-none', status: 'NONE' }),
    ]);
  });
});
