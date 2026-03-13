'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReaderStore } from '@/stores/readerStore';
import { UpdateProgressPayload } from '@/types';

/**
 * Hook to automatically persist reading progress to the server.
 * Uses TanStack Query mutations and debounces updates to avoid excessive API calls.
 * 
 * @param comicId - The unique ID of the comic.
 */
export function useReadingProgress(comicId: string) {
  const queryClient = useQueryClient();
  const currentPage = useReaderStore((state) => state.currentPage);
  const totalPages = useReaderStore((state) => state.totalPages);
  const zoomLevel = useReaderStore((state) => state.zoomLevel);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPage = useRef<number | null>(null);

  const { mutate } = useMutation({
    mutationFn: async (payload: UpdateProgressPayload) => {
      const response = await fetch(`/api/comics/${comicId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save reading progress');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate metadata to reflect new progress in library/other views
      queryClient.invalidateQueries({ queryKey: ['comic-metadata', comicId] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  useEffect(() => {
    // Don't save if we haven't loaded total pages yet or if page hasn't changed
    if (totalPages === 0 || lastSavedPage.current === currentPage) return;

    // Debounce to 2 seconds
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      mutate({
        lastPage: currentPage,
        totalPages,
        zoomLevel,
      });
      lastSavedPage.current = currentPage;
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [comicId, currentPage, totalPages, zoomLevel, mutate]);
}
