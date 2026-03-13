import { useQuery } from '@tanstack/react-query';
import { getCachedComic } from '@/lib/idb';
import { CachedComic, ComicDTO } from '@/types';

export interface UseComicPagesResult {
  comic: CachedComic | null;
  metadata: ComicDTO | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to retrieve comic metadata from the server and pages from local IndexedDB.
 * Uses TanStack Query for caching and state management.
 * 
 * @param comicId - The unique ID of the comic to load.
 * @returns {UseComicPagesResult} The combined state of metadata and binary page data.
 */
export function useComicPages(comicId: string): UseComicPagesResult {
  // 1. Fetch metadata from API
  const metaQuery = useQuery<ComicDTO>({
    queryKey: ['comic-metadata', comicId],
    queryFn: async () => {
      const res = await fetch(`/api/comics/${comicId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch metadata for comic ${comicId}`);
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
        throw new Error('Comic not found in local cache. You may need to import the file again.');
      }
      return cached;
    },
    enabled: !!comicId,
    staleTime: Infinity, // Local binary data doesn't "expire" in the same way
  });

  return {
    comic: pagesQuery.data ?? null,
    metadata: metaQuery.data ?? null,
    loading: metaQuery.isLoading || pagesQuery.isLoading,
    error: (metaQuery.error as Error) || (pagesQuery.error as Error) || null,
  };
}
