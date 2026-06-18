import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthCallback } from './useAuthCallback';

export interface ReadingSessionLog {
  id: string;
  userId: string;
  comicId: string;
  pagesRead: number;
  durationSeconds: number;
  createdAt: string;
  comic: {
    title: string;
    coverUrl: string | null;
    series: string | null;
  };
}

export interface ReadingHistoryResponse {
  sessions: ReadingSessionLog[];
  heatmap: { [dateStr: string]: number };
  weekly: { weekLabel: string; count: number }[];
}

export function useReadingHistory() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthCallback();

  // 1. Fetch history
  const historyQuery = useQuery<ReadingHistoryResponse>({
    queryKey: ['readingHistory'],
    queryFn: async () => {
      const res = await fetch('/api/user/reading-sessions');
      if (!res.ok) {
        await handleAuthError(res);
        throw new Error('Failed to fetch reading history');
      }
      return res.json();
    },
    staleTime: 60 * 1000, // 1 minute stale time
  });

  // 2. Delete single session
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await fetch(`/api/user/reading-sessions?id=${sessionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to delete session log');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });

  // 3. Clear all history
  const clearHistory = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/reading-sessions', {
        method: 'DELETE',
      });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to clear reading history');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  return {
    data: historyQuery.data,
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    deleteSession,
    clearHistory,
    refetch: historyQuery.refetch,
  };
}
