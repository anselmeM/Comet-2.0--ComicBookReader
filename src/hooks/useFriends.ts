import { useMemo } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthCallback } from './useAuthCallback';

export interface Friend {
  id: string;

  friendId: string;

  name: string | null;

  image: string | null;

  email: string;

  createdAt: string;
}

export interface FriendRequest {
  id: string;

  senderId: string;

  receiverId: string;

  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';

  createdAt: string;

  sender?: {
    id: string;

    name: string | null;

    image: string | null;

    email: string;
  };

  receiver?: {
    id: string;

    name: string | null;

    image: string | null;

    email: string;
  };
}

export interface SearchUser {
  id: string;

  name: string | null;

  image: string | null;

  email: string;

  status: 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';

  requestId?: string;
}

export function useFriends() {
  const { handleAuthError } = useAuthCallback();

  return useQuery({
    queryKey: ['friends'],

    queryFn: async () => {
      const res = await fetch('/api/friends');

      if (!res.ok) {
        await handleAuthError(res);

        throw new Error('Failed to fetch friends');
      }

      const data = await res.json();

      return data.friends as Friend[];
    },
  });
}

export function useFriendRequests() {
  const { handleAuthError } = useAuthCallback();

  return useQuery({
    queryKey: ['friend-requests'],

    queryFn: async () => {
      const res = await fetch('/api/friends/requests');

      if (!res.ok) {
        await handleAuthError(res);

        throw new Error('Failed to fetch friend requests');
      }

      return (await res.json()) as { incoming: FriendRequest[]; outgoing: FriendRequest[] };
    },
  });
}

export function useUserSearch(query: string) {
  const { handleAuthError } = useAuthCallback();

  return useQuery({
    queryKey: ['user-search', query],

    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);

      if (!res.ok) {
        await handleAuthError(res);

        throw new Error('Failed to search users');
      }

      const data = await res.json();

      return data.users as SearchUser[];
    },

    enabled: query.length >= 2,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ receiverId }),
      });

      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);

        if (wasAuthError) throw new Error('Unauthorized');

        const error = await res.json();

        throw new Error(error.error || 'Failed to send friend request');
      }

      return await res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });

      queryClient.invalidateQueries({ queryKey: ['user-search'] });
    },
  });
}

export function useHandleFriendRequest() {
  const queryClient = useQueryClient();

  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async ({
      requestId,

      action,
    }: {
      requestId: string;

      action: 'ACCEPT' | 'DECLINE';
    }) => {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);

        if (wasAuthError) throw new Error('Unauthorized');

        const error = await res.json();

        throw new Error(error.error || 'Failed to handle friend request');
      }

      return await res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });

      queryClient.invalidateQueries({ queryKey: ['friends'] });

      queryClient.invalidateQueries({ queryKey: ['user-search'] });
    },
  });
}

export function useInviteFriend() {
  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch('/api/friends/invite', {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);

        if (wasAuthError) throw new Error('Unauthorized');

        const error = await res.json();

        throw new Error(error.error || 'Failed to send invitation');
      }

      return await res.json();
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async (friendId: string) => {
      const res = await fetch(`/api/friends?friendId=${friendId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);

        if (wasAuthError) throw new Error('Unauthorized');

        throw new Error('Failed to remove friend');
      }

      return await res.json();
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });

      queryClient.invalidateQueries({ queryKey: ['user-search'] });
    },
  });
}

export interface UserProfile {
  id: string;

  name: string | null;

  image: string | null;

  createdAt: string;

  isFriend: boolean;

  isSelf: boolean;

  stats: {
    libraryCount: number;

    completedCount: number;

    totalTimeSpent: number;
  };

  badges: { id: string; name: string; badgeId?: string; earnedAt?: string }[];

  recentActivity: {
    id: string;

    type: string;

    createdAt: string;

    comicId?: string;

    coverUrl?: string;

    title?: string;

    readStatus?: string;

    percent?: number;

    lastReadAt?: string;
  }[];
}

export function useUserProfile(userId: string | null) {
  const { handleAuthError } = useAuthCallback();

  return useQuery({
    queryKey: ['user-profile', userId],

    queryFn: async () => {
      if (!userId) return null;

      const res = await fetch(`/api/users/${userId}/profile`);

      if (!res.ok) {
        await handleAuthError(res);

        throw new Error('Failed to fetch user profile');
      }

      const data = await res.json();

      return data.profile as UserProfile;
    },

    enabled: !!userId,
  });
}

export interface DirectMessage {
  id: string;

  senderId: string;

  receiverId: string;

  message: string;

  isRead: boolean;

  createdAt: string;

  sender: {
    id: string;

    name: string | null;

    image: string | null;
  };
}

export interface DirectMessagesPage {
  messages: DirectMessage[];

  nextCursor: string | null;
}

/**

 * Live DM thread for the drawer: fetches the newest page (cursor-aware GET),

 * keeps polling at 10s ONLY while the tab is visible (no background waste —

 * was a 5s always-on poll), and refetches when the tab regains focus.

 * Messages are returned oldest-first for display.

 */

export function useDirectMessages(friendId: string | null) {
  const { handleAuthError } = useAuthCallback();

  const query = useQuery({
    queryKey: ['direct-messages', friendId],

    queryFn: async (): Promise<DirectMessagesPage> => {
      if (!friendId) return { messages: [], nextCursor: null };

      const res = await fetch(`/api/friends/${friendId}/messages?limit=50`);

      if (!res.ok) {
        await handleAuthError(res);

        throw new Error('Failed to fetch messages');
      }

      return (await res.json()) as DirectMessagesPage;
    },

    enabled: !!friendId,

    refetchInterval: 10_000,

    refetchIntervalInBackground: false,

    refetchOnWindowFocus: true,
  });

  const messages = useMemo(
    () => [...(query.data?.messages ?? [])].reverse(), // desc (wire) → asc (display)

    [query.data],
  );

  return {
    data: messages,

    isLoading: query.isLoading,

    nextCursor: query.data?.nextCursor ?? null,

    refetch: query.refetch,
  };
}

/** Loads one older page of DM history on demand (cursor pagination). */

export function useLoadOlderMessages(friendId: string | null) {
  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async (cursor: string): Promise<DirectMessagesPage> => {
      if (!friendId) return { messages: [], nextCursor: null };

      const res = await fetch(
        `/api/friends/${friendId}/messages?cursor=${encodeURIComponent(cursor)}&limit=50`,
      );

      if (!res.ok) {
        await handleAuthError(res);

        throw new Error('Failed to fetch older messages');
      }

      return (await res.json()) as DirectMessagesPage;
    },
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();

  const { handleAuthError } = useAuthCallback();

  return useMutation({
    mutationFn: async ({ friendId, message }: { friendId: string; message: string }) => {
      const res = await fetch(`/api/friends/${friendId}/messages`, {
        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);

        if (wasAuthError) throw new Error('Unauthorized');

        const error = await res.json();

        throw new Error(error.error || 'Failed to send message');
      }

      return await res.json();
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['direct-messages', variables.friendId] });
    },
  });
}
