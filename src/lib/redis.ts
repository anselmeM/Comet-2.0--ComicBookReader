import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { logger } from './logger';

// We allow graceful degradation if Redis env vars are missing (e.g. local dev)
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = hasRedisConfig ? Redis.fromEnv() : null;

// Create a new ratelimiter, that allows 50 requests per 10 seconds per identifier
export const ratelimit = hasRedisConfig
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(50, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null;

/**
 * Helper to safely get from cache without throwing if Redis is down/unconfigured
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (error) {
    logger.warn(`Redis get error for key ${key}`, {}, error instanceof Error ? error : undefined);
    return null;
  }
}

/**
 * Helper to safely set cache without throwing if Redis is down/unconfigured
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  expiresInSeconds?: number,
): Promise<void> {
  if (!redis) return;
  try {
    if (expiresInSeconds) {
      await redis.set(key, data, { ex: expiresInSeconds });
    } else {
      await redis.set(key, data);
    }
  } catch (error) {
    logger.warn(`Redis set error for key ${key}`, {}, error instanceof Error ? error : undefined);
  }
}
