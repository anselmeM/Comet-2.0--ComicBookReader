import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Validates the current session.
 *
 * @returns An object containing the session or a 401 NextResponse if unauthorized.
 * @example
 * const { session, errorResponse } = await validateSession();
 * if (errorResponse) return errorResponse;
 * const userId = session.user.id;
 */
export async function validateSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return {
    session: session as {
      user: {
        id: string;
        plan: string;
        hasCompletedOnboarding: boolean;
        name?: string | null;
        image?: string | null;
      };
    },
    errorResponse: null,
  };
}

/**
 * Required authentication for Server Actions or other server-side logic.
 *
 * @throws {Error} If the user is not authenticated.
 * @returns The active session.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session as {
    user: {
      id: string;
      plan: string;
      hasCompletedOnboarding: boolean;
      name?: string | null;
      image?: string | null;
    };
  };
}
