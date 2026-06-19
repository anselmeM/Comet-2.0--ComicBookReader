import { LayoutGrid, Folder, Heart, History, Users, Trophy } from 'lucide-react';
import React from 'react';

export interface NavItem {
  name: string;
  icon: React.ElementType;
  id: string;
}

export interface FavouriteHero {
  id: number;
  name: string;
  color: string;
  image: string;
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
  { name: 'Favourites', icon: Heart, id: 'favourites' },
  { name: 'Reading history', icon: History, id: 'history' },
  { name: 'Friends', icon: Users, id: 'friends' },
];

export const favouriteHeroes = [
  {
    id: 1,
    name: 'Spider-Man',
    color: 'bg-red-500',
    image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&q=80',
    count: 42,
  },
  {
    id: 2,
    name: 'Hulk',
    color: 'bg-green-500',
    image: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400&q=80',
    count: 18,
  },
  {
    id: 3,
    name: 'Iron Man',
    color: 'bg-purple-600',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80',
    count: 31,
  },
  {
    id: 4,
    name: 'Wolverine',
    color: 'bg-yellow-400',
    image: 'https://images.unsplash.com/photo-1634896941598-b6b500a502a7?w=400&q=80',
    count: 25,
  },
  {
    id: 5,
    name: 'Captain America',
    color: 'bg-blue-700',
    image: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&q=80',
    count: 12,
  },
  {
    id: 6,
    name: 'Thor',
    color: 'bg-sky-400',
    image: 'https://images.unsplash.com/photo-1590502160462-079717909307?w=400&q=80',
    count: 15,
  },
  {
    id: 7,
    name: 'Black Widow',
    color: 'bg-gray-900',
    image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&q=80',
    count: 9,
  },
  {
    id: 8,
    name: 'Black Panther',
    color: 'bg-neutral-800',
    image: 'https://images.unsplash.com/photo-1620336655055-088d06e7660c?w=400&q=80',
    count: 14,
  },
];

export const topRatedComics = [
  {
    id: 'tr1',
    title: 'the Amazing Spider-Man Vol. 1',
    author: 'Nick Spencer',
    coverUrl: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&q=80',
  },
  {
    id: 'tr2',
    title: 'Batman: Year One',
    author: 'Frank Miller',
    coverUrl: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=400&q=80',
  },
  {
    id: 'tr3',
    title: 'The Sandman',
    author: 'Neil Gaiman',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
  },
  {
    id: 'tr4',
    title: 'Watchmen',
    author: 'Alan Moore',
    coverUrl: 'https://images.unsplash.com/photo-1611604548018-d56bbd85d681?w=400&q=80',
  },
  {
    id: 'tr5',
    title: 'Spawn',
    author: 'Todd McFarlane',
    coverUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400&q=80',
  },
  {
    id: 'tr6',
    title: 'X-Men: God Loves, Man Kills',
    author: 'Chris Claremont',
    coverUrl: 'https://images.unsplash.com/photo-1620336655055-088d06e7660c?w=400&q=80',
  },
];
