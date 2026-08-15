/**
 * @file Rate Limiter using Upstash Ratelimit
 * Falls back to in-memory store if Redis is not configured.
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Initialize Redis client
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'), // Default, can be overridden per call
      analytics: true,
      prefix: 'comet:ratelimit',
    });
  }
} catch (err) {
  logger.warn(
    '[RateLimit] Failed to initialize Upstash Ratelimit:',
    {},
    err instanceof Error ? err : undefined,
  );
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
 * @param windowMs Time window in milliseconds (used for fallback only)
 * @returns Object with limit status and headers
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const identifier = `${key}:${limit}:${windowMs}`;

  if (ratelimit) {
    try {
      const { success, remaining, reset, limit: actualLimit } = await ratelimit.limit(identifier);

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
  if (!ratelimit && process.env.NODE_ENV === 'production') {
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
