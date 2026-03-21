/**
 * @file ComicVine API Client
 * Logic for searching and fetching metadata from ComicVine.
 */

import { EnrichmentData } from '@/types';

const COMICVINE_BASE = 'https://comicvine.gamespot.com/api';
const API_KEY = process.env.COMICVINE_API_KEY;

/**
 * Cleans a comic title for better search results.
 * Removes file extensions and common metadata suffixes.
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/\.(cbz|cbr|zip|rar)$/i, '')
    .replace(/\s*\(.*?\)/g, '') // Remove (2024), (Digital), etc.
    .replace(/\s*\[.*?\]/g, '') // Remove [v1], [Group]
    .trim();
}

/**
 * Searches ComicVine for an issue matching the given title.
 */
export async function searchComicIssue(title: string): Promise<EnrichmentData | null> {
  if (!API_KEY) {
    throw new Error('COMICVINE_API_KEY is not configured');
  }

  const cleanedTitle = cleanTitle(title);
  
  const searchUrl = new URL(`${COMICVINE_BASE}/search/`);
  searchUrl.searchParams.set('api_key', API_KEY);
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('query', cleanedTitle);
  searchUrl.searchParams.set('resources', 'issue');
  searchUrl.searchParams.set('limit', '5'); // Fetch a few to find the best match
  searchUrl.searchParams.set('field_list', 'id,name,issue_number,cover_date,image,volume,description,deck,character_credits,publisher');

  const response = await fetch(searchUrl.toString(), {
    headers: { 'User-Agent': 'Comet Comic Reader/2.0' },
  });

  if (!response.ok) {
    throw new Error(`ComicVine API error: ${response.statusText}`);
  }

  const data = await response.json();
  const results = data?.results ?? [];

  if (results.length === 0) {
    return null;
  }

  // For now, we take the first result as the best match
  // In a real app, we might do more fuzzy matching or let the user choose
  const result = results[0];

  return {
    comicVineId: String(result.id),
    series: result.volume?.name ?? null,
    issue: result.issue_number ? parseInt(result.issue_number, 10) : null,
    year: result.cover_date ? new Date(result.cover_date).getFullYear() : null,
    description: result.deck || result.description || null,
    coverUrl: result.image?.original_url || result.image?.screen_large_url || null,
    characters: result.character_credits?.map((c: { name: string }) => c.name) ?? [],
    publishers: result.publisher?.name ? [result.publisher.name] : [],
  };
}
