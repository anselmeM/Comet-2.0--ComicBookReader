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

  const isPublicRoute = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/pricing',
  ].includes(nextUrl.pathname);
  const isPublicApiRoute = nextUrl.pathname.startsWith('/api/auth');
  const isStorageApiRoute = nextUrl.pathname.startsWith('/api/storage');

  if (isPublicApiRoute) {
    return;
  }

  // Bypass auth for E2E tests
  if (process.env.NODE_ENV !== 'production' && req.cookies.get('__COMET_TEST_BYPASS')) {
    return;
  }

  // Restrict Storage APIs to PREMIUM users
  if (isStorageApiRoute && plan !== 'PREMIUM') {
    return NextResponse.json({ error: 'Premium subscription required' }, { status: 403 });
  }

  if (isPublicRoute) {
    if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
      return Response.redirect(new URL('/library', nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return Response.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl));
  }

  return;
});

export const config = {
  // Match all routes EXCEPT static files, _next internals, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json).*)'],
};
