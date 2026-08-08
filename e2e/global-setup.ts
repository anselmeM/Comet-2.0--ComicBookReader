import type { FullConfig } from '@playwright/test';

/**
 * Pre-warms the Next.js dev server so on-demand Turbopack compiles happen
 * here, not inside test timeouts. Cold-compiling a route (instrumentation,
 * middleware, page) takes 30-60s+ on slower machines — far beyond Playwright's
 * default action/URL timeouts — and caused widespread flaky e2e failures.
 */
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:3100';
  const routes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/library',
    '/onboarding',
    '/pricing',
    '/settings',
    '/reader/comic-e2e-001',
  ];

  for (const route of routes) {
    try {
      // redirect: 'manual' — we only want to trigger the compile; redirects
      // (e.g. unauthenticated /library -> /login) are fine.
      await fetch(baseURL + route, { redirect: 'manual' });
    } catch {
      // 404/500/network hiccups are acceptable — the route got compiled.
    }
  }
}
