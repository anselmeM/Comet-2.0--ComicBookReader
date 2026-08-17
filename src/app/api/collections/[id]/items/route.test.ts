import { describe, it, expect, vi, beforeEach } from 'vitest';

import { POST, DELETE } from './route';

import { db } from '@/lib/db';

import { auth } from '@/auth';

import { Session } from 'next-auth';

vi.mock('@/auth', () => ({
  auth: vi.fn() as any,
}));

type CometSession = Session & {
  user: { id: string; plan: string; hasCompletedOnboarding: boolean };
};

vi.mock('@/lib/db', () => ({
  db: {
    collection: {
      findUnique: vi.fn(),
    },

    comic: {
      findUnique: vi.fn(),
    },

    collectionItem: {
      upsert: vi.fn(),

      delete: vi.fn(),
    },
  },
}));

describe('Collection Items API Route', () => {
  const mockSession: CometSession = {
    user: {
      id: 'user-123',

      plan: 'FREE',

      hasCompletedOnboarding: true,
    },

    expires: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const req = new Request('http://localhost:3100/api/collections/col-123/items', {
        method: 'POST',

        headers: { 'content-type': 'application/json' },

        body: JSON.stringify({ comicId: 'comic-123' }),
      });

      const response = await POST(req, { params: Promise.resolve({ id: 'col-123' }) });

      expect(response.status).toBe(401);
    });

    it('should return 404 if collection does not belong to user', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession);

      vi.mocked(db.collection.findUnique).mockResolvedValue(null);

      const req = new Request('http://localhost:3100/api/collections/col-123/items', {
        method: 'POST',

        headers: { 'content-type': 'application/json' },

        body: JSON.stringify({ comicId: 'comic-123' }),
      });

      const response = await POST(req, { params: Promise.resolve({ id: 'col-123' }) });

      expect(response.status).toBe(404);

      const data = await response.json();

      expect(data.error).toBe('Collection not found');
    });

    it('should return 404 if comic does not belong to user', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession);

      vi.mocked(db.collection.findUnique).mockResolvedValue({
        id: 'col-123',

        userId: 'user-123',
      } as any);

      vi.mocked(db.comic.findUnique).mockResolvedValue(null); // Not found or different user

      const req = new Request('http://localhost:3100/api/collections/col-123/items', {
        method: 'POST',

        headers: { 'content-type': 'application/json' },

        body: JSON.stringify({ comicId: 'comic-123' }),
      });

      const response = await POST(req, { params: Promise.resolve({ id: 'col-123' }) });

      expect(response.status).toBe(404);

      const data = await response.json();

      expect(data.error).toContain('access denied');
    });

    it('should add item to collection if both belong to user', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession);

      vi.mocked(db.collection.findUnique).mockResolvedValue({
        id: 'col-123',

        userId: 'user-123',
      } as any);

      vi.mocked(db.comic.findUnique).mockResolvedValue({
        id: 'comic-123',

        userId: 'user-123',
      } as any);

      vi.mocked(db.collectionItem.upsert).mockResolvedValue({ id: 'ci-1' } as any);

      const req = new Request('http://localhost:3100/api/collections/col-123/items', {
        method: 'POST',

        headers: { 'content-type': 'application/json' },

        body: JSON.stringify({ comicId: 'comic-123' }),
      });

      const response = await POST(req, { params: Promise.resolve({ id: 'col-123' }) });

      expect(response.status).toBe(200);

      expect(db.collectionItem.upsert).toHaveBeenCalled();
    });

    it('should return 400 when comicId is missing', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession);

      const req = new Request('http://localhost:3100/api/collections/col-123/items', {
        method: 'POST',

        headers: { 'content-type': 'application/json' },

        body: JSON.stringify({}),
      });

      const response = await POST(req, { params: Promise.resolve({ id: 'col-123' }) });

      expect(response.status).toBe(400);
    });

    it('should remove a comic from the collection', async () => {
      vi.mocked(auth).mockResolvedValue(mockSession);

      vi.mocked(db.collectionItem.delete).mockResolvedValue({ id: 'ci-1' } as any);

      const req = new Request(
        'http://localhost:3100/api/collections/col-123/items?comicId=comic-123',

        { method: 'DELETE' },
      );

      const response = await DELETE(req, { params: Promise.resolve({ id: 'col-123' }) });

      expect(response.status).toBe(200);

      expect(db.collectionItem.delete).toHaveBeenCalled();
    });
  });
});
