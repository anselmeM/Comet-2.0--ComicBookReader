/**
 * Route tests: POST /api/storage/multipart/init — presigned multipart init
 * (C2: the live upload path; size cap + ownership guard).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { fakeSession, jsonRequest } from '@/test/api-helpers';

vi.mock('@/lib/db', () => ({
  db: {
    comic: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/constants', () => ({
  COMIC_CONFIG: { MAX_UPLOAD_SIZE_BYTES: 1024 },
}));

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: { createMultipartUpload: vi.fn(), verifyStorageConfig: vi.fn(() => true) },
}));
vi.mock('@/lib/storage', () => mockStorage);

const auth = vi.hoisted(() => ({ validateSession: vi.fn() }));
vi.mock('@/lib/auth-utils', () => ({
  validateSession: (...args: unknown[]) => auth.validateSession(...args),
}));

const { POST } = await import('./route');

const VALID_BODY = {
  comicId: 'comic-1',
  contentType: 'application/x-cbz',
  fileName: 'comic.cbz',
  fileSize: 100,
};

describe('POST /api/storage/multipart/init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });
    db.comic.findFirst.mockResolvedValue({ id: 'comic-1', userId: 'user-1' });
    mockStorage.createMultipartUpload.mockResolvedValue({
      uploadId: 'up-1',
      partUrls: ['https://s3/part/1'],
      partSize: 10 * 1024 * 1024,
    });
  });

  it('rejects unauthenticated requests', async () => {
    auth.validateSession.mockResolvedValue({
      session: null,
      errorResponse: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });
    const res = await POST(jsonRequest('http://localhost/api/storage/multipart/init', VALID_BODY));
    expect(res.status).toBe(401);
  });

  it('rejects missing fields', async () => {
    const res = await POST(jsonRequest('http://localhost/api/storage/multipart/init', {}));
    expect(res.status).toBe(400);
  });

  it('rejects a file over the 1GB cap with 413', async () => {
    const res = await POST(
      jsonRequest('http://localhost/api/storage/multipart/init', {
        ...VALID_BODY,
        fileSize: 1025,
      }),
    );
    expect(res.status).toBe(413);
    expect(mockStorage.createMultipartUpload).not.toHaveBeenCalled();
  });

  it('returns 404 when the comic is not owned by the user', async () => {
    db.comic.findFirst.mockResolvedValue(null);
    const res = await POST(jsonRequest('http://localhost/api/storage/multipart/init', VALID_BODY));
    expect(res.status).toBe(404);
  });

  it('creates the multipart upload and returns presigned part URLs', async () => {
    const res = await POST(jsonRequest('http://localhost/api/storage/multipart/init', VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockStorage.createMultipartUpload).toHaveBeenCalledWith(
      'user-1/comic-1/comic.cbz',
      'application/x-cbz',
      100,
    );
    const body = await res.json();
    expect(body.uploadId).toBe('up-1');
    expect(body.partUrls).toHaveLength(1);
  });
});
