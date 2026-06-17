/**
 * @file LRU Cache Eviction Policy for Comic Pages
 *
 * Monitors IndexedDB storage usage and evicts the least recently read
 * comics when the configurable budget is exceeded.
 *
 * @module lib/lru
 */
import { getAllCachedComicsMetadata, evictCachedComic, getCacheTotalSizeBytes } from '@/lib/idb';

function getStorageLimitBytes(): number {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('comet-settings-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.cacheLimitGB !== undefined) {
          return parsed.state.cacheLimitGB * 1024 * 1024 * 1024;
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  return 2 * 1024 * 1024 * 1024; // Default to 2GB
}

/**
 * Gets the current estimated storage usage of our IndexedDB cache.
 */
async function getStorageUsage(userId?: string): Promise<number> {
  return await getCacheTotalSizeBytes(userId);
}

/**
 * Executes the LRU eviction policy.
 *
 * @returns The number of comics evicted.
 */
export async function runLRUEviction(userId?: string): Promise<number> {
  const limitBytes = getStorageLimitBytes();
  const usage = await getStorageUsage(userId);
  if (usage <= limitBytes) return 0;

  // getAllCachedComicsMetadata returns all comics
  const cached = await getAllCachedComicsMetadata(userId);

  // Sort oldest-first based on lastAccessedAt
  cached.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  let evictionCount = 0;
  let currentUsage = usage;

  for (const comic of cached) {
    if (currentUsage <= limitBytes) break;
    await evictCachedComic(comic.comicId, userId);
    currentUsage -= comic.sizeBytes;
    evictionCount++;
  }

  return evictionCount;
}
