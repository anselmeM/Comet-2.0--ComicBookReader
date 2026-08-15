import type { NextRequest } from 'next/server';

/**
 * Resolves the client IP for rate limiting.
 *
 * Prefers platform-set headers over the client-controlled `x-forwarded-for`:
 * - `x-real-ip` — set by the reverse proxy/platform (Vercel sets it)
 * - `x-vercel-forwarded-for` — Vercel's canonical forwarded header
 * - `x-forwarded-for` — falls back to the first entry (on Vercel this header
 *   is overwritten by the proxy, so it's safe there; on naive self-hosted
 *   proxies a client can append, hence the preference order)
 */
export function getClientIp(req: Request | NextRequest): string {
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;

  const vercelForwarded = req.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) return vercelForwarded.split(',')[0].trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  return '127.0.0.1';
}
