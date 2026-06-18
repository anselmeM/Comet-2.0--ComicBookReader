'use server';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * Checks if an error is a Next.js redirect (which uses thrown errors internally).
 * This MUST be checked before any other error handling to avoid swallowing redirects.
 *
 * @param error - The caught error object
 * @returns true if the error is a Next.js redirect
 */
function isRedirectError(error: unknown): boolean {
  if (error == null || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  // Next.js 14+/16 uses error.digest starting with 'NEXT_REDIRECT'
  if (typeof e.digest === 'string' && e.digest.startsWith('NEXT_REDIRECT')) return true;
  // Fallback: check error message
  const msg = typeof e.message === 'string' ? e.message : '';
  if (msg === 'NEXT_REDIRECT' || msg.includes('NEXT_REDIRECT')) return true;
  return false;
}

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
  } catch (error: unknown) {
    // ─── CRITICAL: Check for Next.js redirect FIRST ───────────────────
    // NextAuth v5 + Next.js 16 throws a redirect error on successful login.
    // This MUST be re-thrown before any other error handling, otherwise the
    // redirect is swallowed and the user sees "An unexpected error occurred."
    if (isRedirectError(error)) {
      throw error;
    }

    const err = error as Record<string, unknown>;
    const errorMessage = typeof err?.message === 'string' ? err.message : '';
    const errorCauseMessage =
      typeof (err?.cause as Record<string, unknown>)?.message === 'string'
        ? ((err.cause as Record<string, unknown>).message as string)
        : typeof (err?.cause as Record<string, unknown>)?.err === 'object' &&
            typeof ((err.cause as Record<string, unknown>).err as Record<string, unknown>)
              ?.message === 'string'
          ? (((err.cause as Record<string, unknown>).err as Record<string, unknown>)
              .message as string)
          : '';

    // ─── Handle account lockout ──────────────────────────────────────
    if (errorMessage.includes('Account locked') || errorCauseMessage.includes('Account locked')) {
      return { error: errorMessage || errorCauseMessage };
    }

    // ─── Handle NextAuth v5 CredentialsSignin ────────────────────────
    if (
      error instanceof AuthError ||
      err?.name === 'AuthError' ||
      err?.type === 'CredentialsSignin' ||
      errorMessage.includes('CredentialsSignin') ||
      errorCauseMessage.includes('CredentialsSignin')
    ) {
      return { error: 'Invalid email or password.' };
    }

    // ─── Handle custom AUTH_ERROR_ prefix (legacy path) ──────────────
    if (errorMessage.startsWith('AUTH_ERROR_')) {
      const authError = errorMessage.replace('AUTH_ERROR_', '');
      if (authError === 'CredentialsSignin') {
        return { error: 'Invalid email or password.' };
      }
      return { error: 'Something went wrong. Please try again.' };
    }

    // ─── Unrecognized error — log full shape for debugging ───────────
    logger.error(
      '[LoginAction] Unexpected error caught. Details:',
      {
        message: errorMessage,
        name: typeof err?.name === 'string' ? err.name : 'unknown',
        type: typeof err?.type === 'string' ? err.type : undefined,
        digest: typeof err?.digest === 'string' ? err.digest : undefined,
        causeMessage: errorCauseMessage || undefined,
        constructor: (error as object)?.constructor?.name,
      },
      error instanceof Error ? error : undefined,
    );

    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
