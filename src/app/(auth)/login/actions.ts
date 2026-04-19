'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function loginAction(prevState: any, formData: FormData) {
  try {
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
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid email or password.' };
        default:
          return { error: 'Something went wrong. Please try again.' };
      }
    }
    
    // Very important: Re-throw the error if it's a redirect, 
    // as Next.js uses errors for redirects.
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    
    console.error('[LoginAction] Unexpected error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
