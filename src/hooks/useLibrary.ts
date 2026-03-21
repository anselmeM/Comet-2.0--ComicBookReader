import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Comic, ReadingProgress } from '@prisma/client';
import { evictCachedComic } from '@/lib/idb';

// The API might return comics with some joined relation if needed
export type LibraryComic = Comic & {
  progress?: ReadingProgress | null;
};

export function useLibrary() {
  return useQuery<LibraryComic[]>({
    queryKey: ['library'],
    queryFn: async () => {
      const res = await fetch('/api/library');
      if (!res.ok) {
        throw new Error('Failed to fetch library');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes, as per GEMINI.md
  });
}

export function useDeleteComic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comicId: string) => {
      // 1. Delete from Server
      const res = await fetch(`/api/library/${comicId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete comic');
      }

      // 2. Delete from local IndexedDB
      await evictCachedComic(comicId);
      
      return comicId;
    },
    onSuccess: () => {
      // Invalidate library query to refresh the grid
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
