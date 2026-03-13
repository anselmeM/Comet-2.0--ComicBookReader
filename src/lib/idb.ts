/**
 * @file IndexedDB adapter for Comet comic page cache.
 * 
 * Wraps the `idb` library to provide a typed, singleton-access layer.
 * NEVER open IndexedDB directly — always use this module.
 * 
 * @module lib/idb
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CachedComic } from '@/types';

interface CometDB extends DBSchema {
  comics: {
    key: string; // comicId
    value: CachedComic;
    indexes: { 'by-lastAccessed': number };
  };
}

const DB_NAME = 'comet-cache';
const DB_VERSION = 1;

let _db: IDBPDatabase<CometDB> | null = null;

/**
 * Returns the singleton IndexedDB connection, opening it on first call.
 * 
 * @returns The typed IDB database instance.
 * @example
 * const db = await getDB();
 * const cached = await db.get('comics', comicId);
 */
async function getDB(): Promise<IDBPDatabase<CometDB>> {
  if (_db) return _db;
  _db = await openDB<CometDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('comics', { keyPath: 'comicId' });
      store.createIndex('by-lastAccessed', 'lastAccessedAt');
    },
  });
  return _db;
}

/**
 * Retrieves cached comic pages from IndexedDB.
 * 
 * @param comicId - The unique comic ID.
 * @returns The CachedComic entry or undefined if not found.
 */
export async function getCachedComic(comicId: string): Promise<CachedComic | undefined> {
  const db = await getDB();
  return db.get('comics', comicId);
}

/**
 * Stores comic pages in IndexedDB. Updates lastAccessedAt on subsequent calls.
 * 
 * @param entry - The CachedComic entry to store.
 */
export async function setCachedComic(entry: CachedComic): Promise<void> {
  const db = await getDB();
  await db.put('comics', { ...entry, lastAccessedAt: Date.now() });
}

/**
 * Updates the lastAccessedAt timestamp for a cached comic (used for LRU tracking).
 * 
 * @param comicId - The unique comic ID.
 */
export async function touchCachedComic(comicId: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('comics', comicId);
  if (existing) {
    await db.put('comics', { ...existing, lastAccessedAt: Date.now() });
  }
}

/**
 * Removes a single comic from the cache.
 * 
 * @param comicId - The unique comic ID to evict.
 */
export async function evictCachedComic(comicId: string): Promise<void> {
  const db = await getDB();
  const entry = await db.get('comics', comicId);
  if (entry) {
    // Pages are Blobs, so we don't need to revoke ObjectURLs here.
    // The UI components are responsible for revoking any object URLs they create.
  }
  await db.delete('comics', comicId);
}

/**
 * Returns all cached comics sorted by lastAccessedAt ascending (LRU-first).
 * Used by the LRU eviction policy in lib/lru.ts.
 * 
 * @returns Array of CachedComic sorted oldest-first.
 */
export async function getAllCachedComics(): Promise<CachedComic[]> {
  const db = await getDB();
  return db.getAllFromIndex('comics', 'by-lastAccessed');
}

/**
 * Calculates the approximate size of all stored comics in IDB.
 */
export async function getStoredComicsSize(): Promise<number> {
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
