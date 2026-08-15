import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSession, getRequest } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));

const { mockDb, storage, logger } = vi.hoisted(() => ({
  mockDb: {} as any,
  storage: { getDownloadUrl: vi.fn() },
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/db', async () => {
  const { createMockDb } = await import('@/test/api-helpers');
  const db = createMockDb();
  Object.assign(mockDb, db);
  return { db };
});
vi.mock('@/lib/storage', () => storage);
vi.mock('@/lib/logger', () => ({ logger }));

import { GET } from './route';

function callGet(comicId: string) {
  return GET(
    getRequest(`http://test/api/comics/${comicId}/download`),
    { params: Promise.resolve({ id: comicId }) },
    fakeSession,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.comic.findUnique.mockResolvedValue({ storageKey: 'user-1/comic-1.cbz' });
  storage.getDownloadUrl.mockResolvedValue('https://signed.test/download');
});

describe('GET /api/comics/[id]/download', () => {
  it('returns 404 when the comic is not found or not synced', async () => {
    mockDb.comic.findUnique.mockResolvedValue(null);
    const res = await callGet('comic-1');
    expect(res.status).toBe(404);
  });

  it('scopes the lookup to the current user', async () => {
    await callGet('comic-1');
    expect(mockDb.comic.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'comic-1', userId: 'user-1' } }),
    );
  });

  it('returns the download URL with a 10-minute expiry', async () => {
    const res = await callGet('comic-1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.downloadUrl).toBe('https://signed.test/download');
    expect(storage.getDownloadUrl).toHaveBeenCalledWith('user-1/comic-1.cbz', 600);
  });

  it('returns 500 when URL generation fails', async () => {
    storage.getDownloadUrl.mockRejectedValue(new Error('s3 down'));
    const res = await callGet('comic-1');
    expect(res.status).toBe(500);
  });
});
