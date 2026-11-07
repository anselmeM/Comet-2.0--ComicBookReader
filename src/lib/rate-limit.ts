/**
 * @file Rate Limiter using Upstash Ratelimit
 * Falls back to in-memory store if Redis is not configured.
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Initialize Redis client
let redis: Redis | null = null;

// One limiter per (limit, windowMs) pair, so each caller's budget is actually
// enforced with its own sliding window instead of a single hard-coded default.
const slidingLimiters = new Map<string, Ratelimit>();
const MAX_CACHED_LIMITERS = 50;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (err) {
  logger.warn(
    '[RateLimit] Failed to initialize Upstash Ratelimit:',
    {},
    err instanceof Error ? err : undefined,
  );
}

/**
 * Lazily creates (and caches) the limiter for a given budget.
 * Returns null when Redis is unavailable, so callers use the memory fallback.
 */
function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;

  const cacheKey = `${limit}:${windowMs}`;
  const cached = slidingLimiters.get(cacheKey);
  if (cached) return cached;

  try {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: true,
      prefix: 'comet:ratelimit',
    });

    // Bounded cache: cap how many distinct budgets can be retained.
    if (slidingLimiters.size >= MAX_CACHED_LIMITERS) {
      slidingLimiters.clear();
    }
    slidingLimiters.set(cacheKey, limiter);
    return limiter;
  } catch (err) {
    logger.error(
      `[RateLimit] Failed to create Upstash limiter for ${cacheKey}:`,
      {},
      err instanceof Error ? err : undefined,
    );
    return null;
  }
}

// In-memory fallback
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, RateLimitRecord>();

/**
 * Checks if a request should be rate-limited.
 *
 * @param key Unique key to limit (e.g. IP address or email)
 * @param limit Maximum number of requests allowed
 * @param windowMs Time window in milliseconds
 * @returns Object with limit status and headers
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const identifier = `${key}:${limit}:${windowMs}`;
  const limiter = getLimiter(limit, windowMs);

  if (limiter) {
    try {
      const { success, remaining, reset, limit: actualLimit } = await limiter.limit(identifier);

      return {
        isLimited: !success,
        remaining,
        reset,
        headers: {
          'X-RateLimit-Limit': actualLimit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      };
    } catch (err) {
      logger.error(
        `[RateLimit] Redis error for key ${key}:`,
        {},
        err instanceof Error ? err : undefined,
      );
    }
  }

  // Fail closed in production when Redis (and thus the distributed rate
  // limiter) is not configured: per-instance in-memory limiting is bypassable
  // on serverless, so refuse rather than serve unlimited traffic. In dev,
  // keep the per-instance fallback so local workflows aren't blocked.
  if (!redis && process.env.NODE_ENV === 'production') {
    logger.error(
      `[RateLimit] UPSTASH_REDIS is not configured in production — failing closed for key ${key}`,
    );
    return {
      isLimited: true,
      remaining: 0,
      reset: 0,
      headers: {
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '0',
      },
    };
  }

  // Fallback to memory
  const now = Date.now();
  let record = memoryStore.get(identifier);

  if (record && now > record.resetAt) {
    memoryStore.delete(identifier);
    record = undefined;
  }

  if (!record) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(identifier, record);
  } else {
    record.count++;
  }

  // Prevent memory leak - more aggressive cleanup
  if (memoryStore.size > 2000) {
    const keysToDelete = Array.from(memoryStore.keys()).slice(0, 500);
    keysToDelete.forEach((k) => memoryStore.delete(k));
  }

  const current = record.count;
  const reset = record.resetAt;
  const remaining = Math.max(0, limit - current);
  const isLimited = current > limit;

  return {
    isLimited,
    remaining,
    reset,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
}
