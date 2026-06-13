'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@/components/atoms/Toast';
import { useAuthCallback } from './useAuthCallback';
import { PaginatedLibraryResponseDTO } from '@/types';
import { logger } from '@/lib/logger';

/**
 * Hook to manage comic favorites with server synchronization.
 * Uses dedicated POST/DELETE endpoints.
 */
export function useFavorites() {
  const queryClient = useQueryClient();
  const { triggerNotification } = useNotification();
  const { handleAuthError } = useAuthCallback();

  const favoriteMutation = useMutation({
    mutationFn: async ({ comicId, isFavorite }: { comicId: string; isFavorite: boolean }) => {
      const method = isFavorite ? 'POST' : 'DELETE';
      const res = await fetch(`/api/comics/${comicId}/favorite`, {
        method,
      });

      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');

        const error = await res.json();
        throw new Error(error.error || 'Failed to update favorite status');
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
            data: oldData.data.map((c) =>
              c.id === updatedComic.id ? { ...c, ...updatedComic } : c,
            ),
          };
        },
      );
      // Invalidate to make sure cache matches DB
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const toggleFavorite = async (comicId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      await favoriteMutation.mutateAsync({
        comicId,
        isFavorite: nextStatus,
      });

      triggerNotification(nextStatus ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (error) {
      triggerNotification('Failed to update favorite status', 'error');
      logger.error(String(error), {}, error instanceof Error ? error : undefined);
    }
  };

  const isFavorite = (comic: { isFavorite?: boolean }) => {
    return !!comic.isFavorite;
  };

  return {
    toggleFavorite,
    isFavorite,
    isUpdating: favoriteMutation.isPending,
  };
}
