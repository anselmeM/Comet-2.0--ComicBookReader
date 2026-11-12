/**
 * @file Keyless authentication mode resolution.
 *
 * Clerk is optional outside production: local dev and Playwright run without keys,
 * and Lighthouse CI deliberately boots a production server without them. Without
 * this guard `clerkMiddleware` throws "Missing publishableKey" while the module is
 * loading, before the public allow-list or CSP logic can run, so every request 500s.
 *
 * Production stays fail-closed: a deployment without a publishable key keeps
 * failing unless ALLOW_KEYLESS_AUTH=true is set explicitly (only Lighthouse CI
 * does that, on an ephemeral server that never receives real traffic).
 */

export interface KeylessAuthInputs {
  hasPublishableKey: boolean;
  isProduction: boolean;
  allowKeylessAuth: boolean;
}

/**
 * Decides whether the app should run without Clerk authentication at all.
 *
 * @param inputs Environment facts (injected so the rule is unit-testable).
 */
export function shouldUseKeylessAuth({
  hasPublishableKey,
  isProduction,
  allowKeylessAuth,
}: KeylessAuthInputs): boolean {
  // A configured key always means real Clerk auth — in every environment.
  if (hasPublishableKey) return false;
  // No key outside production: local dev, unit tests, Playwright.
  if (!isProduction) return true;
  // No key in production: only an explicit opt-in may bypass auth (Lighthouse CI).
  return allowKeylessAuth;
}

/** Resolves keyless mode from the current process environment at request time. */
export function isKeylessAuthMode(): boolean {
  return shouldUseKeylessAuth({
    hasPublishableKey: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
    isProduction: process.env.NODE_ENV === 'production',
    allowKeylessAuth: process.env.ALLOW_KEYLESS_AUTH === 'true',
  });
}
