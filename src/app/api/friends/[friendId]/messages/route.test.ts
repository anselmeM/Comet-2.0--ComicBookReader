/**

 * Route tests: GET /api/friends/[friendId]/messages — cursor pagination.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, getRequest, jsonRequest } from '@/test/api-helpers';

vi.mock('@/lib/db', () => ({
  db: {
    friendship: {
      findFirst: vi.fn(),
    },

    directMessage: {
      findMany: vi.fn(),

      create: vi.fn(),

      updateMany: vi.fn(),
    },

    notification: {
      create: vi.fn(),
    },
  },
}));

const auth = vi.hoisted(() => ({ validateSession: vi.fn() }));

vi.mock('@/lib/auth-utils', () => ({
  validateSession: (...args: unknown[]) => auth.validateSession(...args),
}));

const { GET, POST } = await import('./route');

function msg(overrides: Partial<{ id: string; createdAt: Date }> = {}) {
  return {
    id: overrides.id ?? 'm-1',

    senderId: 'user-2',

    receiverId: 'user-1',

    message: 'hello',

    isRead: false,

    createdAt: overrides.createdAt ?? new Date('2026-08-01T00:00:00Z'),

    sender: { id: 'user-2', name: 'Friend', image: null },
  };
}

describe('GET /api/friends/[friendId]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });

    db.friendship.findFirst.mockResolvedValue({ id: 'f1' });

    db.directMessage.updateMany.mockResolvedValue({ count: 0 });
  });

  it('rejects unauthenticated requests', async () => {
    auth.validateSession.mockResolvedValue({
      session: null,

      errorResponse: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    const res = await GET(getRequest('http://localhost/api/friends/user-2/messages'), {
      params: Promise.resolve({ friendId: 'user-2' }),
    });

    expect(res.status).toBe(401);
  });

  it('returns 403 when the users are not friends', async () => {
    db.friendship.findFirst.mockResolvedValue(null);

    const res = await GET(getRequest('http://localhost/api/friends/user-2/messages'), {
      params: Promise.resolve({ friendId: 'user-2' }),
    });

    expect(res.status).toBe(403);

    expect(db.directMessage.findMany).not.toHaveBeenCalled();
  });

  it('fetches the newest page with take=50 and no cursor', async () => {
    db.directMessage.findMany.mockResolvedValue([msg()]);

    const res = await GET(getRequest('http://localhost/api/friends/user-2/messages'), {
      params: Promise.resolve({ friendId: 'user-2' }),
    });

    expect(db.directMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },

        take: 50,

        where: expect.objectContaining({
          OR: [
            { senderId: 'user-1', receiverId: 'user-2' },

            { senderId: 'user-2', receiverId: 'user-1' },
          ],
        }),
      }),
    );

    const body = await res.json();

    expect(body.messages).toHaveLength(1);

    expect(body.nextCursor).toBeNull(); // fewer than limit → no older page
  });

  it('returns nextCursor when a full page was returned', async () => {
    const last = msg({ id: 'm-50', createdAt: new Date('2026-01-01T00:00:00Z') });

    const page = Array.from({ length: 50 }, (_, i) =>
      msg({ id: `m-${i}`, createdAt: new Date(`2026-08-0${(i % 9) + 1}T00:00:00Z`) }),
    );

    page[49] = last;

    db.directMessage.findMany.mockResolvedValue(page);

    const res = await GET(getRequest('http://localhost/api/friends/user-2/messages'), {
      params: Promise.resolve({ friendId: 'user-2' }),
    });

    const body = await res.json();

    expect(body.messages).toHaveLength(50);

    expect(body.nextCursor).toBe('2026-01-01T00:00:00.000Z');
  });

  it('applies the cursor as a createdAt-lt filter', async () => {
    db.directMessage.findMany.mockResolvedValue([]);

    await GET(
      getRequest(
        'http://localhost/api/friends/user-2/messages?cursor=2026-01-01T00%3A00%3A00.000Z&limit=20',
      ),

      { params: Promise.resolve({ friendId: 'user-2' }) },
    );

    expect(db.directMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,

        where: expect.objectContaining({
          createdAt: { lt: new Date('2026-01-01T00:00:00.000Z') },
        }),
      }),
    );
  });

  it('clamps the limit to 100', async () => {
    db.directMessage.findMany.mockResolvedValue([]);

    await GET(getRequest('http://localhost/api/friends/user-2/messages?limit=9999'), {
      params: Promise.resolve({ friendId: 'user-2' }),
    });

    expect(db.directMessage.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });

  it('marks received messages as read', async () => {
    const received = msg({ id: 'm-unread' });

    db.directMessage.findMany.mockResolvedValue([received]);

    await GET(getRequest('http://localhost/api/friends/user-2/messages'), {
      params: Promise.resolve({ friendId: 'user-2' }),
    });

    expect(db.directMessage.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['m-unread'] } },

      data: { isRead: true },
    });
  });
});

describe('POST /api/friends/[friendId]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });

    db.friendship.findFirst.mockResolvedValue({ id: 'f1' });
  });

  it('rejects a missing message', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/friends/user-2/messages', {}),

      { params: Promise.resolve({ friendId: 'user-2' }) },
    );

    expect(res.status).toBe(400);

    expect(db.directMessage.create).not.toHaveBeenCalled();
  });

  it('rejects a message over 1000 chars', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/friends/user-2/messages', {
        message: 'x'.repeat(1001),
      }),

      { params: Promise.resolve({ friendId: 'user-2' }) },
    );

    expect(res.status).toBe(400);
  });

  it('creates a trimmed message', async () => {
    db.directMessage.create.mockResolvedValue(msg());

    const res = await POST(
      jsonRequest('http://localhost/api/friends/user-2/messages', {
        message: '  hey there  ',
      }),

      { params: Promise.resolve({ friendId: 'user-2' }) },
    );

    expect(res.status).toBe(201);

    expect(db.directMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderId: 'user-1',

          receiverId: 'user-2',

          message: 'hey there',
        }),
      }),
    );
  });
});
