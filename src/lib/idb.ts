/**
 * @file IndexedDB adapter for Comet comic page cache.
 * 
 * Wraps the `idb` library to provide a typed, singleton-access layer.
 * NEVER open IndexedDB directly — always use this module.
 * 
 * @module lib/idb
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CachedComic, SyncTask } from '@/types';

interface CometDB extends DBSchema {
  comics: {
    key: string; // comicId
    value: CachedComic;
    indexes: { 'by-lastAccessed': number };
  };
  sync_tasks: {
    key: string;
    value: SyncTask;
  };
}

const DB_NAME = 'comet-cache';
const DB_VERSION = 2;

let _db: IDBPDatabase<CometDB> | null = null;

/**
 * Returns the singleton IndexedDB connection, opening it on first call.
 * 
 * @returns The typed IDB database instance.
 */
export async function getDB(): Promise<IDBPDatabase<CometDB>> {
  if (_db) return _db;
  _db = await openDB<CometDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore('comics', { keyPath: 'comicId' });
        store.createIndex('by-lastAccessed', 'lastAccessedAt');
      }
      if (oldVersion < 2) {
        db.createObjectStore('sync_tasks', { keyPath: 'id' });
      }
    },
  });
  return _db;
}

/**
 * Persists a parsed comic to the local cache.
 */
export async function setCachedComic(comic: CachedComic): Promise<void> {
  const db = await getDB();
  await db.put('comics', {
    ...comic,
    lastAccessedAt: Date.now(), // update access timestamp on write
  });
}

/**
 * Retrieves a comic from the local cache.
 */
export async function getCachedComic(comicId: string): Promise<CachedComic | undefined> {
  const db = await getDB();
  const comic = await db.get('comics', comicId);
  
  if (comic) {
    // Background update of lastAccessedAt
    db.put('comics', { ...comic, lastAccessedAt: Date.now() });
  }
  
  return comic;
}

/**
 * Deletes a specific comic from the cache.
 */
export async function evictCachedComic(comicId: string): Promise<void> {
  const db = await getDB();
  await db.delete('comics', comicId);
}

/**
 * Returns a list of all currently cached comic metadata (no blobs).
 */
export async function getAllCachedComicsMetadata() {
  const db = await getDB();
  const all = await db.getAll('comics');
  
  // Return metadata only to keep memory footprint low
  return all.map(({ pages, ...meta }) => meta);
}

/**
 * Returns the total size in bytes of all cached comic pages.
 */
export async function getCacheTotalSizeBytes(): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('comics');
  let size = 0;
  for (const comic of all) {
    for (const page of comic.pages) {
      size += page.blob.size;
    }
  }
  return size;
}

/**
 * Clears all cached comics from IDB.
 */
export async function clearAllParsedComics(): Promise<void> {
  const db = await getDB();
  await db.clear('comics');
}
