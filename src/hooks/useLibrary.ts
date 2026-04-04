import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Comic, ReadingProgress } from '@prisma/client';
import { evictCachedComic } from '@/lib/idb';

// The API might return comics with some joined relation if needed
export type LibraryComic = Comic & {
  progress?: ReadingProgress | null;
};

// Pagination response type
export interface PaginatedLibraryResponse {
  data: LibraryComic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseLibraryOptions {
  page?: number;
  limit?: number;
}

export function useLibrary(options: UseLibraryOptions = {}) {
  const { page = 1, limit = 20 } = options;

  return useQuery<PaginatedLibraryResponse>({
    queryKey: ['library', page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/library?page=${page}&limit=${limit}`);
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
