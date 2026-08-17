/**

 * Route tests: POST /api/storage/multipart/complete — finalize multipart upload.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, jsonRequest } from '@/test/api-helpers';

const auth = vi.hoisted(() => ({ validateSession: vi.fn() }));

vi.mock('@/lib/auth-utils', () => ({
  validateSession: (...args: unknown[]) => auth.validateSession(...args),
}));

vi.mock('@/lib/db', () => ({
  db: {
    comic: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: { completeMultipartUpload: vi.fn() },
}));

vi.mock('@/lib/storage', () => mockStorage);

const { POST } = await import('./route');

const VALID = { comicId: 'comic-1', uploadId: 'up-1', parts: [{ PartNumber: 1, ETag: 'e1' }] };

describe('POST /api/storage/multipart/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });

    db.comic.findFirst.mockResolvedValue({ id: 'comic-1', userId: 'user-1', storageKey: 'k' });

    db.comic.update.mockResolvedValue({});
  });

  it('rejects a missing/invalid parts list', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/storage/multipart/complete', {
        comicId: 'comic-1',

        uploadId: 'up-1',

        parts: [],
      }),

      undefined,

      fakeSession,
    );

    expect(res.status).toBe(400);
  });

  it('rejects a malformed parts entry', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/storage/multipart/complete', {
        comicId: 'comic-1',

        uploadId: 'up-1',

        parts: [{ PartNumber: 'x' }],
      }),

      undefined,

      fakeSession,
    );

    expect(res.status).toBe(400);
  });

  it('returns 404 when the comic is not owned', async () => {
    db.comic.findFirst.mockResolvedValue(null);

    const res = await POST(
      jsonRequest('http://localhost/api/storage/multipart/complete', VALID),
      undefined,
      fakeSession,
    );

    expect(res.status).toBe(404);
  });

  it('completes the upload and marks the comic SYNCED', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/storage/multipart/complete', VALID),
      undefined,
      fakeSession,
    );

    expect(res.status).toBe(200);

    expect(mockStorage.completeMultipartUpload).toHaveBeenCalledWith('k', 'up-1', [
      { PartNumber: 1, ETag: 'e1' },
    ]);

    expect(db.comic.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ syncStatus: 'SYNCED' }) }),
    );
  });
});
