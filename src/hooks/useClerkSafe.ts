'use client';

import { useClerk } from '@clerk/nextjs';
import { HAS_CLERK_KEY } from '@/lib/clerk-env';

/**
 * `useClerk()` guarded for keyless environments.
 *
 * Keyless builds (local dev, Playwright, Lighthouse CI) render without
 * `<ClerkProvider>` — see `src/app/providers.tsx` — so calling Clerk hooks
 * unconditionally throws during render. `HAS_CLERK_KEY` is a build-time
 * constant, so the hook order stays stable across renders.
 *
 * @returns The Clerk client API, or `null` when Clerk is not configured.
 */
export function useClerkSafe(): ReturnType<typeof useClerk> | null {
  if (!HAS_CLERK_KEY) return null;
  return useClerk();
}
