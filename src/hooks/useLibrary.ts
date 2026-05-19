import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { evictCachedComic } from '@/lib/idb';
import { PaginatedLibraryResponseDTO } from '@/types';
import { useAuthCallback } from './useAuthCallback';

interface UseLibraryOptions {
  page?: number;
  limit?: number;
  search?: string;
  series?: string;
  sortBy?: string;
  yearStart?: number | null;
  yearEnd?: number | null;
  readStatus?: string;
}

export function useLibrary(options: UseLibraryOptions = {}) {
  const { handleAuthError } = useAuthCallback();
  const { 
    page = 1, 
    limit = 20, 
    search = '', 
    series = '', 
    sortBy = 'recent',
    yearStart = null,
    yearEnd = null,
    readStatus = 'all'
  } = options;
  
  return useQuery<PaginatedLibraryResponseDTO>({
    queryKey: ['library', page, limit, search, series, sortBy, yearStart, yearEnd, readStatus],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        series,
        sortBy,
        readStatus
      });
      
      if (yearStart !== null) params.set('yearStart', yearStart.toString());
      if (yearEnd !== null) params.set('yearEnd', yearEnd.toString());
      
      const res = await fetch(`/api/library?${params.toString()}`);
      if (!res.ok) {
        await handleAuthError(res);
        throw new Error('Failed to fetch library');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes, as per GEMINI.md
  });
}

export function useDeleteComic() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async (comicId: string) => {
      // 1. Delete from Server
      const res = await fetch(`/api/library/${comicId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        
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

export function useUpdateComic() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/comics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        
        const error = await res.json();
        throw new Error(error.error || 'Failed to update comic');
      }

      return res.json();
    },
    onSuccess: (updatedComic) => {
      // Optimistically update the library cache
      queryClient.setQueriesData<PaginatedLibraryResponseDTO>(
        { queryKey: ['library'] },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((c) => (c.id === updatedComic.id ? { ...c, ...updatedComic } : c)),
          };
        }
      );
      // Also invalidate to be sure
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });
}
