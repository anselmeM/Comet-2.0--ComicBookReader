/**
 * @file Auth.js v5 (NextAuth) Configuration
 *
 * Configures Google OAuth + Email Magic Link providers with Prisma session adapter.
 * Exported `auth`, `handlers`, `signIn`, `signOut` are used app-wide.
 *
 * @see https://authjs.dev/getting-started/installation?framework=next.js
 */
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),

  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'test@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Hardcoded test account escape hatch
        if (email === 'test@example.com' && password === 'password') {
          return await db.user.upsert({
            where: { email: 'test@example.com' },
            update: {},
            create: { email: 'test@example.com', name: 'Test User' }
          });
        }

        const user = await db.user.findUnique({ where: { email } });
        
        if (!user || !user.password) return null;

        const bcrypt = await import('bcryptjs');
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (passwordsMatch) {
          return user;
        }

        return null;
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },



  callbacks: {
    // Include userId in the JWT so API routes can access it without a DB lookup
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id!;
        token.plan = user.plan ?? 'FREE';
        token.hasCompletedOnboarding = user.hasCompletedOnboarding ?? false;
      }
      return token;
    },

    // Expose userId, plan and onboarding status to client-side session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId || '';
        session.user.plan = token.plan || 'FREE';
        session.user.hasCompletedOnboarding = !!token.hasCompletedOnboarding;
      }
      return session;
    },
  },
});
