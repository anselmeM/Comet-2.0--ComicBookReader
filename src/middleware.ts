/**
 * @file Next.js Middleware — Clerk Route Protection + CSP Nonce
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isTestAuthBypassEnabled } from '@/lib/test-auth';

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/register(.*)',
  '/pricing(.*)',
  '/api-docs(.*)',
  '/api/health',
  '/api/stripe/locale',
  '/api/webhooks(.*)',
  '/api/auth(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { nextUrl } = req;

  // Auth bypass for testing — e2e runs only (E2E_TEST_MODE), never deployed
  const hasBypass = isTestAuthBypassEnabled() && req.cookies.get('__COMET_TEST_BYPASS');
  if (!hasBypass && !isPublicRoute(req)) {
    await auth.protect();
  }

  // Generate CSP Nonce for requests that proceed
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const storageOrigins = [
    process.env.NEXT_PUBLIC_AWS_ENDPOINT,
    'https://*.720bf5927abfac2a87f236c63a5941a6.r2.cloudflarestorage.com',
  ]
    .filter(Boolean)
    .join(' ');
  const clerkOrigins = 'https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com';
  const connectSrc = `connect-src 'self' https://comicvine.gamespot.com https://api.stripe.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io ${clerkOrigins} ${storageOrigins}${isDev ? ' http://localhost:3101 ws://localhost:*' : ''};`;
  const scriptSrc = `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'nonce-${nonce}' https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.com;`;
  const cspHeader =
    `default-src 'self'; ${scriptSrc} style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://comicvine.gamespot.com https://images.unsplash.com https://i.pravatar.cc https://www.transparenttextures.com https://img.clerk.com; font-src 'self' https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:; ${connectSrc}${isDev ? '' : ' upgrade-insecure-requests;'}`
      .replace(/\s{2,}/g, ' ')
      .trim();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
});

export const config = {
  // Match all routes EXCEPT static files, _next internals, and favicon
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json|unrar\\.wasm|offline\\.html|robots\\.txt|openapi\\.json|\\.well-known).*)',
  ],
};
