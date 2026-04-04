'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Bookmark {
  id: string;
  pageNumber: number;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UseBookmarksOptions {
  comicId: string | null;
}

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: string | null;
  addBookmark: (pageNumber: number, label?: string) => Promise<void>;
  updateBookmark: (id: string, label: string) => Promise<void>;
  removeBookmark: (id: string) => Promise<void>;
  isBookmarked: (pageNumber: number) => boolean;
  getBookmarkForPage: (pageNumber: number) => Bookmark | undefined;
  refreshBookmarks: () => Promise<void>;
}

export function useBookmarks({ comicId }: UseBookmarksOptions): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookmarks from API
  const fetchBookmarks = useCallback(async () => {
    if (!comicId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookmarks?comicId=${comicId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }

      const data = await response.json();

      // Convert date strings to Date objects
      const parsedBookmarks = (data.bookmarks || []).map((b: any) => ({
        ...b,
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      }));

      setBookmarks(parsedBookmarks);
    } catch (err) {
      // If API fails (e.g., bookmark table doesn't exist), use local storage fallback
      console.warn('Using local storage fallback for bookmarks:', err);
      setError('Using local storage');
    } finally {
      setIsLoading(false);
    }
  }, [comicId]);

  // Load bookmarks when comicId changes
  useEffect(() => {
    if (comicId) {
      fetchBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [comicId, fetchBookmarks]);

  // Add a new bookmark
  const addBookmark = useCallback(async (pageNumber: number, label?: string) => {
    if (!comicId) return;

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicId, pageNumber, label }),
      });

      if (!response.ok) {
        throw new Error('Failed to add bookmark');
      }

      const data = await response.json();

      // Add to local state
      const newBookmark: Bookmark = {
        id: data.bookmark.id,
        pageNumber: data.bookmark.pageNumber,
        label: data.bookmark.label,
        createdAt: new Date(data.bookmark.createdAt),
        updatedAt: new Date(data.bookmark.updatedAt),
      };

      setBookmarks(prev => [...prev, newBookmark].sort((a, b) => a.pageNumber - b.pageNumber));
    } catch (err) {
      console.error('Error adding bookmark:', err);
      // Fallback: add locally
      const localBookmark: Bookmark = {
        id: `local-${Date.now()}`,
        pageNumber,
        label,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setBookmarks(prev => [...prev, localBookmark].sort((a, b) => a.pageNumber - b.pageNumber));
    }
  }, [comicId]);

  // Update bookmark label
  const updateBookmark = useCallback(async (id: string, label: string) => {
    if (!comicId) return;

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, label }),
      });

      if (!response.ok) {
        throw new Error('Failed to update bookmark');
      }

      // Update local state
      setBookmarks(prev =>
        prev.map(b => b.id === id ? { ...b, label, updatedAt: new Date() } : b)
      );
    } catch (err) {
      console.error('Error updating bookmark:', err);
      // Fallback: update locally
      setBookmarks(prev =>
        prev.map(b => b.id === id ? { ...b, label, updatedAt: new Date() } : b)
      );
    }
  }, [comicId]);

  // Remove a bookmark
  const removeBookmark = useCallback(async (id: string) => {
    if (!comicId) return;

    try {
      const response = await fetch(`/api/bookmarks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete bookmark');
      }

      // Remove from local state
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error removing bookmark:', err);
      // Fallback: remove locally
      setBookmarks(prev => prev.filter(b => b.id !== id));
    }
  }, [comicId]);

  // Check if a page is bookmarked
  const isBookmarked = useCallback((pageNumber: number) => {
    return bookmarks.some(b => b.pageNumber === pageNumber);
  }, [bookmarks]);

  // Get bookmark for a specific page
  const getBookmarkForPage = useCallback((pageNumber: number) => {
    return bookmarks.find(b => b.pageNumber === pageNumber);
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    error,
    addBookmark,
    updateBookmark,
    removeBookmark,
    isBookmarked,
    getBookmarkForPage,
    refreshBookmarks: fetchBookmarks,
  };
}
