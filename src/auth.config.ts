import type { NextAuthConfig, User } from 'next-auth';
import { logger } from '@/lib/logger';
import { isTestAuthBypassEnabled } from '@/lib/test-auth';

/**
 * @file Shared NextAuth Configuration
 *
 * This config is edge-compatible (no database imports).
 * It is used by both the auth handler (src/auth.ts) and the middleware.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  providers: [], // Providers are added in auth.ts
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const isOnLibrary = nextUrl.pathname.startsWith('/library');
      const isOnReader = nextUrl.pathname.startsWith('/reader');
      const isOnSettings = nextUrl.pathname.startsWith('/settings');
      const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');

      // Bypass auth for E2E tests — e2e runs only (E2E_TEST_MODE), never deployed
      if (isTestAuthBypassEnabled() && request.cookies.get('__COMET_TEST_BYPASS')) {
        return true;
      }

      if (isOnLibrary || isOnReader || isOnSettings || isOnOnboarding) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      const now = Math.floor(Date.now() / 1000);

      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.defaultReadingMode) token.defaultReadingMode = session.defaultReadingMode;
        if (session.theme) token.theme = session.theme;
        return token;
      }

      if (user) {
        const u = user as User;
        return {
          ...token,
          userId: u.id,
          email: u.email,
          plan: u.plan ?? 'FREE',
          role: u.role ?? 'USER',
          hasCompletedOnboarding: u.hasCompletedOnboarding ?? false,
          name: u.name ?? null,
          defaultReadingMode: u.defaultReadingMode ?? 'single-page',
          theme: u.theme ?? 'dark',
          issuedAt: now,
          iss: process.env.NEXTAUTH_URL || 'comet-reader',
          aud: 'comet-app',
        };
      }

      // Phase 2: Security Validation
      // 1. Clock skew / Future token check (relaxed threshold to 5 minutes warning)
      if (token.issuedAt && (token.issuedAt as number) > now + 300) {
        logger.warn('[Auth] Token validation warning: Issued in the future (skew)', {
          issuedAt: token.issuedAt,
          now,
        });
      }

      // 2. Issuer validation (Relaxed: Warn instead of invalidate, allow fallback 'comet-reader')
      const expectedIss = process.env.NEXTAUTH_URL || 'comet-reader';
      if (
        token.iss &&
        token.iss !== expectedIss &&
        token.iss !== 'comet-reader' &&
        !process.env.VERCEL
      ) {
        logger.warn('[Auth] Token validation warning: Issuer mismatch', {
          expected: expectedIss,
          got: token.iss,
        });
      }

      // 3. Audience validation (Warn instead of invalidate)
      if (token.aud && token.aud !== 'comet-app') {
        logger.warn('[Auth] Token validation warning: Audience mismatch', {
          expected: 'comet-app',
          got: token.aud,
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) || (token.sub as string) || '';
        session.user.plan = (token.plan as string) || 'FREE';
        session.user.role = (token.role as string) || 'USER';
        session.user.hasCompletedOnboarding = !!token.hasCompletedOnboarding;
        session.user.name = (token.name as string) ?? null;
        session.user.email = (token.email as string) || '';
        session.user.defaultReadingMode = (token.defaultReadingMode as string) || 'single-page';
        session.user.theme = (token.theme as string) || 'dark';
      }
      return session;
    },
  },
};
