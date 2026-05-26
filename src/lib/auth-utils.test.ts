import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateSession, requireAuth } from './auth-utils';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { Session } from 'next-auth';

// Use a more generic mock to satisfy TS
vi.mock('@/auth', () => ({
  auth: vi.fn() as any,
}));

describe('auth-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateSession', () => {
    it('should return session when authenticated', async () => {
      const mockSession: Session = {
        user: { 
          id: 'user-123', 
          plan: 'FREE', 
          hasCompletedOnboarding: true,
          role: 'USER',
          defaultReadingMode: 'single-page',
          theme: 'dark'
        },
        expires: new Date().toISOString(),
      };
      (auth as any).mockResolvedValue(mockSession);

      const result = await validateSession();

      expect(result.session).toEqual(mockSession);
      expect(result.errorResponse).toBeNull();
    });

    it('should return errorResponse when not authenticated', async () => {
      (auth as any).mockResolvedValue(null);

      const result = await validateSession();

      expect(result.session).toBeNull();
      expect(result.errorResponse).toBeInstanceOf(NextResponse);
      expect(result.errorResponse?.status).toBe(401);
    });
  });

  describe('requireAuth', () => {
    it('should return session when authenticated', async () => {
      const mockSession: Session = {
        user: { 
          id: 'user-123', 
          plan: 'FREE', 
          hasCompletedOnboarding: true,
          role: 'USER',
          defaultReadingMode: 'single-page',
          theme: 'dark'
        },
        expires: new Date().toISOString(),
      };
      (auth as any).mockResolvedValue(mockSession);

      const result = await requireAuth();

      expect(result).toEqual(mockSession);
    });

    it('should throw error when not authenticated', async () => {
      (auth as any).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow('Unauthorized');
    });
  });
});
