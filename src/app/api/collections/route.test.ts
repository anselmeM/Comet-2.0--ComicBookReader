/**
 * Route tests: GET/POST /api/collections — list + create with dup guard.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { fakeSession, getRequest, jsonRequest } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));
vi.mock('@/lib/db', () => ({
  db: {
    collection: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));

const { GET, POST } = await import('./route');

describe('GET /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.collection.findMany.mockResolvedValue([{ id: 'c-1', name: 'Favs' }]);
  });

  it('lists the user collections', async () => {
    const res = await GET(getRequest('http://localhost/api/collections'), undefined, fakeSession);
    expect(res.status).toBe(200);
    expect(db.collection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    );
    const body = await res.json();
    expect(body.collections).toHaveLength(1);
  });
});

describe('POST /api/collections', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.collection.create.mockResolvedValue({ id: 'c-1', name: 'Favs', description: null });
  });

  it('rejects an invalid body', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/collections', { name: '' }),
      undefined,
      fakeSession,
    );
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate collection name', async () => {
    db.collection.findUnique.mockResolvedValue({ id: 'c-dup', userId: 'user-1', name: 'Favs' });
    const res = await POST(
      jsonRequest('http://localhost/api/collections', { name: 'Favs' }),
      undefined,
      fakeSession,
    );
    expect(res.status).toBe(400);
    expect(db.collection.create).not.toHaveBeenCalled();
  });

  it('creates a collection', async () => {
    db.collection.findUnique.mockResolvedValue(null);
    const res = await POST(
      jsonRequest('http://localhost/api/collections', { name: 'Favs', description: 'x' }),
      undefined,
      fakeSession,
    );
    expect(res.status).toBe(200);
    expect(db.collection.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', name: 'Favs', description: 'x' },
    });
  });
});
