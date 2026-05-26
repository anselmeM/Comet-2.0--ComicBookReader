/**
 * @file LRU Cache Eviction Policy for Comic Pages
 * 
 * Monitors IndexedDB storage usage and evicts the least recently read
 * comics when the configurable budget is exceeded.
 * 
 * @module lib/lru
 */
import { getAllCachedComicsMetadata, evictCachedComic, getCacheTotalSizeBytes } from '@/lib/idb';

const STORAGE_BUDGET_BYTES = 500 * 1024 * 1024; // 500MB

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
  const usage = await getStorageUsage(userId);
  if (usage <= STORAGE_BUDGET_BYTES) return 0;

  // getAllCachedComicsMetadata returns all comics
  const cached = await getAllCachedComicsMetadata(userId);
  
  // Sort oldest-first based on lastAccessedAt
  cached.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

  let evictionCount = 0;
  let currentUsage = usage;

  for (const comic of cached) {
    if (currentUsage <= STORAGE_BUDGET_BYTES) break;
    await evictCachedComic(comic.comicId, userId);
    currentUsage -= comic.sizeBytes;
    evictionCount++;
  }

  return evictionCount;
}

