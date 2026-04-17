'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favorites: string[];
  isFavorite: (comicId: string) => boolean;
  toggleFavorite: (comicId: string) => void;
  addFavorite: (comicId: string) => void;
  removeFavorite: (comicId: string) => void;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      isFavorite: (comicId: string) => {
        return get().favorites.includes(comicId);
      },

      toggleFavorite: (comicId: string) => {
        set((state) => {
          const isFav = state.favorites.includes(comicId);
          const newFavorites = isFav
            ? state.favorites.filter((id) => id !== comicId)
            : [...state.favorites, comicId];
          return { favorites: newFavorites };
        });
      },

      addFavorite: (comicId: string) => {
        set((state) => {
          if (!state.favorites.includes(comicId)) {
            return { favorites: [...state.favorites, comicId] };
          }
          return state;
        });
      },

      removeFavorite: (comicId: string) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== comicId),
        }));
      },

      clearFavorites: () => {
        set({ favorites: [] });
      },
    }),
    {
      name: 'comet-favorites-storage',
    }
  )
);

/**
 * Backward compatibility hook to match the previous FavoritesContext API
 * while using the new Zustand store.
 */
export function useFavorites() {
  const { 
    favorites, 
    isFavorite, 
    toggleFavorite, 
    addFavorite, 
    removeFavorite, 
    clearFavorites 
  } = useFavoritesStore();

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  };
}
