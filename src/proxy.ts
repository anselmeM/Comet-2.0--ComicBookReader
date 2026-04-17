/**
 * @file Next.js Middleware — Route Protection
 *
 * Protects all app routes (/library, /reader, /settings, /api/library, /api/comics).
 * Public routes: /, /login, /register, /forgot-password, /reset-password, /api/auth/*.
 * 
 * Authentication flow:
 * - Unauthenticated users accessing protected routes are redirected to /login
 * - After login, users are redirected back to their original destination via callbackUrl
 * - Users without onboarding completion are redirected to /onboarding
 */
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', 
  '/login', 
  '/register',
  '/forgot-password',
  '/reset-password'
];
const PUBLIC_API_PREFIXES = ['/api/auth'];

export default auth((req: NextRequest & { auth: unknown }) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  console.log('[Middleware] Path:', pathname, 'Auth:', req.auth ? 'User present' : 'null');

  // Allow public routes without authentication
  if (isPublicRoute || isPublicApi) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    // If it's an API request, return 401 JSON instead of redirecting to HTML login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Redirect to custom login page with callback URL for post-login redirect
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users - check onboarding status from JWT token
  // Note: The JWT token contains hasCompletedOnboarding from auth.ts callbacks
  const authSession = req.auth as { 
    user?: { id: string; name?: string | null; image?: string | null }; 
    hasCompletedOnboarding?: boolean;
  } | null;
  
  // Default to true (completed) if not found in token to prevent lockouts
  // Onboarding check only applies to non-API routes
  const hasCompletedOnboarding = authSession?.hasCompletedOnboarding ?? true;

  if (!hasCompletedOnboarding && pathname !== '/onboarding' && !pathname.startsWith('/api/')) {
    console.log('[Middleware] User has not completed onboarding, redirecting to /onboarding');
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes EXCEPT static files, _next internals, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|manifest.json).*)'],
};
