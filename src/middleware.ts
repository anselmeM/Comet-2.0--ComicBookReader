/**
 * @file Next.js Middleware — Route Protection
 *
 * Protects all app routes (/library, /reader, /settings, /api/library, /api/comics).
 * Public routes: /, /login, /api/auth/*.
 */
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/'];
const PUBLIC_API_PREFIXES = ['/api/auth'];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  console.log('[Middleware] Path:', pathname, 'Auth:', req.auth ? 'User present' : 'null');

  if (isPublicRoute || isPublicApi) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    // If it's an API request, return 401 JSON instead of redirecting to HTML login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/api/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes EXCEPT static files, _next internals, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json).*)'],
};
