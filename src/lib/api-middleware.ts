import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-utils';
import { ratelimit } from '@/lib/redis';

type SessionType = NonNullable<Awaited<ReturnType<typeof validateSession>>['session']>;

export type AuthenticatedHandler<T = any, R = NextRequest | Request> = (
  req: R,
  context: T,
  session: SessionType,
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-Order Function to wrap Next.js App Router API endpoints with standard session validation.
 * Injects the guaranteed authenticated `session` into the handler.
 */
export function withAuth<T = any, R extends NextRequest | Request = NextRequest | Request>(
  handler: AuthenticatedHandler<T, R>,
) {
  return async (req: R, context: T) => {
    const { session, errorResponse } = await validateSession();

    if (errorResponse || !session) {
      return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apply global rate limiting if Redis is configured
    if (ratelimit) {
      const { success, limit, reset, remaining } = await ratelimit.limit(session.user.id);
      if (!success) {
        return NextResponse.json(
          { error: 'Too Many Requests' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
            },
          },
        );
      }
    }

    return handler(req, context, session);
  };
}
