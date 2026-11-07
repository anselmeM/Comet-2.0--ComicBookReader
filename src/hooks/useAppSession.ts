'use client';

import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HAS_CLERK_KEY, IS_E2E } from '@/lib/clerk-env';

export interface AppSessionUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: string;
  role: string;
  hasCompletedOnboarding: boolean;
  defaultReadingMode: string;
  theme: string;
}

export interface AppSession {
  user: AppSessionUser;
}

export type AppSessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SessionPatch {
  name?: string;
  defaultReadingMode?: string;
  theme?: string;
  hasCompletedOnboarding?: boolean;
}

const E2E_SESSION: AppSession = {
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    plan: 'FREE',
    role: 'USER',
    hasCompletedOnboarding: true,
    defaultReadingMode: 'single-page',
    theme: 'dark',
  },
};

/**
 * NextAuth-shaped session hook backed by Clerk + the Prisma app user.
 *
 * Migration shim: existing call sites keep working by importing
 * `useAppSession as useSession` — the return shape mirrors next-auth's
 * `{ data, status, update }` (plus `session` as an alias of `data`).
 *
 * `update()` persists profile fields via PUT /api/user/profile and refreshes
 * the cached session, replacing next-auth's JWT `trigger: 'update'` flow.
 *
 * Keyless environments (no publishable key): never calls Clerk hooks (they
 * throw outside a provider). Under Playwright, returns a canned session so
 * e2e runs without Clerk network access; otherwise unauthenticated.
 */
export function useAppSession() {
  // HAS_CLERK_KEY is a build-time constant, so hook order is stable —
  // useUser() throws without a ClerkProvider, which keyless envs skip.
  const clerkState = HAS_CLERK_KEY
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useUser()
    : { isLoaded: true, isSignedIn: false as boolean, user: null };
  const { isLoaded: clerkLoaded, isSignedIn } = clerkState;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['app-user'],
    queryFn: async (): Promise<AppSessionUser> => {
      const res = await fetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to fetch app user');
      return res.json();
    },
    enabled: HAS_CLERK_KEY && clerkLoaded && !!isSignedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  let status: AppSessionStatus = 'loading';
  if (clerkLoaded) {
    if (!isSignedIn || query.isError) status = 'unauthenticated';
    else if (query.isSuccess) status = 'authenticated';
  }

  const session: AppSession | null =
    status === 'authenticated' && query.data ? { user: query.data } : null;

  const update = useCallback(
    async (patch: SessionPatch = {}) => {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      await queryClient.invalidateQueries({ queryKey: ['app-user'] });
      return res.json();
    },
    [queryClient],
  );

  // Playwright runs keyless: hand back a canned session so specs exercise the
  // authenticated UI without Clerk network access.
  if (IS_E2E) {
    return { data: E2E_SESSION, session: E2E_SESSION, status: 'authenticated' as const, update };
  }

  return { data: session, session, status, update };
}
