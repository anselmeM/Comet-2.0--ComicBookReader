'use client';

import { useUpdateComic } from './useLibrary';
import { useNotification } from '@/components/atoms/Toast';

/**
 * Hook to manage comic favorites with server synchronization.
 * Uses the useUpdateComic mutation to persist changes to the DB.
 */
export function useFavorites() {
  const updateComic = useUpdateComic();
  const { triggerNotification } = useNotification();

  const toggleFavorite = async (comicId: string, currentStatus: boolean) => {
    try {
      await updateComic.mutateAsync({
        id: comicId,
        data: { isFavorite: !currentStatus },
      });
      
      triggerNotification(
        !currentStatus ? 'Added to favorites' : 'Removed from favorites',
        'success'
      );
    } catch (error) {
      triggerNotification('Failed to update favorite status', 'error');
      console.error(error);
    }
  };

  // Helper to check if a comic is favorite (mostly for components that don't have the comic object)
  // In most cases, components should use comic.isFavorite directly.
  const isFavorite = (comic: { isFavorite?: boolean }) => {
    return !!comic.isFavorite;
  };

  return {
    toggleFavorite,
    isFavorite,
    isUpdating: updateComic.isPending,
  };
}
