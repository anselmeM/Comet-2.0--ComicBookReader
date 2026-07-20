import { validateComicArchive } from '@/lib/comic-validation';
import { computeFileHash } from '@/lib/hash';
import { extractCoverUrl } from '@/lib/thumbnail';
import { executeParserWorker, PageEntry } from '@/lib/comic-worker-client';
import { setCachedComic, getCachedComic, evictCachedComic } from '@/lib/idb';
import { runLRUEviction } from '@/lib/lru';

export interface ParseProgress {
  phase: 'hashing' | 'parsing';
  page: number;
  total: number;
}

export interface PipelineDeps {
  userId?: string;
  userPlan?: string;
  skipServerPOST?: boolean;
  existingComicId?: string;
  onProgress: (progress: ParseProgress) => void;
  onBadgeEarned?: (badge: { name: string }) => void;
  uploadToCloud?: (comicId: string, file: File) => void;
  handleAuthError?: (response: Response) => Promise<boolean>;
}

/**
 * Validates the comic file (size, extension, magic bytes).
 */
export async function validateComicFile(file: File): Promise<void> {
  return validateComicArchive(file);
}

/**
 * Computes the SHA-256 hash of a comic file with progress reporting.
 */
export async function hashComicFile(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  return computeFileHash(file, onProgress);
}

/**
 * Extracts pages from a comic archive via Web Worker.
 */
export async function parseComicPages(
  file: File,
  filehash: string,
  onProgress: (page: number, total: number) => void,
): Promise<PageEntry[]> {
  return executeParserWorker(file, filehash, onProgress);
}

/**
 * Generates a cover thumbnail from the first valid page of the parsed pages.
 */
export async function extractComicCover(pages: PageEntry[]): Promise<string | null> {
  return extractCoverUrl(pages);
}

/**
 * Stores parsed comic pages and metadata in IndexedDB.
 */
export async function cacheComicLocally(
  comicId: string,
  title: string,
  pages: PageEntry[],
  userId?: string,
): Promise<void> {
  await setCachedComic(
    {
      comicId,
      title,
      pages,
      coverUrl: pages.length > 0 ? URL.createObjectURL(pages[0].blob) : '',
      cachedAt: Date.now(),
      sizeBytes: pages.reduce((acc, p) => acc + p.blob.size, 0),
      lastAccessedAt: Date.now(),
    },
    userId,
  );
}

/**
 * Enforces local cache size limits via LRU eviction.
 */
export async function evictCacheIfNeeded(userId?: string): Promise<void> {
  await runLRUEviction(userId);
}

/**
 * Re-keys a locally cached comic entry from its hash-based ID to the server-assigned ID.
 */
export async function reKeyLocalCache(
  localComicId: string,
  serverComicId: string,
  userId?: string,
): Promise<void> {
  const localEntry = await getCachedComic(localComicId, userId);
  if (localEntry) {
    await setCachedComic({ ...localEntry, comicId: serverComicId }, userId);
    await evictCachedComic(localComicId, userId);
  }
}

/**
 * POSTs comic metadata to the server to register the comic in the library.
 * Returns the server-assigned comic ID.
 */
export async function syncComicToServer(
  title: string,
  filehash: string,
  sizeBytes: number,
  pageCount: number,
  coverUrl: string | null,
  deps: {
    handleAuthError?: (response: Response) => Promise<boolean>;
    onBadgeEarned?: (badge: { name: string }) => void;
  } = {},
): Promise<string> {
  const response = await fetch('/api/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, filehash, sizeBytes, pageCount, coverUrl }),
  });

  if (!response.ok) {
    if (deps.handleAuthError) {
      const wasAuthError = await deps.handleAuthError(response);
      if (wasAuthError) throw new Error('Authentication error');
    }
    throw new Error(`Server returned ${response.status}`);
  }

  const data = await response.json();

  if (data.newlyEarnedBadges?.length > 0 && deps.onBadgeEarned) {
    data.newlyEarnedBadges.forEach(deps.onBadgeEarned);
  }

  return data.id;
}

/**
 * Full comic parsing pipeline orchestrator.
 *
 * Runs the complete pipeline: validation → hash → parse → cover → cache → server sync → re-key → cloud upload.
 * Each step is also exported individually for targeted use and testing.
 */
export async function runComicPipeline(file: File, deps: PipelineDeps): Promise<string> {
  await validateComicFile(file);

  deps.onProgress({ phase: 'hashing', page: 0, total: 100 });
  const filehash = await hashComicFile(file, (p) => {
    deps.onProgress({ phase: 'hashing', page: Math.round(p * 100), total: 100 });
  });

  const localComicId = filehash;

  deps.onProgress({ phase: 'parsing', page: 0, total: 100 });
  const pages = await parseComicPages(file, filehash, (page, total) => {
    deps.onProgress({ phase: 'parsing', page, total });
  });

  const coverUrl = await extractComicCover(pages);
  const title = file.name.replace(/\.(cbz|cbr|zip)$/i, '');
  const sizeBytes = pages.reduce((acc, p) => acc + p.blob.size, 0);

  await cacheComicLocally(localComicId, title, pages, deps.userId);
  await evictCacheIfNeeded(deps.userId);

  let serverComicId = deps.existingComicId;

  if (!deps.skipServerPOST && !serverComicId) {
    serverComicId = await syncComicToServer(title, filehash, sizeBytes, pages.length, coverUrl, {
      handleAuthError: deps.handleAuthError,
      onBadgeEarned: deps.onBadgeEarned,
    });
  }

  if (!serverComicId) throw new Error('No comic ID available');

  await reKeyLocalCache(localComicId, serverComicId, deps.userId);

  if (!deps.skipServerPOST && deps.userPlan === 'PREMIUM' && deps.uploadToCloud) {
    deps.uploadToCloud(serverComicId, file);
  }

  return serverComicId;
}
