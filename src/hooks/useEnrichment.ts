import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EnrichmentData } from '@/types';

/**
 * Hook to trigger metadata enrichment for a comic from ComicVine.
 */
export function useEnrichment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comicId: string) => {
      const res = await fetch(`/api/comics/${comicId}/enrich`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to enrich comic');
      }
      
      return res.json() as Promise<EnrichmentData>;
    },
    onSuccess: (_, comicId) => {
      // Invalidate library and specific comic queries to show new metadata
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['comic', comicId] });
    },
  });
}
