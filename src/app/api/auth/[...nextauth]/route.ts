import { handlers } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Auth.js v5 route handler for Next.js App Router.
 * Handles GET and POST for all /api/auth/* paths.
 * POST requests are rate-limited to prevent brute-force login attacks.
 */
const { GET: _GET, POST: _POST } = handlers;

export const GET = _GET;

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
  const limiter = await rateLimit(`auth_${ip}`, 10, 60 * 1000);

  if (limiter.isLimited) {
    return NextResponse.json(
      { error: 'Too many authentication attempts. Please try again in a minute.' },
      { status: 429, headers: limiter.headers as Record<string, string> },
    );
  }

  return _POST(req);
}

// Force Node.js runtime to ensure Prisma and bcryptjs work correctly
export const runtime = 'nodejs';
