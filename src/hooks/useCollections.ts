import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardComic } from '@/components/molecules/DashboardComicCard';
import { useAuthCallback } from './useAuthCallback';

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
  comics?: DashboardComic[];
}

export function useCollections() {
  const queryClient = useQueryClient();
  const { handleAuthError } = useAuthCallback();

  // Get all collections
  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await fetch('/api/collections');
      if (!res.ok) {
        await handleAuthError(res);
        throw new Error('Failed to fetch collections');
      }
      const data = await res.json();
      return data.collections as Collection[];
    },
  });

  // Get single collection with comics
  const useCollection = (id: string | null) => useQuery({
    queryKey: ['collections', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) {
        await handleAuthError(res);
        throw new Error('Failed to fetch collection');
      }
      const data = await res.json();
      return data.collection as Collection;
    },
    enabled: !!id,
  });

  // Create collection
  const createCollection = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        
        const error = await res.json();
        throw new Error(error.error || 'Failed to create collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  // Update collection
  const updateCollection = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name?: string; description?: string }) => {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to update collection');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', variables.id] });
    },
  });

  // Delete collection
  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to delete collection');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  // Add item to collection
  const addItem = useMutation({
    mutationFn: async ({ collectionId, comicId }: { collectionId: string; comicId: string }) => {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicId }),
      });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to add item');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', variables.collectionId] });
    },
  });

  // Remove item from collection
  const removeItem = useMutation({
    mutationFn: async ({ collectionId, comicId }: { collectionId: string; comicId: string }) => {
      const res = await fetch(`/api/collections/${collectionId}/items?comicId=${comicId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const wasAuthError = await handleAuthError(res);
        if (wasAuthError) throw new Error('Unauthorized');
        throw new Error('Failed to remove item');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collections', variables.collectionId] });
    },
  });

  return {
    collections: collectionsQuery.data ?? [],
    isLoading: collectionsQuery.isLoading,
    error: collectionsQuery.error,
    useCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addItem,
    removeItem,
    refresh: () => queryClient.invalidateQueries({ queryKey: ['collections'] }),
  };
}
