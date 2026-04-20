import type { NextAuthConfig } from 'next-auth';

// This config is edge-compatible. It does not import the database.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [], // Providers are added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLibrary = nextUrl.pathname.startsWith('/library');
      const isOnReader = nextUrl.pathname.startsWith('/reader');
      const isOnSettings = nextUrl.pathname.startsWith('/settings');
      const isOnOnboarding = nextUrl.pathname.startsWith('/onboarding');
      
      if (isOnLibrary || isOnReader || isOnSettings || isOnOnboarding) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      if (user) {
        return {
          ...token,
          userId: user.id,
          email: user.email,
          plan: (user as any).plan ?? 'FREE',
          hasCompletedOnboarding: (user as any).hasCompletedOnboarding ?? false,
          name: user.name ?? null,
          defaultReadingMode: (user as any).defaultReadingMode ?? 'single-page',
          issuedAt: Math.floor(Date.now() / 1000),
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) || (token.sub as string) || '';
        session.user.plan = (token.plan as string) || 'FREE';
        session.user.hasCompletedOnboarding = !!token.hasCompletedOnboarding;
        session.user.name = (token.name as string) ?? null;
        session.user.email = (token.email as string) || '';
        session.user.defaultReadingMode = (token.defaultReadingMode as string) || 'single-page';
      }
      return session;
    },
  },
};
