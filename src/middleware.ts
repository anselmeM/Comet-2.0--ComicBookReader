/**
 * @file Next.js Middleware — Route Protection
 */
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isPublicRoute = ['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(nextUrl.pathname);
  const isPublicApiRoute = nextUrl.pathname.startsWith('/api/auth');

  if (isPublicApiRoute) {
    return;
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
