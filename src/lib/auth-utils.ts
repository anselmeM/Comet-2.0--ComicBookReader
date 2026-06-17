import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
  if (process.env.NODE_ENV !== 'production' || process.env.COMET_LOAD_TEST === 'true') {
    const cookieStore = await cookies();
    if (cookieStore.get('__COMET_TEST_BYPASS')) {
      return {
        session: {
          user: {
            id: 'user-1',
            plan: 'FREE',
            hasCompletedOnboarding: true,
            name: 'Test User',
            email: 'test@example.com',
          },
        },
        errorResponse: null,
      };
    }
  }

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
        email?: string | null;
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
  if (process.env.NODE_ENV !== 'production' || process.env.COMET_LOAD_TEST === 'true') {
    const cookieStore = await cookies();
    if (cookieStore.get('__COMET_TEST_BYPASS')) {
      return {
        user: {
          id: 'user-1',
          plan: 'FREE',
          hasCompletedOnboarding: true,
          name: 'Test User',
          email: 'test@example.com',
        },
      };
    }
  }

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
      email?: string | null;
    };
  };
}
