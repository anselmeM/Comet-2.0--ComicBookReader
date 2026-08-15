/**
 * @file Sync Manager for Offline-First Data
 * Manages a queue of failed API requests in IndexedDB and retries them
 * when a network connection is available.
 */

import { getDB } from '@/lib/idb';
import { SyncTask } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Queues a request for background sync.
 */
export async function queueSyncTask(
  url: string,
  method: SyncTask['method'],
  body: SyncTask['body'],
  headers: Record<string, string> = { 'Content-Type': 'application/json' },
): Promise<void> {
  const db = await getDB();
  const task: SyncTask = {
    id: crypto.randomUUID(),
    url,
    method,
    body,
    headers,
    timestamp: Date.now(),
    attempts: 0,
  };

  await db.put('sync_tasks', task);

  // Try to register for native background sync if available
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (
        registration as unknown as { sync: { register(tag: string): Promise<void> } }
      ).sync.register('comet-sync');
    } catch (err) {
      logger.warn(
        '[SyncManager] Failed to register native sync, falling back to manual process.',
        {},
        err instanceof Error ? err : undefined,
      );
      if (navigator.onLine) processSyncQueue();
    }
  } else {
    // Fallback for browsers without Background Sync API
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      processSyncQueue();
    }
  }
}

/**
 * Processes all pending sync tasks in the queue.
 */
export async function processSyncQueue(): Promise<number> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) return 0;

  const db = await getDB();
  const tasks = await db.getAll('sync_tasks');
  let successCount = 0;

  for (const task of tasks) {
    try {
      const response = await fetch(task.url, {
        method: task.method,
        headers: task.headers,
        body: task.body ? JSON.stringify(task.body) : undefined,
      });

      if (response.ok) {
        await db.delete('sync_tasks', task.id);
        successCount++;
      } else {
        // Increment attempts
        task.attempts++;
        if (task.attempts > 10) {
          // Give up after 10 tries
          await db.delete('sync_tasks', task.id);
        } else {
          await db.put('sync_tasks', task);
        }
      }
    } catch (err) {
      logger.warn(
        `[SyncManager] Failed to sync task ${task.id}, will retry later.`,
        {},
        err instanceof Error ? err : undefined,
      );
    }
  }

  return successCount;
}

/**
 * Initializes the sync manager listeners.
 */
export function initSyncManager() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', () => {
    logger.info('[SyncManager] Online detected, processing queue...');
    processSyncQueue();
  });
}
