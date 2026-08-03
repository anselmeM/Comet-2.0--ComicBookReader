import { describe, it, expect } from 'vitest';
import { buildFavouriteHeroes, navItems, heroAvatarClass } from '../dashboard';

describe('buildFavouriteHeroes', () => {
  const baseComics = [
    { id: 'c1', author: 'Nick Spencer', isFavorite: true, coverUrl: 'cover-1' },
    { id: 'c2', author: 'Nick Spencer', isFavorite: true, coverUrl: null },
    { id: 'c3', author: 'Frank Miller', isFavorite: true, coverUrl: 'cover-2' },
    { id: 'c4', author: 'Frank Miller', isFavorite: true, coverUrl: null },
    { id: 'c5', author: 'Frank Miller', isFavorite: true, coverUrl: null },
  ];

  it('groups favorite comics by author and sorts by count descending', () => {
    const heroes = buildFavouriteHeroes(baseComics as any);

    expect(heroes[0]).toMatchObject({ name: 'Frank Miller', count: 3 });
    expect(heroes[1]).toMatchObject({ name: 'Nick Spencer', count: 2 });
  });

  it('uses the first available cover as the hero image', () => {
    const heroes = buildFavouriteHeroes(baseComics as any);
    expect(heroes.find((h) => h.name === 'Nick Spencer')).toMatchObject({
      image: 'cover-1',
    });
  });

  it('falls back to the whole library when nothing is favorited', () => {
    const comics = [
      { id: 'a', author: 'Alan Moore', isFavorite: false },
      { id: 'b', author: 'Alan Moore', isFavorite: false },
      { id: 'c', author: 'Grant Morrison', isFavorite: false },
    ];
    const heroes = buildFavouriteHeroes(comics as any);

    expect(heroes[0]).toMatchObject({ name: 'Alan Moore', count: 2 });
    expect(heroes[1]).toMatchObject({ name: 'Grant Morrison', count: 1 });
  });

  it('skips comics without an author', () => {
    const heroes = buildFavouriteHeroes([
      { id: 'a', author: null, isFavorite: false },
      { id: 'b', author: '   ', isFavorite: false },
    ] as any);
    expect(heroes).toEqual([]);
  });

  it('respects the limit', () => {
    const comics = Array.from({ length: 12 }, (_, i) => ({
      id: `c${i}`,
      author: `Author ${i}`,
      isFavorite: true,
    }));
    expect(buildFavouriteHeroes(comics as any, 3)).toHaveLength(3);
  });

  it('produces stable unique ids', () => {
    const heroes = buildFavouriteHeroes(baseComics as any);
    expect(new Set(heroes.map((h) => h.id)).size).toBe(heroes.length);
  });
});

describe('navItems', () => {
  it('contains the five primary dashboard destinations', () => {
    expect(navItems.map((i) => i.id)).toEqual([
      'dashboard',
      'collections',
      'history',
      'favourites',
      'friends',
    ]);
  });
});

describe('heroAvatarClass', () => {
  it('returns a valid tailwind avatar color for any name', () => {
    expect(heroAvatarClass('Spider-Man')).toMatch(/^bg-\S+ text-\S+$/);
    expect(heroAvatarClass('')).toMatch(/^bg-\S+ text-\S+$/);
  });
});
