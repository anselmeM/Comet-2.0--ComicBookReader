/**
 * Route tests: PATCH/DELETE /api/collections/[id] — rename + delete.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { fakeSession, jsonRequest } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));
vi.mock('@/lib/db', () => ({
  db: {
    collection: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

const { PATCH, DELETE } = await import('./route');
const params = Promise.resolve({ id: 'col-1' });

describe('PATCH /api/collections/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.collection.update.mockResolvedValue({ id: 'col-1', name: 'New' });
  });

  it('rejects an invalid body', async () => {
    const res = await PATCH(
      jsonRequest('http://localhost/api/collections/col-1', { name: '' }),
      { params },
      fakeSession,
    );
    expect(res.status).toBe(400);
  });

  it('renames the collection scoped to the user', async () => {
    const res = await PATCH(
      jsonRequest('http://localhost/api/collections/col-1', { name: 'New' }),
      { params },
      fakeSession,
    );
    expect(res.status).toBe(200);
    expect(db.collection.update).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
      data: { name: 'New' },
    });
  });
});

describe('DELETE /api/collections/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.collection.delete.mockResolvedValue({ id: 'col-1' });
  });

  it('deletes the collection', async () => {
    const res = await DELETE(
      new Request('http://localhost/api/collections/col-1', { method: 'DELETE' }),
      { params },
      fakeSession,
    );
    expect(res.status).toBe(200);
    expect(db.collection.delete).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
    });
  });
});
