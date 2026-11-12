import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateSession, requireAuth } from './auth-utils';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const linkedUser = {
  id: 'user-123',
  clerkId: 'user_clerk123',
  plan: 'FREE',
  role: 'USER',
  hasCompletedOnboarding: true,
  defaultReadingMode: 'single-page',
  theme: 'dark',
  name: 'Test User',
  image: null,
  email: 'test@example.com',
};

describe('auth-utils (Clerk)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Keep Clerk auth enabled for these tests; a keyless environment short-circuits
    // resolveAppUser before it reaches the mocked `auth()`.
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'pk_test_unit');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('validateSession', () => {
    it('should return session when Clerk user is already linked', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: 'user_clerk123',
      });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(linkedUser);

      const result = await validateSession();

      expect(result.session?.user.id).toBe('user-123');
      expect(result.session?.user.plan).toBe('FREE');
      expect(result.errorResponse).toBeNull();
    });

    it('should return errorResponse when not authenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

      const result = await validateSession();

      expect(result.session).toBeNull();
      expect(result.errorResponse).toBeInstanceOf(NextResponse);
      expect(result.errorResponse?.status).toBe(401);
    });

    it('should link a legacy account by email on first Clerk sign-in', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: 'user_clerk456',
      });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (currentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        primaryEmailAddressId: 'email_1',
        emailAddresses: [{ id: 'email_1', emailAddress: 'legacy@example.com' }],
        firstName: 'Legacy',
        lastName: 'User',
        username: null,
        imageUrl: null,
      });
      const legacy = { ...linkedUser, id: 'legacy-1', clerkId: null };
      (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(legacy);
      (db.user.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...legacy,
        clerkId: 'user_clerk456',
      });

      const result = await validateSession();

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: 'legacy-1' },
        data: expect.objectContaining({ clerkId: 'user_clerk456' }),
      });
      expect(result.session?.user.id).toBe('legacy-1');
      expect(result.errorResponse).toBeNull();
    });

    it('should provision a new user when no legacy account exists', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: 'user_clerk789',
      });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (currentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        primaryEmailAddressId: 'email_1',
        emailAddresses: [{ id: 'email_1', emailAddress: 'new@example.com' }],
        firstName: 'New',
        lastName: 'User',
        username: null,
        imageUrl: null,
      });
      (db.user.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (db.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...linkedUser,
        id: 'new-1',
        clerkId: 'user_clerk789',
        email: 'new@example.com',
      });

      const result = await validateSession();

      expect(db.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ clerkId: 'user_clerk789' }),
      });
      expect(result.session?.user.id).toBe('new-1');
      expect(result.errorResponse).toBeNull();
    });

    it('should return the placeholder session in a keyless environment', async () => {
      vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', '');
      vi.stubEnv('NODE_ENV', 'development');
      vi.stubEnv('ALLOW_KEYLESS_AUTH', '');

      const result = await validateSession();

      expect(result.errorResponse).toBeNull();
      expect(result.session?.user.id).toBe('user-1');
      expect(auth).not.toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    it('should return session when authenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        userId: 'user_clerk123',
      });
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(linkedUser);

      const result = await requireAuth();

      expect(result.user.id).toBe('user-123');
    });

    it('should throw error when not authenticated', async () => {
      (auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ userId: null });

      await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });
  });
});
