/**
 * @file API Cache using Upstash Redis
 * Falls back to in-memory Map if Redis is not configured.
 */
import { Redis } from '@upstash/redis';

// Initialize Redis client if environment variables are present
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (err) {
  console.warn('[Cache] Failed to initialize Upstash Redis:', err);
}

// In-memory fallback
type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};
const memoryStore = new Map<string, CacheEntry<any>>();

/**
 * Gets a value from the cache.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      return await redis.get<T>(key);
    } catch (err) {
      console.error(`[Cache] Redis GET error for key ${key}:`, err);
    }
  }

  // Fallback to memory
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Sets a value in the cache with a specific TTL.
 */
export async function setCache<T>(key: string, data: T, ttlSeconds = 60): Promise<void> {
  if (redis) {
    try {
      await redis.set(key, data, { ex: ttlSeconds });
      return;
    } catch (err) {
      console.error(`[Cache] Redis SET error for key ${key}:`, err);
    }
  }

  // Fallback to memory
  memoryStore.set(key, {
    data,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });

  if (memoryStore.size > 500) {
    const oldestKey = memoryStore.keys().next().value;
    if (oldestKey) memoryStore.delete(oldestKey);
  }
}

/**
 * Invalidates a specific cache key or multiple keys using a prefix.
 */
export async function invalidateCache(keyOrPrefix: string, usePrefix = false): Promise<void> {
  if (redis) {
    try {
      if (!usePrefix) {
        await redis.del(keyOrPrefix);
      } else {
        // Caution: KEYS/SCAN might be slow on large databases, 
        // but for a user-prefixed cache it's usually fine.
        let cursor = "0";
        do {
          const [nextCursor, keys] = await redis.scan(cursor, { match: `${keyOrPrefix}*`, count: 100 });
          if (keys.length > 0) {
            await redis.del(...keys);
          }
          cursor = nextCursor;
        } while (cursor !== "0");
      }
      return;
    } catch (err) {
      console.error(`[Cache] Redis DEL error for ${keyOrPrefix}:`, err);
    }
  }

  // Fallback to memory
  if (!usePrefix) {
    memoryStore.delete(keyOrPrefix);
    return;
  }

  for (const key of memoryStore.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Helper to generate a cache key for a user and endpoint.
 */
export function genCacheKey(userId: string, endpoint: string, params?: any): string {
  const base = `comet:u:${userId}:${endpoint}`;
  if (!params) return base;

  // Use a stable stringify for params to ensure consistent keys
  const stableParams = typeof params === 'object' && params !== null
    ? Object.keys(params).sort().reduce((acc: any, key) => {
        acc[key] = params[key];
        return acc;
      }, {})
    : params;

  return `${base}:${JSON.stringify(stableParams)}`;
}
