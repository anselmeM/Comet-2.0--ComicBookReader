/**

 * Route tests: POST /api/storage/multipart/abort — cancel a multipart upload.

 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '@/lib/db';

import { fakeSession, jsonRequest } from '@/test/api-helpers';

const auth = vi.hoisted(() => ({ validateSession: vi.fn() }));

vi.mock('@/lib/auth-utils', () => ({
  validateSession: (...args: unknown[]) => auth.validateSession(...args),
}));

vi.mock('@/lib/db', () => ({
  db: { comic: { findFirst: vi.fn(), update: vi.fn() } },
}));

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: { abortMultipartUpload: vi.fn() },
}));

vi.mock('@/lib/storage', () => mockStorage);

const { POST } = await import('./route');

describe('POST /api/storage/multipart/abort', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });

    db.comic.findFirst.mockResolvedValue({ id: 'comic-1', userId: 'user-1', storageKey: 'k' });

    mockStorage.abortMultipartUpload.mockResolvedValue(undefined);
  });

  it('rejects a missing uploadId', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/storage/multipart/abort', { comicId: 'comic-1' }),

      undefined,

      fakeSession,
    );

    expect(res.status).toBe(400);
  });

  it('returns 404 when the comic is not owned', async () => {
    db.comic.findFirst.mockResolvedValue(null);

    const res = await POST(
      jsonRequest('http://localhost/api/storage/multipart/abort', {
        comicId: 'comic-1',

        uploadId: 'up-1',
      }),

      undefined,

      fakeSession,
    );

    expect(res.status).toBe(404);
  });

  it('aborts the upload and marks the comic ERROR', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/storage/multipart/abort', {
        comicId: 'comic-1',

        uploadId: 'up-1',
      }),

      undefined,

      fakeSession,
    );

    expect(res.status).toBe(200);

    expect(mockStorage.abortMultipartUpload).toHaveBeenCalledWith('k', 'up-1');

    expect(db.comic.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ syncStatus: 'ERROR' }) }),
    );
  });
});
