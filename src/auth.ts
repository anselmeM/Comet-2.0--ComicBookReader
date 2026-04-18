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
import bcrypt from 'bcryptjs';

import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'name@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth] Attempting login for:', credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.warn('[Auth] Missing email or password');
          return null;
        }
        
        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        try {
          const user = await db.user.findUnique({ where: { email } });
          
          if (!user) {
            console.warn('[Auth] User not found:', email);
            return null;
          }

          if (!user.password) {
            console.warn('[Auth] User has no password set (OAuth only?):', email);
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            console.log('[Auth] Password match for:', email);
            return user;
          }

          console.warn('[Auth] Password mismatch for:', email);
          return null;
        } catch (dbError) {
          console.error('[Auth] Database error during authorize:', dbError);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },



  callbacks: {
    // Include userId in the JWT so API routes can access it without a DB lookup
    async jwt({ token, user, trigger, session }) {
      // Handle manual updates (e.g. from Settings)
      if (trigger === 'update' && session) {
        token.name = session.name || token.name;
        token.defaultReadingMode = session.defaultReadingMode || token.defaultReadingMode;
      }

      if (user) {
        token.userId = user.id!;
        token.plan = user.plan ?? 'FREE';
        token.hasCompletedOnboarding = user.hasCompletedOnboarding ?? false;
        token.name = user.name ?? null;
        token.image = null; // Exclude image
        token.defaultReadingMode = (user as any).defaultReadingMode ?? 'single-page';
        token.issuedAt = Math.floor(Date.now() / 1000);
      } else if (token.userId) {
        // Fetch fresh user data to simulate refresh rotation (T-AUTH-004)
        const dbUser = await db.user.findUnique({
          where: { id: token.userId as string },
          select: { 
            name: true, 
            plan: true, 
            hasCompletedOnboarding: true,
            defaultReadingMode: true,
          }
        });

        if (!dbUser) {
          return null; // Force logout (T-AUTH-004)
        }

        token.name = dbUser.name;
        token.image = null; // Exclude image
        token.plan = dbUser.plan;
        token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
        token.defaultReadingMode = dbUser.defaultReadingMode;
      }
      return token;
    },

    // Expose userId, plan and onboarding status to client-side session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) || '';
        session.user.plan = (token.plan as string) || 'FREE';
        session.user.hasCompletedOnboarding = !!token.hasCompletedOnboarding;
        session.user.name = (token.name as string) ?? null;
        session.user.image = null; // Exclude image
        (session.user as any).defaultReadingMode = token.defaultReadingMode;
      }
      return session;
    },
  },
});
