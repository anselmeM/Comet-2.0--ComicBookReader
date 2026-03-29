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

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: React.ReactNode;
}

// Helper to get initial favorites from localStorage
function getInitialFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load favorites from localStorage:', error);
  }
  return [];
}

export function FavoritesProvider({ children }: FavoritesProviderProps): React.ReactElement {
  const [favorites, setFavorites] = useState<string[]>(getInitialFavorites);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount (handles SSR case)
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
    setIsLoaded(true);
  }, []);

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Failed to save favorites to localStorage:', error);
      }
    }
  }, [favorites, isLoaded]);

  const isFavorite = useCallback((comicId: string): boolean => {
    return favorites.includes(comicId);
  }, [favorites]);

  const toggleFavorite = useCallback((comicId: string) => {
    setFavorites(prev => {
      if (prev.includes(comicId)) {
        return prev.filter(id => id !== comicId);
      }
      return [...prev, comicId];
    });
  }, []);

  const addFavorite = useCallback((comicId: string) => {
    setFavorites(prev => {
      if (prev.includes(comicId)) return prev;
      return [...prev, comicId];
    });
  }, []);

  const removeFavorite = useCallback((comicId: string) => {
    setFavorites(prev => prev.filter(id => id !== comicId));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        addFavorite,
        removeFavorite,
        clearFavorites
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}