import { chromium, type FullConfig } from '@playwright/test';

/**
 * Pre-warms the Next.js dev server so on-demand Turbopack compiles happen
 * here, not inside test timeouts. Cold-compiling a route (instrumentation,
 * middleware, page) takes 30-60s+ on slower machines — far beyond Playwright's
 * default action/URL timeouts — and caused widespread flaky e2e failures.
 *
 * Warming uses a real browser with the e2e bypass cookie so auth-required
 * routes (/library, /reader, /onboarding) actually compile instead of being
 * 302-redirected to /login by the middleware before the page builds.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3100';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  // E2E_TEST_MODE is set on the webServer env, so the bypass cookie is honored.
  await context.addCookies([
    { name: '__COMET_TEST_BYPASS', value: '1', domain: 'localhost', path: '/' },
  ]);
  const page = await context.newPage();

  // Only routes the specs actually use.
  const routes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/library',
    '/onboarding',
    '/reader/comic-e2e-001',
  ];

  for (const route of routes) {
    try {
      await page.goto(baseURL + route, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    } catch {
      // compile hiccups on a slow machine are acceptable — best effort.
    }
  }

  await browser.close();
}
