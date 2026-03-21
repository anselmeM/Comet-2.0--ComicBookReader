/**
 * @file useEnrichment Hook
 * Triggers the ComicVine enrichment API and handles loading/error states.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EnrichmentData } from '@/types';

export function useEnrichment(comicId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<EnrichmentData> => {
      const response = await fetch(`/api/comics/${comicId}/enrich`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enrich comic');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the library to show updated metadata/covers
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['comic', comicId] });
    },
  });
}
