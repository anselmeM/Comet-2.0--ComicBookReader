/**
 * Route tests: POST /api/feed/react — toggle reaction with visibility rules.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { fakeSession, jsonRequest } from '@/test/api-helpers';

vi.mock('@/lib/db', () => ({
  db: {
    readingProgress: { findUnique: vi.fn() },
    friendship: { findFirst: vi.fn() },
    activityReaction: { findUnique: vi.fn(), delete: vi.fn(), create: vi.fn() },
  },
}));

const auth = vi.hoisted(() => ({ validateSession: vi.fn() }));
vi.mock('@/lib/auth-utils', () => ({
  validateSession: (...args: unknown[]) => auth.validateSession(...args),
}));

const { POST } = await import('./route');

const VALID_BODY = { activityId: 'act-1', reactionType: 'FIRE' };

describe('POST /api/feed/react', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });
    db.readingProgress.findUnique.mockResolvedValue({ id: 'act-1', userId: 'u2' });
    db.friendship.findFirst.mockResolvedValue({ id: 'f1' });
    db.activityReaction.findUnique.mockResolvedValue(null);
    db.activityReaction.create.mockResolvedValue({ id: 'r1' });
  });

  it('rejects unauthenticated requests', async () => {
    auth.validateSession.mockResolvedValue({
      session: null,
      errorResponse: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });
    const res = await POST(jsonRequest('http://localhost/api/feed/react', VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('rejects an invalid reaction type', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/feed/react', { activityId: 'act-1', reactionType: 'NOPE' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when the activity does not exist', async () => {
    db.readingProgress.findUnique.mockResolvedValue(null);
    const res = await POST(jsonRequest('http://localhost/api/feed/react', VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('returns 403 when the activity belongs to a non-friend', async () => {
    db.friendship.findFirst.mockResolvedValue(null);
    const res = await POST(jsonRequest('http://localhost/api/feed/react', VALID_BODY));
    expect(res.status).toBe(403);
  });

  it('creates a reaction when none exists', async () => {
    const res = await POST(jsonRequest('http://localhost/api/feed/react', VALID_BODY));
    expect(res.status).toBe(200);
    expect(db.activityReaction.create).toHaveBeenCalled();
    const body = await res.json();
    expect(body.reacted).toBe(true);
  });

  it('removes the reaction when one already exists', async () => {
    db.activityReaction.findUnique.mockResolvedValue({ id: 'r1' });
    const res = await POST(jsonRequest('http://localhost/api/feed/react', VALID_BODY));
    expect(res.status).toBe(200);
    expect(db.activityReaction.delete).toHaveBeenCalled();
    const body = await res.json();
    expect(body.reacted).toBe(false);
  });
});
