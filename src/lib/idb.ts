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

const DB_PREFIX = 'comet-cache-';
const DB_VERSION = 2;

const _dbs: Record<string, IDBPDatabase<CometDB>> = {};

/**
 * Returns the user-scoped IndexedDB connection, opening it on first call.
 * 
 * @param userId - Optional user ID to scope the cache.
 * @returns The typed IDB database instance.
 */
export async function getDB(userId?: string): Promise<IDBPDatabase<CometDB>> {
  const dbName = userId ? `${DB_PREFIX}${userId}` : `${DB_PREFIX}anonymous`;
  if (_dbs[dbName]) return _dbs[dbName]!;
  
  const db = await openDB<CometDB>(dbName, DB_VERSION, {
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
  _dbs[dbName] = db;
  return db;
}

/**
 * Closes and removes a cached database connection for a user.
 */
export async function closeDB(userId?: string): Promise<void> {
  const dbName = userId ? `${DB_PREFIX}${userId}` : `${DB_PREFIX}anonymous`;
  const db = _dbs[dbName];
  if (db) {
    db.close();
    delete _dbs[dbName];
  }
}

/**
 * Deletes a user's IndexedDB database.
 */
export async function deleteUserDB(userId?: string): Promise<void> {
  await closeDB(userId);
  const dbName = userId ? `${DB_PREFIX}${userId}` : `${DB_PREFIX}anonymous`;
  if (typeof window !== 'undefined' && window.indexedDB) {
    window.indexedDB.deleteDatabase(dbName);
  }
}

/**
 * Deletes the legacy global comet-cache database.
 */
export async function deleteLegacyDB(): Promise<void> {
  if (typeof window !== 'undefined' && window.indexedDB) {
    window.indexedDB.deleteDatabase('comet-cache');
  }
}

/**
 * Persists a parsed comic to the local cache.
 */
export async function setCachedComic(comic: CachedComic, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.put('comics', {
    ...comic,
    lastAccessedAt: Date.now(), // update access timestamp on write
  });
}

/**
 * Retrieves a comic from the local cache.
 */
export async function getCachedComic(comicId: string, userId?: string): Promise<CachedComic | undefined> {
  const db = await getDB(userId);
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
export async function evictCachedComic(comicId: string, userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.delete('comics', comicId);
}

/**
 * Returns a list of all currently cached comic metadata (no blobs).
 */
export async function getAllCachedComicsMetadata(userId?: string) {
  const db = await getDB(userId);
  const all = await db.getAll('comics');
  
  // Return metadata only to keep memory footprint low
  return all.map(({ pages, ...meta }) => meta);
}

/**
 * Returns the total size in bytes of all cached comic pages.
 */
export async function getCacheTotalSizeBytes(userId?: string): Promise<number> {
  const db = await getDB(userId);
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
export async function clearAllParsedComics(userId?: string): Promise<void> {
  const db = await getDB(userId);
  await db.clear('comics');
}

