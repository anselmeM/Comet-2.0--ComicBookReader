import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthCallback } from './useAuthCallback';

export interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface ComicComment {
  id: string;
  comicId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: CommentUser;
}

export interface ClubActiveReader {
  userId: string;
  userName: string;
  userImage: string | null;
  lastPage: number;
  totalPages: number;
  percent: number;
}

export interface ReadingClub {
  key: string;
  title: string;
  coverUrl: string | null;
  series: string | null;
  issue: number | null;
  comicVineId: string | null;
  userProgress: { lastPage: number; totalPages: number; percent: number } | null;
  userComicId: string | null;
  activeReaders: ClubActiveReader[];
}

export function useReactToActivity() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async ({
      activityId,
      reactionType,
    }: {
      activityId: string;
      reactionType: 'FIRE' | 'HEART' | 'LIKE' | 'TROPHY';
    }) => {
      const res = await fetch('/api/feed/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId, reactionType }),
      });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to react to activity');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-feed'] });
    },
  });
}

export function useComicComments(comicId: string) {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthCallback();

  const commentsQuery = useQuery({
    queryKey: ['comic-comments', comicId],
    queryFn: async () => {
      const res = await fetch(`/api/comics/${comicId}/comments`);
      if (!res.ok) {
        await handleAuthError(res);
        throw new Error('Failed to fetch comments');
      }
      const data = await res.json();
      return data.comments as ComicComment[];
    },
    enabled: !!comicId,
    refetchInterval: 10000, // Poll for new comments every 10 seconds for a live experience
  });

  const postComment = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/comics/${comicId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to post comment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comic-comments', comicId] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    error: commentsQuery.error,
    postComment,
    refetch: commentsQuery.refetch,
  };
}

export function useReadingClubs() {
  const { handleAuthError } = useAuthCallback();

  return useQuery({
    queryKey: ['reading-clubs'],
    queryFn: async () => {
      const res = await fetch('/api/user/reading-clubs');
      if (!res.ok) {
        await handleAuthError(res);
        throw new Error('Failed to fetch reading clubs');
      }
      const data = await res.json();
      return data.clubs as ReadingClub[];
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}
