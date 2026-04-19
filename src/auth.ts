import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET,
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'name@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth] Authorize attempt for:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing credentials');
          return null;
        }
        
        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        try {
          const user = await db.user.findUnique({ where: { email } });
          
          if (!user || !user.password) {
            console.log('[Auth] User not found or no password hash');
            return null;
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            console.log('[Auth] Authentication successful for:', email);
            return user;
          }

          console.log('[Auth] Password mismatch for:', email);
          return null;
        } catch (dbError) {
          console.error('[Auth] Database error during authorize:', dbError);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === 'update' && session) {
        token.name = session.name || token.name;
        token.defaultReadingMode = session.defaultReadingMode || token.defaultReadingMode;
      }

      if (user) {
        // Properties from DB User or Dummy
        token.userId = user.id!;
        token.plan = (user as any).plan ?? 'FREE';
        token.hasCompletedOnboarding = (user as any).hasCompletedOnboarding ?? false;
        token.name = user.name ?? null;
        token.image = null;
        token.defaultReadingMode = (user as any).defaultReadingMode ?? 'single-page';
        token.issuedAt = Math.floor(Date.now() / 1000);
      } else if (token.userId) {
        try {
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
            return null; 
          }

          token.name = dbUser.name;
          token.image = null;
          token.plan = dbUser.plan;
          token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
          token.defaultReadingMode = dbUser.defaultReadingMode;
        } catch (error) {
          console.error('[Auth] JWT callback DB error:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.userId as string) || '';
        session.user.plan = (token.plan as string) || 'FREE';
        session.user.hasCompletedOnboarding = !!token.hasCompletedOnboarding;
        session.user.name = (token.name as string) ?? null;
        session.user.image = null;
        session.user.defaultReadingMode = token.defaultReadingMode as string;
      }
      return session;
    },
  },
});
