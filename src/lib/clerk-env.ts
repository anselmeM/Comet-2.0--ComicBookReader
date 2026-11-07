/**
 * @file Clerk environment flags (safe to import in client and server code).
 *
 * Clerk is optional at runtime: when no publishable key is configured (local
 * dev without auth, Playwright e2e), the app degrades gracefully instead of
 * throwing — see Providers and useAppSession.
 */
export const HAS_CLERK_KEY = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/** True only under Playwright (`NEXT_PUBLIC_E2E_TEST_MODE=true` in webServer env). */
export const IS_E2E = process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true';
