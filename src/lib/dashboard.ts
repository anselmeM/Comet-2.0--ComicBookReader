import { LayoutGrid, Folder, Heart, History, Users } from 'lucide-react';
import React from 'react';

export interface NavItem {
  name: string;
  icon: React.ElementType;
  id: string;
}

export interface FavouriteHero {
  id: string;
  name: string;
  image?: string;
  count: number;
}

export interface TopRatedComic {
  id: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
}

export const navItems: NavItem[] = [
  { name: 'Dashboard', icon: LayoutGrid, id: 'dashboard' },
  { name: 'My collections', icon: Folder, id: 'collections' },
  { name: 'Reading history', icon: History, id: 'history' },
  { name: 'Favourites', icon: Heart, id: 'favourites' },
  { name: 'Friends', icon: Users, id: 'friends' },
];

const HERO_AVATAR_COLORS = [
  'bg-red-100 text-red-600',
  'bg-green-100 text-green-600',
  'bg-purple-100 text-purple-600',
  'bg-yellow-100 text-yellow-600',
  'bg-blue-100 text-blue-600',
  'bg-sky-100 text-sky-600',
];

export function heroAvatarClass(name: string): string {
  const sum = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return HERO_AVATAR_COLORS[sum % HERO_AVATAR_COLORS.length];
}

/**
 * Derives the "Favourite Heroes" section from the user's actual library.
 * Prefers favorite comics; falls back to the whole library. Heroes are the
 * user's most-read series/authors, so the dashboard never renders hardcoded
 * placeholder characters in production.
 */
export function buildFavouriteHeroes(
  comics: { id: string; author?: string | null; isFavorite?: boolean; coverUrl?: string | null }[],
  limit = 8,
): FavouriteHero[] {
  const favorite = comics.filter((c) => c.isFavorite);
  const source = favorite.length > 0 ? favorite : comics;

  const byAuthor = new Map<string, { count: number; coverUrl?: string | null }>();
  source.forEach((comic) => {
    const name = comic.author?.trim();
    if (!name) return;
    const entry = byAuthor.get(name) ?? { count: 0, coverUrl: null };
    entry.count += 1;
    if (!entry.coverUrl && comic.coverUrl) entry.coverUrl = comic.coverUrl;
    byAuthor.set(name, entry);
  });

  return Array.from(byAuthor.entries())
    .map(([name, entry]) => ({
      id: `hero-${name}`,
      name,
      image: entry.coverUrl || undefined,
      count: entry.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
