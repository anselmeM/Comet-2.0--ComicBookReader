import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSession, getRequest } from '@/test/api-helpers';

const { mockDb, storage, presigner, authUtils, logger } = vi.hoisted(() => ({
  mockDb: {} as any,
  storage: {
    s3: {},
    BUCKET_NAME: 'comet-test-bucket',
    verifyStorageConfig: vi.fn(),
  },
  presigner: { getSignedUrl: vi.fn() },
  authUtils: { validateSession: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/db', async () => {
  const { createMockDb } = await import('@/test/api-helpers');
  const db = createMockDb();
  Object.assign(mockDb, db);
  return { db };
});
vi.mock('@/lib/storage', () => storage);
vi.mock('@/lib/auth-utils', () => authUtils);
vi.mock('@/lib/logger', () => ({ logger }));
vi.mock('@aws-sdk/s3-request-presigner', () => presigner);
vi.mock('@aws-sdk/client-s3', () => ({ GetObjectCommand: class GetObjectCommand {} }));

import { GET } from './route';

function callGet(url: string) {
  return GET(getRequest(url));
}

beforeEach(() => {
  vi.clearAllMocks();
  authUtils.validateSession.mockResolvedValue({ session: fakeSession, errorResponse: null });
  storage.verifyStorageConfig.mockReturnValue(true);
  presigner.getSignedUrl.mockResolvedValue('https://signed.test/url?X-Amz-Expires=3600');
  mockDb.comic.findFirst.mockResolvedValue({ storageKey: 'user-1/comic-1.cbz' });
});

describe('GET /api/storage/download', () => {
  it('returns 401 when the session is invalid', async () => {
    authUtils.validateSession.mockResolvedValue({
      session: null,
      errorResponse: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });
    const res = await callGet('http://test/api/storage/download?comicId=comic-1');
    expect(res.status).toBe(401);
  });

  it('returns 400 when comicId is missing', async () => {
    const res = await callGet('http://test/api/storage/download');
    expect(res.status).toBe(400);
    expect(mockDb.comic.findFirst).not.toHaveBeenCalled();
  });

  it('returns 404 when the comic is not found or not synced', async () => {
    mockDb.comic.findFirst.mockResolvedValue(null);
    const res = await callGet('http://test/api/storage/download?comicId=comic-1');
    expect(res.status).toBe(404);
  });

  it('returns 503 when storage is not configured outside dev', async () => {
    storage.verifyStorageConfig.mockReturnValue(false);
    const res = await callGet('http://test/api/storage/download?comicId=comic-1');
    expect(res.status).toBe(503);
  });

  it('scopes the lookup to the current user (no cross-user access)', async () => {
    await callGet('http://test/api/storage/download?comicId=comic-1');
    expect(mockDb.comic.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'comic-1', userId: 'user-1' } }),
    );
  });

  it('returns a pre-signed URL when storage is configured', async () => {
    const res = await callGet('http://test/api/storage/download?comicId=comic-1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://signed.test/url?X-Amz-Expires=3600');
    expect(presigner.getSignedUrl).toHaveBeenCalledWith(
      storage.s3,
      expect.any(Object),
      expect.objectContaining({ expiresIn: 3600 }),
    );
  });

  it('returns 500 when the database call throws', async () => {
    mockDb.comic.findFirst.mockRejectedValue(new Error('db down'));
    const res = await callGet('http://test/api/storage/download?comicId=comic-1');
    expect(res.status).toBe(500);
  });
});
