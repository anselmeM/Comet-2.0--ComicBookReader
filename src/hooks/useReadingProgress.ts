'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReaderStore } from '@/stores/readerStore';
import { UpdateProgressPayload } from '@/types';
import { queueSyncTask } from '@/lib/sync';

interface UseReadingProgressOptions {
  comicId: string | null;
}

/**
 * Hook to automatically track and sync reading progress to the server.
 * Includes offline sync queueing support.
 */
export function useReadingProgress({ comicId }: UseReadingProgressOptions) {
  const currentPage = useReaderStore((state) => state.currentPage);
  const totalPages = useReaderStore((state) => state.totalPages);
  const zoomLevel = useReaderStore((state) => state.zoomLevel);
  const lastSavedPage = useRef<number>(-1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: async (payload: UpdateProgressPayload) => {
      // If offline, queue for background sync (T-PWA-004)
      if (typeof window !== 'undefined' && !navigator.onLine) {
        console.log('[Sync] Offline: Queueing progress update');
        await queueSyncTask(`/api/comics/${comicId}/progress`, 'PUT', payload);
        return { queued: true };
      }

      const res = await fetch(`/api/comics/${comicId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update progress');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate related queries to keep UI in sync
      queryClient.invalidateQueries({ queryKey: ['library'] });
      if (comicId) {
        queryClient.invalidateQueries({ queryKey: ['comic', comicId] });
      }
    },
  });

  // Automatically sync progress with a 2-second debounce
  useEffect(() => {
    if (!comicId || currentPage === lastSavedPage.current || totalPages === 0) {
      return;
    }

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
