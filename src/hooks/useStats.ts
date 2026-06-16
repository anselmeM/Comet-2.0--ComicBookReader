import { useQuery } from '@tanstack/react-query';
import { useAuthCallback } from './useAuthCallback';

export interface UserStats {
  streak: number;
  pagesFlipped: number;
  timeSpentSeconds: number;
  comicsFinished: number;
  lastReadDate: Date | null;
}

export function useStats() {
  const { handleAuthError } = useAuthCallback();

  return useQuery<UserStats>({
    queryKey: ['userStats'],
    queryFn: async () => {
      const res = await fetch('/api/user/stats');
      if (!res.ok) {
        await handleAuthError(res);
        throw new Error('Failed to fetch user stats');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
