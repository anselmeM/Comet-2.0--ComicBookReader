'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

export interface FavoritesContextType {
  favorites: string[];
  isFavorite: (comicId: string) => boolean;
  toggleFavorite: (comicId: string) => void;
  addFavorite: (comicId: string) => void;
  removeFavorite: (comicId: string) => void;
  clearFavorites: () => void;
}

const FAVORITES_STORAGE_KEY = 'comic-favorites';

// Cached empty array for SSR to prevent infinite loop
const EMPTY_FAVORITES: string[] = [];

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: React.ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps): React.ReactElement {
  // Use state for favorites - initialized from localStorage on client
  const [favorites, setFavorites] = useState<string[]>(EMPTY_FAVORITES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load favorites from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load favorites from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Failed to save favorites to localStorage:', error);
      }
    }
  }, [favorites, isHydrated]);

  // Check if a comic is favorited
  const isFavorite = useCallback((comicId: string): boolean => {
    return favorites.includes(comicId);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback((comicId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(comicId)
        ? prev.filter(id => id !== comicId)
        : [...prev, comicId];
      return newFavorites;
    });
  }, []);

  // Add a favorite
  const addFavorite = useCallback((comicId: string) => {
    setFavorites(prev => {
      if (!prev.includes(comicId)) {
        return [...prev, comicId];
      }
      return prev;
    });
  }, []);

  // Remove a favorite
  const removeFavorite = useCallback((comicId: string) => {
    setFavorites(prev => prev.filter(id => id !== comicId));
  }, []);

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const value: FavoritesContextType = {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// Custom hook to use the favorites context
export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);

  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }

  return context;
}