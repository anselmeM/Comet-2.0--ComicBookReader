/**
 * @file LRU Cache Eviction Policy for Comic Pages
 * 
 * Monitors IndexedDB storage usage and evicts the least recently read
 * comics when the configurable budget is exceeded.
 * 
 * @module lib/lru
 */
import { getAllCachedComics, evictCachedComic } from '@/lib/idb';

/** Maximum storage budget in bytes. Defaults to 500MB. */
const STORAGE_BUDGET_BYTES = 500 * 1024 * 1024;

/**
 * Returns the current estimated IndexedDB usage in bytes.
 * Falls back to 0 if the Storage API is unavailable.
 * 
 * @returns Promise resolving to estimated usage in bytes.
 * @example
 * const usage = await getStorageUsage();
 * console.log(`Using ${(usage / 1024 / 1024).toFixed(1)} MB`);
 */
export async function getStorageUsage(): Promise<number> {
  if (typeof navigator === 'undefined' || !navigator.storage) return 0;
  const { usage } = await navigator.storage.estimate();
  return usage ?? 0;
}

/**
 * Returns the storage budget in bytes.
 * 
 * @returns The configured storage budget.
 */
export function getStorageBudget(): number {
  return STORAGE_BUDGET_BYTES;
}

/**
 * Runs the LRU eviction policy.
 * 
 * If current storage usage exceeds the budget, evicts cached comics
 * starting from the one with the oldest `lastAccessedAt` timestamp
 * until usage is within budget.
 * 
 * Should be called after each new comic is cached.
 * 
 * @returns Promise resolving to the number of comics evicted.
 * @example
 * await setCachedComic(newEntry);
 * const evicted = await runLRUEviction();
 * if (evicted > 0) console.log(`Freed space by evicting ${evicted} comic(s)`);
 */
export async function runLRUEviction(): Promise<number> {
  const usage = await getStorageUsage();
  if (usage <= STORAGE_BUDGET_BYTES) return 0;

  // getAllCachedComics returns sorted oldest-first (see idb.ts)
  const cached = await getAllCachedComics();
  let evictionCount = 0;
  let currentUsage = usage;

  for (const comic of cached) {
    if (currentUsage <= STORAGE_BUDGET_BYTES) break;
    await evictCachedComic(comic.comicId);
    currentUsage -= comic.sizeBytes;
    evictionCount++;
  }

  return evictionCount;
}
