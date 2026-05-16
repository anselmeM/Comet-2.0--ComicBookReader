/**
 * @file Basic In-Memory Rate Limiter for Auth Routes
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

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
  let record = store.get(key);

  // Cleanup expired record
  if (record && now > record.resetAt) {
    store.delete(key);
    record = undefined;
  }

  if (!record) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
  } else {
    record.count++;
    store.set(key, record);
  }

  // Prevent memory leak by capping the map size
  if (store.size > 5000) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  const currentRecord = store.get(key)!;
  const current = currentRecord.count;
  const reset = currentRecord.resetAt;
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
