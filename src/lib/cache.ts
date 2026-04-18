/**
 * @file Simple In-Memory API Cache
 * Used to store frequently accessed database results (like library lists)
 * to reduce database load and improve performance.
 */

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cacheStore = new Map<string, CacheEntry<any>>();

/**
 * Gets a value from the cache or returns null if not found or expired.
 * 
 * @param key Cache key
 * @returns Cached data or null
 */
export function getCache<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Sets a value in the cache with a specific TTL.
 * 
 * @param key Cache key
 * @param data Data to store
 * @param ttlSeconds Time-to-live in seconds (default 60)
 */
export function setCache<T>(key: string, data: T, ttlSeconds = 60): void {
  cacheStore.set(key, {
    data,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });

  // Basic cleanup: prevent memory leaks by limiting cache size
  if (cacheStore.size > 500) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey) cacheStore.delete(oldestKey);
  }
}

/**
 * Invalidates a specific cache key or multiple keys using a prefix.
 * 
 * @param keyOrPrefix Key to delete or prefix to match
 * @param usePrefix If true, deletes all keys starting with keyOrPrefix
 */
export function invalidateCache(keyOrPrefix: string, usePrefix = false): void {
  if (!usePrefix) {
    cacheStore.delete(keyOrPrefix);
    return;
  }

  for (const key of cacheStore.keys()) {
    if (key.startsWith(keyOrPrefix)) {
      cacheStore.delete(key);
    }
  }
}

/**
 * Helper to generate a cache key for a user and endpoint.
 */
export function genCacheKey(userId: string, endpoint: string, params?: any): string {
  if (!params) return `u:${userId}:${endpoint}`;
  return `u:${userId}:${endpoint}:${JSON.stringify(params)}`;
}
