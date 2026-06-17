/**
 * @file Next.js Middleware — Route Protection
 */
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const plan = req.auth?.user?.plan || 'FREE';

  // 1. Handle Redirects / API Errors first
  const isPublicApiRoute = nextUrl.pathname.startsWith('/api/auth');
  const isStorageApiRoute = nextUrl.pathname.startsWith('/api/storage');

  // Restrict Storage APIs to PREMIUM users
  if (isStorageApiRoute && plan !== 'PREMIUM') {
    return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
  }

  const isPublicRoute = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/pricing',
  ].includes(nextUrl.pathname);

  if (isPublicRoute) {
    if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
      return Response.redirect(new URL('/library', nextUrl));
    }
  } else if (!isPublicApiRoute) {
    // Auth bypass for testing
    const hasBypass =
      (process.env.NODE_ENV !== 'production' || process.env.COMET_LOAD_TEST === 'true') &&
      req.cookies.get('__COMET_TEST_BYPASS');
    if (!hasBypass && !isLoggedIn) {
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return Response.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
    }
  }

  // 2. Generate CSP Nonce for requests that proceed
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';
  const connectSrc = `connect-src 'self' https://comicvine.gamespot.com https://api.stripe.com${isDev ? ' http://localhost:3101 ws://localhost:*' : ''};`;
  const cspHeader =
    `default-src 'self'; script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'nonce-${nonce}' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://comicvine.gamespot.com https://images.unsplash.com https://i.pravatar.cc https://www.transparenttextures.com; font-src 'self' https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; worker-src 'self' blob:; ${connectSrc}${isDev ? '' : ' upgrade-insecure-requests;'}`
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json).*)'],
};
