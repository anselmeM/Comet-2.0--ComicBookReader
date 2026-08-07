import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Discord from 'next-auth/providers/discord';
import GitHub from 'next-auth/providers/github';
import { authConfig } from './auth.config';
import { logger } from '@/lib/logger';

// Runtime validation for critical environment variables
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const authSecret =
  process.env.AUTH_SECRET || (isBuildPhase ? 'dummy_secret_for_build_only' : undefined);
if (!authSecret || !authSecret.trim()) {
  throw new Error(
    'AUTH_SECRET environment variable is required but was not set. ' +
      'Generate one with: openssl rand -base64 32',
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig,
  secret: authSecret,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      // First, invoke the base authConfig jwt callback
      const updatedToken =
        (await authConfig.callbacks?.jwt?.({ token, user, trigger, session })) || token;

      // If we have a userId, fetch the latest plan and role from the database to keep session in sync
      if (updatedToken?.userId) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: updatedToken.userId as string },
            select: { plan: true, role: true },
          });
          if (dbUser) {
            updatedToken.plan = dbUser.plan;
            updatedToken.role = dbUser.role;
          }
        } catch (err) {
          logger.error(
            '[Auth] Failed to refresh user plan/role from DB:',
            {},
            err instanceof Error ? err : undefined,
          );
        }
      }

      return updatedToken;
    },
  },
  providers: [
    // OAuth providers are registered only when their credentials exist, so a
    // missing env var degrades to "provider not offered" instead of breaking
    // login at boot with undefined clientId.
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET
      ? [
          Discord({
            clientId: process.env.AUTH_DISCORD_ID,
            clientSecret: process.env.AUTH_DISCORD_SECRET,
          }),
        ]
      : []),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'name@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        try {
          const users = await db.user.findMany({ where: { email } });

          if (!users || users.length === 0) {
            logger.warn(`[Auth] Login failed: User not found for ${email}`);
            return null;
          }

          let matchedUser = null;
          let lockedUser = null;
          let attemptedUser = null;

          // Iterate through all accounts with this email to find the one with the matching password
          for (const user of users) {
            if (!user.password) continue;

            // Check for account lockout on each user
            if (user.lockoutUntil && user.lockoutUntil > new Date()) {
              lockedUser = user;
              continue; // Skip trying this locked account, check others
            }

            const passwordsMatch = await bcrypt.compare(password, user.password);

            if (passwordsMatch) {
              matchedUser = user;
              break;
            }

            // Track the last account whose password was actually tested
            attemptedUser = user;
          }

          if (matchedUser) {
            // Reset failed attempts on successful login
            if (matchedUser.failedAttempts > 0 || matchedUser.lockoutUntil) {
              await db.user.update({
                where: { id: matchedUser.id },
                data: { failedAttempts: 0, lockoutUntil: null },
              });
            }
            logger.info(`[Auth] Login success for ${email} (ID: ${matchedUser.id})`);
            return matchedUser;
          }

          if (lockedUser) {
            const minutesLeft = Math.ceil(
              (lockedUser.lockoutUntil!.getTime() - Date.now()) / 60000,
            );
            logger.warn(
              `[Auth] Login blocked: Account locked for ${email}. ${minutesLeft}m remaining.`,
            );
            throw new Error(`Account locked. Please try again in ${minutesLeft} minutes.`);
          }

          // Handle failed attempt for the account that was actually tested
          const targetUser = attemptedUser ?? users[0];
          const newFailedAttempts = targetUser.failedAttempts + 1;
          const MAX_ATTEMPTS = 5;
          const LOCKOUT_DURATION_MIN = 15;

          const updateData: any = { failedAttempts: newFailedAttempts };

          if (newFailedAttempts >= MAX_ATTEMPTS) {
            const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MIN * 60 * 1000);
            updateData.lockoutUntil = lockoutUntil;
            logger.warn(`[Auth] Account locked: ${email} reached ${MAX_ATTEMPTS} failed attempts.`);
          }

          await db.user.update({
            where: { id: targetUser.id },
            data: updateData,
          });

          logger.warn(
            `[Auth] Login failed: Password mismatch for ${email}. Attempt ${newFailedAttempts}/${MAX_ATTEMPTS}`,
          );
          return null;
        } catch (dbError: any) {
          // Re-throw lockout error so it can be handled by the UI
          if (dbError.message?.includes('Account locked')) {
            throw dbError;
          }
          logger.error(
            '[Auth] Database error during authorize',
            {},
            dbError instanceof Error ? dbError : undefined,
          );
          return null;
        }
      },
    }),
  ],
});
