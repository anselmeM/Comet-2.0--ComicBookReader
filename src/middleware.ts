/**
 * @file Next.js Middleware — Route Protection
 */
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const { auth } = NextAuth(authConfig);

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', 
  '/login', 
  '/register',
  '/forgot-password',
  '/reset-password'
];
const PUBLIC_API_PREFIXES = ['/api/auth'];

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  const isAuthenticated = !!req.auth;

  // console.log(`[Middleware] Path: ${pathname} | Auth: ${isAuthenticated ? 'YES' : 'NO'}`);

  // 1. Allow public routes
  if (isPublicRoute || isPublicApi) {
    return NextResponse.next();
  }

  // 2. Redirect unauthenticated users to login
  if (!isAuthenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated users
  return NextResponse.next();
});

export const config = {
  // Match all routes EXCEPT static files, _next internals, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json).*)'],
};
