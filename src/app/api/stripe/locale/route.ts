import { NextResponse, NextRequest } from 'next/server';

/**
 * GET /api/stripe/locale — Detects user country based on Vercel headers.
 */
export async function GET(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country') || 'US';
  return NextResponse.json({ country });
}
