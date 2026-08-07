/**
 * Opt-in authentication bypass used ONLY by Playwright e2e runs.
 *
 * Never enabled in any deployed environment: it requires E2E_TEST_MODE=true,
 * which only playwright.config.ts sets for local e2e runs. The cookie value is
 * intentionally not checked — the env gate is the protection, so a stale or
 * forged `__COMET_TEST_BYPASS` cookie is harmless outside a test run.
 */
export const isTestAuthBypassEnabled = () =>
  process.env.E2E_TEST_MODE === 'true' && process.env.NODE_ENV !== 'production';
