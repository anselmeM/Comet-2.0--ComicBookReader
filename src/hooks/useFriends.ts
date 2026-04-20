import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch('/api/friends');
      if (!res.ok) throw new Error('Failed to fetch friends');
      const data = await res.json();
      return data.friends as Friend[];
    },
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      const res = await fetch('/api/friends/requests');
      if (!res.ok) throw new Error('Failed to fetch friend requests');
      return await res.json() as { incoming: FriendRequest[], outgoing: FriendRequest[] };
    },
  });
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ['user-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search users');
      const data = await res.json();
      return data.users as SearchUser[];
    },
    enabled: query.length >= 2,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (receiverId: string) => {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId }),
      });
      if (!res.ok) {
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
  return useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string, action: 'ACCEPT' | 'DECLINE' }) => {
      const res = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
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

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      const res = await fetch(`/api/friends?friendId=${friendId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove friend');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['user-search'] });
    },
  });
}
