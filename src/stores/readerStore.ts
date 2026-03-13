import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReadingMode = 'single-vertical' | 'dual-spread' | 'manga-rtl' | 'guided-view';

interface ReaderState {
  // Settings
  readingMode: ReadingMode;
  zoomLevel: number;
  brightness: number;

  // Current Session
  currentComicId: string | null;
  currentPage: number;
  totalPages: number;
  isMenuVisible: boolean;

  // Actions
  setReadingMode: (mode: ReadingMode) => void;
  setZoomLevel: (level: number) => void;
  setBrightness: (level: number) => void;
  openComic: (comicId: string, totalPages: number, startPage?: number) => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  toggleMenu: () => void;
  closeComic: () => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      // Default Settings
      readingMode: 'single-vertical',
      zoomLevel: 1.0,
      brightness: 1.0,

      // Initial Session State
      currentComicId: null,
      currentPage: 0,
      totalPages: 0,
      isMenuVisible: false,

      // Actions
      setReadingMode: (mode) => set({ readingMode: mode }),
      setZoomLevel: (level) => set({ zoomLevel: Math.max(0.5, Math.min(level, 5.0)) }),
      setBrightness: (level) => set({ brightness: Math.max(0.1, Math.min(level, 1.5)) }),
      
      openComic: (comicId, totalPages, startPage = 0) => 
        set({ 
          currentComicId: comicId, 
          totalPages, 
          currentPage: startPage,
          isMenuVisible: false 
        }),
        
      setPage: (page) => {
        const { totalPages } = get();
        if (page >= 0 && page < totalPages) {
          set({ currentPage: page });
        }
      },
      
      nextPage: () => {
        const { currentPage, totalPages } = get();
        if (currentPage < totalPages - 1) {
          set({ currentPage: currentPage + 1 });
        }
      },
      
      prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 0) {
          set({ currentPage: currentPage - 1 });
        }
      },

      toggleMenu: () => set((state) => ({ isMenuVisible: !state.isMenuVisible })),
      
      closeComic: () => set({ currentComicId: null, currentPage: 0, totalPages: 0 }),
    }),
    {
      name: 'comet-reader-storage',
      // Only persist specific settings, not the session state itself
      partialize: (state) => ({
        readingMode: state.readingMode,
        zoomLevel: state.zoomLevel,
        brightness: state.brightness,
      }),
    }
  )
);
