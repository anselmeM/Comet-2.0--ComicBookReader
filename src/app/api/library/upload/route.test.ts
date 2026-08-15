// @vitest-environment node
// Node (undici) Request is required: jsdom's Request can't parse FormData
// request bodies, so req.formData() would hang.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeSession } from '@/test/api-helpers';

vi.mock('@/lib/api-middleware', () => ({ withAuth: (fn: unknown) => fn }));
vi.mock('@/lib/constants', () => ({
  COMIC_CONFIG: { MAX_UPLOAD_SIZE_BYTES: 1024 },
}));

const { mockStorage } = vi.hoisted(() => ({
  mockStorage: { uploadFile: vi.fn(), getComicKey: vi.fn() },
}));
vi.mock('@/lib/storage', () => mockStorage);

import { POST } from './route';

function buildForm(file: File, filehash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', extension = 'cbz'): Request {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('filehash', filehash);
  fd.append('extension', extension);
  return new Request('http://test/api/library/upload', { method: 'POST', body: fd });
}

function cbzFile(bytes: number[] = [0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]): File {
  return new File([new Uint8Array(bytes)], 'comic.cbz', { type: 'application/x-cbz' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStorage.getComicKey.mockReturnValue('user-1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.cbz');
  mockStorage.uploadFile.mockResolvedValue({});
});

describe('POST /api/library/upload', () => {
  it('returns 400 when the extension is invalid', async () => {
    const res = await POST(buildForm(cbzFile(), 'abc', 'exe'), { params: {} }, fakeSession);
    expect(res.status).toBe(400);
    expect(mockStorage.uploadFile).not.toHaveBeenCalled();
  });

  it('returns 413 when the file exceeds the size limit', async () => {
    const big = new File([new Uint8Array(2048)], 'big.cbz', { type: 'application/x-cbz' });
    const res = await POST(buildForm(big, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'cbz'), { params: {} }, fakeSession);
    expect(res.status).toBe(413);
    expect(mockStorage.uploadFile).not.toHaveBeenCalled();
  });

  it('returns 400 when the magic bytes do not match the declared extension', async () => {
    const res = await POST(
      buildForm(cbzFile([0x00, 0x11, 0x22, 0x33]), 'abc', 'cbz'),
      { params: {} },
      fakeSession,
    );
    expect(res.status).toBe(400);
    expect(mockStorage.uploadFile).not.toHaveBeenCalled();
  });

  it('uploads a valid file and returns the storage key', async () => {
    const res = await POST(
      buildForm(cbzFile(), 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'cbz'),
      { params: {} },
      fakeSession,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.key).toBe('user-1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.cbz');
    expect(mockStorage.uploadFile).toHaveBeenCalledWith(
      'user-1/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.cbz',
      expect.any(Buffer),
      'application/x-cbz',
    );
  });

  it('returns 500 when the upload fails', async () => {
    mockStorage.uploadFile.mockRejectedValue(new Error('s3 down'));
    const res = await POST(
      buildForm(cbzFile(), 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'cbz'),
      { params: {} },
      fakeSession,
    );
    expect(res.status).toBe(500);
  });
});
