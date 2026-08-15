/**
 * @file Global Search utility using Fuse.js
 */
import Fuse from 'fuse.js';
import { ComicDTO } from '@/types';

export interface SearchResult<TComic = ComicDTO> {
  comics: TComic[];
  collections: { id: string; name: string; items?: unknown[] }[];
  series: string[];
}

/**
 * Performs a global search across comics, collections, and series.
 * 
 * @param query The search string
 * @param data The dataset to search (comics, collections)
 */
export function globalSearch<TComic extends { title: string; series?: string }>(
  query: string,
  data: { comics: TComic[]; collections: { id: string; name: string; items?: unknown[] }[] }
): SearchResult<TComic> {
  if (!query) {
    return { comics: [], collections: [], series: [] };
  }

  // 1. Search Comics
  const comicFuse = new Fuse(data.comics, {
    keys: ['title', 'series', 'tags'],
    threshold: 0.4,
    includeMatches: true,
  });
  const comicResults = comicFuse.search(query).map(r => r.item);

  // 2. Search Collections
  const collectionFuse = new Fuse(data.collections, {
    keys: ['name'],
    threshold: 0.3,
  });
  const collectionResults = collectionFuse.search(query).map(r => r.item);

  // 3. Extract unique series from results or overall data
  const seriesSet = new Set<string>();
  data.comics.forEach(c => {
    if (c.series) seriesSet.add(c.series);
  });
  const seriesArray = Array.from(seriesSet).map(s => ({ name: s }));
  const seriesFuse = new Fuse(seriesArray, {
    keys: ['name'],
    threshold: 0.3,
  });
  const seriesResults = seriesFuse.search(query).map(r => r.item.name);

  return {
    comics: comicResults,
    collections: collectionResults,
    series: seriesResults,
  };
}
