import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';

// Runtime validation for critical environment variables
const authSecret = process.env.AUTH_SECRET;
if (!authSecret || !authSecret.trim()) {
  throw new Error(
    'AUTH_SECRET environment variable is required but was not set. ' +
    'Generate one with: openssl rand -base64 32'
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig,
  secret: authSecret,
  providers: [
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
          const user = await db.user.findUnique({ where: { email } });
          
          if (!user || !user.password) {
            console.log(`[Auth] Login failed: User not found or no password hash for ${email}`);
            return null;
          }

          // Check for account lockout
          if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
            console.warn(`[Auth] Login blocked: Account locked for ${email}. ${minutesLeft}m remaining.`);
            throw new Error(`Account locked. Please try again in ${minutesLeft} minutes.`);
          }

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            // Reset failed attempts on successful login
            if (user.failedAttempts > 0 || user.lockoutUntil) {
              await db.user.update({
                where: { id: user.id },
                data: { failedAttempts: 0, lockoutUntil: null }
              });
            }
            console.log(`[Auth] Login success for ${email}`);
            return user;
          }

          // Handle failed attempt
          const newFailedAttempts = user.failedAttempts + 1;
          const MAX_ATTEMPTS = 5;
          const LOCKOUT_DURATION_MIN = 15;

          const updateData: any = { failedAttempts: newFailedAttempts };
          
          if (newFailedAttempts >= MAX_ATTEMPTS) {
            const lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MIN * 60 * 1000);
            updateData.lockoutUntil = lockoutUntil;
            console.warn(`[Auth] Account locked: ${email} reached ${MAX_ATTEMPTS} failed attempts.`);
          }

          await db.user.update({
            where: { id: user.id },
            data: updateData
          });

          console.log(`[Auth] Login failed: Password mismatch for ${email}. Attempt ${newFailedAttempts}/${MAX_ATTEMPTS}`);
          return null;
        } catch (dbError: any) {
          // Re-throw lockout error so it can be handled by the UI
          if (dbError.message?.includes('Account locked')) {
            throw dbError;
          }
          console.error('[Auth] Database error during authorize:', dbError);
          return null;
        }
      },
    }),
  ],
});
