import { useQuery } from '@tanstack/react-query';
import { useAuthCallback } from './useAuthCallback';

export interface FeedActivity {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  comicId: string;
  comicTitle: string;
  comicCover: string | null;
  series: string | null;
  issue: number | null;
  type: 'FINISHED' | 'READING';
  timestamp: string;
}

export function useFeed() {
  const { handleAuthError } = useAuthCallback();
  
  return useQuery({
    queryKey: ['global-feed'],
    queryFn: async () => {
      const res = await fetch('/api/feed');
      if (!res.ok) {
        await handleAuthError(res);
        throw new Error('Failed to fetch feed');
      }
      const data = await res.json();
      return data.activities as FeedActivity[];
    },
    // Refresh the feed every 2 minutes
    refetchInterval: 120000,
  });
}
