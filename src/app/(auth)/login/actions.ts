'use server';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

export async function loginAction(prevState: any, formData: FormData) {
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

    // Use redirect: false to avoid "Failed to fetch" error when signIn
    // throws redirect from server action context. Handle redirect manually.
    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password: password,
      redirect: false,
    });

    if (result?.error) {
      // This is caught by the AuthError handler below
      throw new Error('AUTH_ERROR_' + result.error);
    }

    // Return the URL for client-side redirect
    return { success: true, redirectUrl: callbackUrl };
  } catch (error: any) {
    // Handle custom auth error format
    if (error.message?.startsWith('AUTH_ERROR_')) {
      const authError = error.message.replace('AUTH_ERROR_', '');
      if (authError === 'CredentialsSignin') {
        return { error: 'Invalid email or password.' };
      }
      return { error: 'Something went wrong. Please try again.' };
    }

    // Handle custom lockout error
    const errorMessage = error.message || '';
    const errorCauseMessage = error.cause?.message || error.cause?.err?.message || '';
    if (errorMessage.includes('Account locked') || errorCauseMessage.includes('Account locked')) {
      return { error: errorMessage || errorCauseMessage };
    }

    // NextAuth v5 credentials check
    if (
      error instanceof AuthError ||
      error.name === 'AuthError' ||
      error.type === 'CredentialsSignin' ||
      errorMessage.includes('CredentialsSignin') ||
      errorCauseMessage.includes('CredentialsSignin')
    ) {
      return { error: 'Invalid email or password.' };
    }

    // Very important: Re-throw the error if it's a redirect,
    // as Next.js uses errors for redirects.
    if (
      errorMessage === 'NEXT_REDIRECT' ||
      error.digest?.startsWith('NEXT_REDIRECT') ||
      errorMessage.includes('NEXT_REDIRECT')
    ) {
      throw error;
    }

    logger.error('[LoginAction] Unexpected error:', {}, error instanceof Error ? error : undefined);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
