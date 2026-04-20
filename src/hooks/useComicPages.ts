import { useQuery } from '@tanstack/react-query';
import { getCachedComic } from '@/lib/idb';
import { CachedComic, ComicDTO } from '@/types';
import { useAuthCallback } from './useAuthCallback';

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

  // 1. Fetch metadata from API
  const metaQuery = useQuery<ComicDTO>({
    queryKey: ['comic-metadata', comicId],
    queryFn: async () => {
      const res = await fetch(`/api/comics/${comicId}`);
      if (!res.ok) {
        const err = new Error(`Failed to fetch metadata for comic ${comicId}`) as Error & { status?: number };
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
    queryKey: ['comic-pages', comicId],
    queryFn: async () => {
      const cached = await getCachedComic(comicId);
      if (!cached) {
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
