/**
 * @file Basic In-Memory Rate Limiter for Auth Routes
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

/**
 * Checks if a request should be rate-limited.
 * 
 * @param key Unique key to limit (e.g. IP address or email)
 * @param limit Maximum number of requests allowed
 * @param windowMs Time window in milliseconds
 * @returns Object with limit status and headers
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = store[key];

  // Cleanup expired record
  if (record && now > record.resetAt) {
    delete store[key];
  }

  if (!store[key]) {
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    };
  } else {
    store[key].count++;
  }

  const current = store[key].count;
  const reset = store[key].resetAt;
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
