'use server';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

export async function loginAction(prevState: unknown, formData: FormData) {
  try {
    // 1. Rate limiting (T-AUTH-002)
    const headerList = await headers();
    const ip = (headerList.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
    const limiter = await rateLimit(`login_${ip}`, 10, 60 * 60 * 1000); // 10 attempts per hour

    if (limiter.isLimited) {
      return { error: 'Too many login attempts. Please try again in an hour.' };
    }

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const callbackUrl = (formData.get('callbackUrl') as string) || '/library';

    if (!email || !password) {
      return { error: 'Please enter both email and password.' };
    }

    // NextAuth v5 signIn() in a server action will ALWAYS throw a redirect
    // on success, even with redirect: false. We catch it below and treat
    // the redirect as a successful login.
    await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password: password,
      redirect: false,
    });

    // If signIn returns without throwing, the login succeeded
    return { success: true, redirectUrl: callbackUrl };
  } catch (error: any) {
    // ─── CRITICAL: Rethrow Next.js internal errors (redirects, etc) ───
    // In Next 15+, catching a redirect error will break navigation.
    // unstable_rethrow safely re-throws ONLY Next.js internal errors.
    const { unstable_rethrow } = require('next/navigation');
    unstable_rethrow(error);

    const errorMessage = typeof error?.message === 'string' ? error.message : '';
    const errType = typeof error?.type === 'string' ? error.type : '';
    const errName = typeof error?.name === 'string' ? error.name : '';
    const errorFingerprint = `${errorMessage} ${errType} ${errName}`.toLowerCase();

    // ─── Handle NextAuth v5 auth errors ──────────────────────────────
    if (
      error instanceof AuthError ||
      errorFingerprint.includes('credentialssignin') ||
      errorFingerprint.includes('callbackrouteerror')
    ) {
      return { error: 'Invalid email or password.' };
    }

    if (errorMessage.includes('Account locked')) {
      return { error: errorMessage };
    }

    // ─── Log unexpected errors and return gracefully ─────────────────
    logger.error(
      '[LoginAction] Unexpected error caught. Details:',
      { message: errorMessage, type: errType, name: errName },
      error instanceof Error ? error : undefined,
    );

    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
