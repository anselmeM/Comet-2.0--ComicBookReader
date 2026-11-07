import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { isUniqueConstraintError } from '@/lib/prisma-errors';
import { isTestAuthBypassEnabled } from '@/lib/test-auth';

export interface AppSessionUser {
  id: string;
  clerkId?: string | null;
  plan: string;
  role: string;
  hasCompletedOnboarding: boolean;
  defaultReadingMode: string;
  theme: string;
  name?: string | null;
  image?: string | null;
  email?: string | null;
}

export interface AppSession {
  user: AppSessionUser;
}

function mapUser(user: {
  id: string;
  clerkId: string | null;
  plan: string;
  role: string;
  hasCompletedOnboarding: boolean;
  defaultReadingMode: string;
  theme: string;
  name: string | null;
  image: string | null;
  email: string;
}): AppSession {
  return {
    user: {
      id: user.id,
      clerkId: user.clerkId,
      plan: user.plan,
      role: user.role,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      defaultReadingMode: user.defaultReadingMode,
      theme: user.theme,
      name: user.name,
      image: user.image,
      email: user.email,
    },
  };
}

/**
 * Resolves the Prisma app user for the current Clerk session.
 *
 * Links pre-Clerk accounts by email (preserving libraries) and provisions a
 * fresh FREE row for brand-new Clerk users.
 *
 * @returns The app session, or null when unauthenticated.
 */
export async function resolveAppUser(): Promise<AppSession | null> {
  if (isTestAuthBypassEnabled()) {
    const cookieStore = await cookies();
    if (cookieStore.get('__COMET_TEST_BYPASS')) {
      return {
        user: {
          id: 'user-1',
          plan: 'FREE',
          role: 'USER',
          hasCompletedOnboarding: true,
          defaultReadingMode: 'single-page',
          theme: 'dark',
          name: 'Test User',
          email: 'test@example.com',
        },
      };
    }
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const linked = await db.user.findUnique({ where: { clerkId } });
  if (linked) return mapUser(linked);

  // First sighting — link a legacy row by email or provision a new one.
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find((e) => e.id === clerkUser?.primaryEmailAddressId)
      ?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null;
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    clerkUser?.username ||
    null;

  if (email) {
    const legacy = await db.user.findFirst({ where: { email, clerkId: null } });
    if (legacy) {
      try {
        const updated = await db.user.update({
          where: { id: legacy.id },
          data: {
            clerkId,
            name: legacy.name ?? displayName,
            image: legacy.image ?? clerkUser?.imageUrl ?? null,
          },
        });
        logger.info(`[Auth] Linked legacy user ${legacy.id} to Clerk ${clerkId} via ${email}`);
        return mapUser(updated);
      } catch (err) {
        if (!isUniqueConstraintError(err)) throw err;
        // The Clerk webhook (or a parallel request) linked the row first.
        const linked = await db.user.findUnique({ where: { clerkId } });
        if (linked) return mapUser(linked);
        throw err;
      }
    }
  }

  try {
    const created = await db.user.create({
      data: {
        clerkId,
        email: email ?? `${clerkId}@clerk.local`,
        name: displayName,
        image: clerkUser?.imageUrl ?? null,
      },
    });
    logger.info(`[Auth] Provisioned new user ${created.id} for Clerk ${clerkId}`);
    return mapUser(created);
  } catch (err) {
    // First page load fires parallel API calls (and the webhook may run too), so
    // two requests can both observe "no user" and race to create one. Recover by
    // re-reading the winner instead of returning a 500 to a brand-new user.
    if (!isUniqueConstraintError(err)) throw err;
    const raced = await db.user.findUnique({ where: { clerkId } });
    if (raced) return mapUser(raced);
    if (email) {
      const byEmail = await db.user.findUnique({ where: { email } });
      if (byEmail?.clerkId === null) {
        const claimed = await db.user.update({ where: { id: byEmail.id }, data: { clerkId } });
        logger.info(`[Auth] Claimed legacy user ${claimed.id} for Clerk ${clerkId}`);
        return mapUser(claimed);
      }
    }
    throw err;
  }
}

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
  const session = await resolveAppUser();
  if (!session?.user?.id) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { session, errorResponse: null };
}

/**
 * Required authentication for Server Actions or other server-side logic.
 *
 * @throws {Error} If the user is not authenticated.
 * @returns The active session.
 */
export async function requireAuth(): Promise<AppSession> {
  const session = await resolveAppUser();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session;
}
