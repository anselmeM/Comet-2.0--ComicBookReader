import { useQuery } from '@tanstack/react-query';
import { getCachedComic, setCachedComic } from '@/lib/idb';
import { CachedComic, ComicDTO } from '@/types';
import { useAuthCallback } from './useAuthCallback';
import { useSession } from 'next-auth/react';
import { executeParserWorker } from '@/lib/comic-worker-client';
import { logger } from '@/lib/logger';

export type ComicLoadErrorType = 'metadata' | 'cache' | 'auth' | 'unknown';

export interface UseComicPagesResult {
  comic: CachedComic | null;
  metadata: ComicDTO | null;
  loading: boolean;
  error: Error | null;
  errorType: ComicLoadErrorType;
  is404: boolean;
  isAuthError: boolean;
}

/**
 * Hook to retrieve comic metadata from the server and pages from local IndexedDB.
 * Uses TanStack Query for caching and state management.
 *
 * @param comicId - The unique ID of the comic to load.
 * @returns {UseComicPagesResult} The combined state of metadata and binary page data.
 */
export function useComicPages(comicId: string): UseComicPagesResult {
  const { handleAuthError } = useAuthCallback();
  const { data: session } = useSession();

  // 1. Fetch metadata from API
  const metaQuery = useQuery<ComicDTO>({
    queryKey: ['comic-metadata', comicId],
    queryFn: async () => {
      const res = await fetch(`/api/comics/${comicId}`);
      if (!res.ok) {
        const err = new Error(`Failed to fetch metadata for comic ${comicId}`) as Error & {
          status?: number;
        };
        err.status = res.status;
        throw err;
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!comicId,
  });

  // 2. Fetch pages from IndexedDB
  // Note: We use useQuery even for local IDB to get consistent loading/error patterns
  const pagesQuery = useQuery<CachedComic | null>({
    queryKey: ['comic-pages', comicId, session?.user?.id],
    queryFn: async () => {
      const cached = await getCachedComic(comicId, session?.user?.id);
      if (!cached) {
        // Auto background download for Premium users if online
        if (session?.user?.plan === 'PREMIUM') {
          try {
            // 1. Fetch metadata first to get the title
            const metaRes = await fetch(`/api/comics/${comicId}`);
            if (!metaRes.ok) throw new Error('Metadata fetch failed');
            const metadata: ComicDTO = await metaRes.json();
            const title = metadata.title;

            // 2. Fetch download pre-signed URL
            const res = await fetch(`/api/storage/download?comicId=${comicId}`);
            if (!res.ok) throw new Error('Not synced in cloud');
            const { url } = await res.json();

            // 3. Download the binary file blob
            const downloadRes = await fetch(url);
            if (!downloadRes.ok) throw new Error('Cloud download failed');
            const blob = await downloadRes.blob();

            // 4. Wrap blob in a File object
            let finalTitle = title;
            const hasValidExtension = ['.cbz', '.cbr', '.zip'].some((ext) =>
              title.toLowerCase().endsWith(ext),
            );
            if (!hasValidExtension) {
              const headerSlice = blob.slice(0, 4);
              const headerBuffer = await headerSlice.arrayBuffer();
              const headerView = new Uint8Array(headerBuffer);
              const isRar =
                headerView[0] === 0x52 &&
                headerView[1] === 0x61 &&
                headerView[2] === 0x72 &&
                headerView[3] === 0x21;
              finalTitle = isRar ? `${title}.cbr` : `${title}.cbz`;
            }
            const file = new File([blob], finalTitle, { type: blob.type });

            // 5. Decompress pages using the Web Worker
            const pages = await executeParserWorker(file, comicId, () => {});

            // 6. Cache locally in IndexedDB
            const cachedEntry = {
              comicId,
              title,
              pages,
              coverUrl: pages.length > 0 ? URL.createObjectURL(pages[0].blob) : '',
              cachedAt: Date.now(),
              sizeBytes: pages.reduce((acc, p) => acc + p.blob.size, 0),
              lastAccessedAt: Date.now(),
            };
            await setCachedComic(cachedEntry, session?.user?.id);

            return cachedEntry;
          } catch (cloudErr) {
            logger.error(
              '[AUTO_RESTORE_FAILED] Falling back to manual import',
              {},
              cloudErr as Error,
            );
          }
        }
        throw new Error('Comic not found in local storage. Please re-import the comic file.');
      }
      return cached;
    },
    enabled: !!comicId,
    staleTime: Infinity, // Local binary data doesn't "expire" in the same way
  });

  // Determine error type based on which query failed
  const error = (metaQuery.error as Error) || (pagesQuery.error as Error) || null;
  let errorType: ComicLoadErrorType = 'unknown';
  let is404 = false;
  let isAuthError = false;

  if (metaQuery.error) {
    const metaError = metaQuery.error as { status?: number };
    // Check for specific HTTP status codes in the error response
    if (metaError?.status === 401 || metaError?.status === 403) {
      errorType = 'auth';
      isAuthError = true;
      // Centralized error handling
      handleAuthError(null, metaError);
    } else if (metaError?.status === 404) {
      errorType = 'metadata';
      is404 = true;
    } else {
      errorType = 'metadata';
    }
  } else if (pagesQuery.error) {
    errorType = 'cache';
  }

  return {
    comic: pagesQuery.data ?? null,
    metadata: metaQuery.data ?? null,
    loading: metaQuery.isLoading || pagesQuery.isLoading,
    error,
    errorType,
    is404,
    isAuthError,
  };
}
