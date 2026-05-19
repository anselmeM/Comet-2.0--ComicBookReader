import { describe, it, expect } from 'vitest';
import { globalSearch } from '../search';
import { ComicDTO } from '@/types';

describe('globalSearch', () => {
  const mockComics: ComicDTO[] = [
    { id: '1', title: 'Spider-Man', series: 'Amazing Spider-Man', pageCount: 22, filehash: 'h1', addedAt: '2026-01-01', syncStatus: 'LOCAL', rating: 0, isFavorite: false } as any,
    { id: '2', title: 'Batman: Year One', series: 'Batman', pageCount: 30, filehash: 'h2', addedAt: '2026-01-01', syncStatus: 'LOCAL', rating: 0, isFavorite: false } as any,
    { id: '3', title: 'The Sandman', series: 'Sandman', pageCount: 25, filehash: 'h3', addedAt: '2026-01-01', syncStatus: 'LOCAL', rating: 0, isFavorite: false } as any,
  ];

  const mockCollections = [
    { id: 'c1', name: 'Marvel Favorites' },
    { id: 'c2', name: 'DC Classics' },
  ];

  const mockData = { comics: mockComics, collections: mockCollections };

  it('should return empty results if query is empty', () => {
    const results = globalSearch('', mockData);
    expect(results.comics).toHaveLength(0);
    expect(results.collections).toHaveLength(0);
    expect(results.series).toHaveLength(0);
  });

  it('should find comics by title', () => {
    const results = globalSearch('Spider', mockData);
    expect(results.comics).toHaveLength(1);
    expect(results.comics[0].title).toBe('Spider-Man');
  });

  it('should find comics by series', () => {
    const results = globalSearch('Batman', mockData);
    expect(results.comics).toHaveLength(1);
    expect(results.series).toContain('Batman');
  });

  it('should find collections by name', () => {
    const results = globalSearch('Marvel', mockData);
    expect(results.collections).toHaveLength(1);
    expect(results.collections[0].name).toBe('Marvel Favorites');
  });

  it('should handle fuzzy searching', () => {
    const results = globalSearch('Sndman', mockData);
    expect(results.comics[0].title).toBe('The Sandman');
  });

  it('should return unique series', () => {
    const results = globalSearch('Spider', mockData);
    // Even if it matches multiple, series list should be unique
    expect(new Set(results.series).size).toBe(results.series.length);
  });
});
