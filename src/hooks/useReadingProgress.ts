'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useReaderStore } from '@/stores/readerStore';
import { UpdateProgressPayload } from '@/types';
import { queueSyncTask } from '@/lib/sync';
import { useAuthCallback } from './useAuthCallback';
import { logger } from '@/lib/logger';
import { useNotification } from '@/components/atoms/Toast';

interface UseReadingProgressOptions {
  comicId: string | null;
}

/**
 * Hook to automatically track and sync reading progress to the server.
 * Includes offline sync queueing support and active reading time tracking.
 */
export function useReadingProgress({ comicId }: UseReadingProgressOptions) {
  const currentPage = useReaderStore((state) => state.currentPage);
  const totalPages = useReaderStore((state) => state.totalPages);
  const zoomLevel = useReaderStore((state) => state.zoomLevel);
  const lastSavedPage = useRef<number>(-1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Time tracking state
  const [secondsSpent, setSecondsSpent] = useState(0);
  const lastSyncTimeRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(true);

  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthCallback();
  const { triggerNotification } = useNotification();

  // Initialize sync time
  useEffect(() => {
    if (!lastSyncTimeRef.current) {
      lastSyncTimeRef.current = Date.now();
    }
  }, []);

  const { mutate } = useMutation({
    mutationFn: async (payload: UpdateProgressPayload) => {
      // If offline, queue for background sync (T-PWA-004)
      if (typeof window !== 'undefined' && !navigator.onLine) {
        logger.info('[Sync] Offline: Queueing progress update');
        await queueSyncTask(`/api/comics/${comicId}/progress`, 'PUT', payload);
        return { queued: true };
      }

      const res = await fetch(`/api/comics/${comicId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to update progress');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate related queries to keep UI in sync
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      if (comicId) {
        queryClient.invalidateQueries({ queryKey: ['comic', comicId] });
      }

      // Trigger Badge Toasts!
      if (data && data.newlyEarnedBadges && data.newlyEarnedBadges.length > 0) {
        data.newlyEarnedBadges.forEach((badge: any) => {
          triggerNotification(`🏆 Badge Unlocked: ${badge.name}!`, 'success', undefined, 5000);
        });
      }

      // Reset local time tracker after successful sync
      setSecondsSpent(0);
      lastSyncTimeRef.current = Date.now();
    },
  });

  // 1. Keep track of latest values for reliable unmount sync
  const latestValues = useRef({ currentPage, totalPages, zoomLevel, secondsSpent, comicId });
  useEffect(() => {
    latestValues.current = { currentPage, totalPages, zoomLevel, secondsSpent, comicId };
  }, [currentPage, totalPages, zoomLevel, secondsSpent, comicId]);

  // 2. Active Reading Timer
  useEffect(() => {
    if (!comicId) return;

    const interval = setInterval(() => {
      if (isActiveRef.current && document.visibilityState === 'visible') {
        setSecondsSpent((s) => s + 1);
      }
    }, 1000);

    const handleVisibilityChange = () => {
      isActiveRef.current = document.visibilityState === 'visible';
    };

    const handleBlur = () => {
      isActiveRef.current = false;
    };
    const handleFocus = () => {
      isActiveRef.current = true;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [comicId]);

  // 3. Initial sync to guarantee it shows up in "Continue Reading" immediately
  useEffect(() => {
    if (comicId && totalPages > 0 && lastSavedPage.current === -1) {
      logger.info(`[Sync] Initial load sync for comic ${comicId}`);
      mutate({
        lastPage: currentPage,
        totalPages,
        zoomLevel,
        timeDelta: 0,
      });
      lastSavedPage.current = currentPage;
    }
  }, [comicId, totalPages, currentPage, zoomLevel, mutate]);

  // 4. Automatically sync progress with a 2-second debounce during active reading
  useEffect(() => {
    const pageChanged = currentPage !== lastSavedPage.current;
    const significantTimePassed = secondsSpent >= 30;

    if (!comicId || totalPages === 0 || (!pageChanged && !significantTimePassed)) {
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      mutate({
        lastPage: currentPage,
        totalPages,
        zoomLevel,
        timeDelta: secondsSpent,
      });
      lastSavedPage.current = currentPage;
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [comicId, currentPage, totalPages, zoomLevel, secondsSpent, mutate]);

  // 5. Reliable Unmount Sync (Save progress immediately when user closes the comic)
  useEffect(() => {
    return () => {
      const {
        comicId: cId,
        currentPage: p,
        totalPages: t,
        zoomLevel: z,
        secondsSpent: s,
      } = latestValues.current;

      // If we spent time reading or changed page since last save, flush to server
      if (cId && t > 0 && (s > 0 || p !== lastSavedPage.current)) {
        logger.info(`[Sync] Unmount flush for comic ${cId} (timeDelta: ${s}s)`);
        const payload = { lastPage: p, totalPages: t, zoomLevel: z, timeDelta: s };

        // Use keepalive fetch to ensure request fires even as page unloads
        fetch(`/api/comics/${cId}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch((err) => {
          logger.error('[Sync] Unmount flush failed', {}, err instanceof Error ? err : undefined);
        });
      }
    };
  }, []);
}
