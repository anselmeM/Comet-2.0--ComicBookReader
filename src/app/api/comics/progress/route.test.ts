import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './route';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { Session } from 'next-auth';
import { invalidateCache } from '@/lib/cache';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  invalidateCache: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    readingProgress: {
      deleteMany: vi.fn(),
    },
    comic: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

type CometSession = Session & {
  user: { id: string };
};

describe('Reading Progress Bulk API Route', () => {
  const mockSession: CometSession = {
    user: {
      id: 'user-123',
    },
    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if unauthorized', async () => {
    (auth as any).mockResolvedValue(null);
    const response = await DELETE(new Request('http://localhost:3100'), {});
    expect(response.status).toBe(401);
  });

  it('should delete all reading progress and reset lastReadAt for current user', async () => {
    (auth as any).mockResolvedValue(mockSession);
    vi.mocked(db.readingProgress.deleteMany).mockResolvedValue({ count: 5 } as any);
    vi.mocked(db.comic.updateMany).mockResolvedValue({ count: 5 } as any);
    vi.mocked(invalidateCache).mockResolvedValue(undefined as any);

    const response = await DELETE(new Request('http://localhost:3100', { method: 'DELETE' }), {});
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.readingProgress.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    });
    expect(db.comic.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      data: { lastReadAt: null },
    });
    expect(invalidateCache).toHaveBeenCalledWith('comet:u:user-123:library', true);
  });
});
