import type { NextAuthConfig } from 'next-auth';

// This config is edge-compatible. It does not import the database.
export const authConfig: NextAuthConfig = {
  trustHost: true,
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
    // Basic authorized callback for middleware
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLibrary = nextUrl.pathname.startsWith('/library');
      const isOnReader = nextUrl.pathname.startsWith('/reader');
      
      if (isOnLibrary || isOnReader) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }
      return true;
    },
  },
};
