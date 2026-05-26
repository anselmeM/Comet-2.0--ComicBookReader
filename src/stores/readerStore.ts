import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Panel } from '@/types';

export type ReaderMode = 'single-page' | 'single-vertical' | 'dual-spread' | 'manga-rtl' | 'guided-view';

export interface ComicSettings {
  mode: ReaderMode;
  zoomLevel: number;
  brightness: number;
  isGuidedViewEnabled: boolean;
}

interface ReaderState {
  // Settings
  mode: ReaderMode;
  zoomLevel: number;
  brightness: number;
  isGuidedViewEnabled: boolean;
  guidedStep: number; // Index into pagePanels[currentPage]
  isFullscreen: boolean;
  comicSettings: Record<string, ComicSettings>;

  // Current Session
  currentComicId: string | null;
  currentPage: number;
  totalPages: number;
  isMenuVisible: boolean;
  pagePanels: Record<number, Panel[]>; // Panels detected per page

  // Actions
  setMode: (mode: ReaderMode) => void;
  setZoomLevel: (level: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setBrightness: (level: number) => void;
  toggleGuidedView: () => void;
  setGuidedStep: (step: number) => void;
  setPagePanels: (pageIndex: number, panels: Panel[]) => void;
  toggleFullscreen: () => void;
  
  openComic: (comicId: string, totalPages: number, initialPage?: number, initialMode?: ReaderMode) => void;
  setPage: (pageIndex: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  toggleMenu: () => void;
  closeComic: () => void;
}

const updateSettings = (state: ReaderState, updates: Partial<ComicSettings>) => {
  if (!state.currentComicId) return {};
  const current = state.comicSettings[state.currentComicId] || {
    mode: state.mode,
    zoomLevel: state.zoomLevel,
    brightness: state.brightness,
    isGuidedViewEnabled: state.isGuidedViewEnabled,
  };
  return {
    comicSettings: {
      ...state.comicSettings,
      [state.currentComicId]: {
        ...current,
        ...updates,
      }
    }
  };
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      // Default Settings
      mode: 'single-page',
      zoomLevel: 1.0,
      brightness: 1.0,
      isGuidedViewEnabled: false,
      guidedStep: 0,
      isFullscreen: false,
      comicSettings: {},

      // Initial Session State
      currentComicId: null,
      currentPage: 0,
      totalPages: 0,
      isMenuVisible: false,
      pagePanels: {},

      // Actions implementation
      setMode: (mode) => set((state) => ({
        mode,
        ...updateSettings(state, { mode }),
      })),
      setZoomLevel: (zoomLevel) => set((state) => {
        const nextZoom = Math.max(0.5, Math.min(5, zoomLevel));
        return {
          zoomLevel: nextZoom,
          ...updateSettings(state, { zoomLevel: nextZoom }),
        };
      }),
      zoomIn: () => set((state) => {
        const nextZoom = Math.min(5, state.zoomLevel + 0.25);
        return {
          zoomLevel: nextZoom,
          ...updateSettings(state, { zoomLevel: nextZoom }),
        };
      }),
      zoomOut: () => set((state) => {
        const nextZoom = Math.max(0.5, state.zoomLevel - 0.25);
        return {
          zoomLevel: nextZoom,
          ...updateSettings(state, { zoomLevel: nextZoom }),
        };
      }),
      resetZoom: () => set((state) => ({
        zoomLevel: 1.0,
        ...updateSettings(state, { zoomLevel: 1.0 }),
      })),
      setBrightness: (brightness) => set((state) => {
        const nextBrightness = Math.max(0.1, Math.min(1.5, brightness));
        return {
          brightness: nextBrightness,
          ...updateSettings(state, { brightness: nextBrightness }),
        };
      }),
      toggleGuidedView: () => set((state) => {
        const nextVal = !state.isGuidedViewEnabled;
        return {
          isGuidedViewEnabled: nextVal,
          guidedStep: 0,
          ...updateSettings(state, { isGuidedViewEnabled: nextVal }),
        };
      }),
      setGuidedStep: (guidedStep) => set({ guidedStep }),
      setPagePanels: (pageIndex, panels) => set((state) => ({
        pagePanels: { ...state.pagePanels, [pageIndex]: panels }
      })),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      
      openComic: (comicId, totalPages, initialPage = 0, initialMode) => {
        const existing = get().comicSettings[comicId] || {
          mode: initialMode || get().mode,
          zoomLevel: 1.0,
          brightness: 1.0,
          isGuidedViewEnabled: false,
        };
        set((state) => ({
          currentComicId: comicId,
          totalPages,
          currentPage: initialPage,
          mode: existing.mode,
          zoomLevel: existing.zoomLevel,
          brightness: existing.brightness,
          isGuidedViewEnabled: existing.isGuidedViewEnabled,
          guidedStep: 0,
          isMenuVisible: false,
          pagePanels: {},
          comicSettings: {
            ...state.comicSettings,
            [comicId]: existing,
          }
        }));
      },
      
      setPage: (pageIndex) => {
        const { totalPages } = get();
        if (pageIndex >= 0 && pageIndex < totalPages) {
          set({ currentPage: pageIndex, guidedStep: 0 });
        }
      },
      
      nextPage: () => {
        const { currentPage, totalPages, mode, isGuidedViewEnabled, guidedStep, pagePanels } = get();
        
        const currentPanels = pagePanels[currentPage] || [];
        const hasNextPanel = isGuidedViewEnabled && guidedStep < currentPanels.length - 1;
 
        if (hasNextPanel) {
          set({ guidedStep: guidedStep + 1 });
          return;
        }
 
        // Dual mode spread increment logic
        const isDual = mode === 'dual-spread' || mode === 'manga-rtl';
        let increment = 1;
        if (isDual && currentPage > 0) {
          increment = 2;
        }
        
        if (currentPage + increment < totalPages) {
          set({ currentPage: currentPage + increment, guidedStep: 0 });
        } else if (currentPage < totalPages - 1) {
          set({ currentPage: totalPages - 1, guidedStep: 0 });
        }
      },
      
      prevPage: () => {
        const { currentPage, mode, isGuidedViewEnabled, guidedStep, pagePanels } = get();
        
        if (isGuidedViewEnabled && guidedStep > 0) {
          set({ guidedStep: guidedStep - 1 });
          return;
        }
 
        // Dual mode spread decrement logic
        const isDual = mode === 'dual-spread' || mode === 'manga-rtl';
        let decrement = 1;
        if (isDual && currentPage > 2) {
          decrement = 2;
        }
        
        if (currentPage - decrement >= 0) {
          const prevPageIdx = currentPage - decrement;
          const prevPanels = pagePanels[prevPageIdx] || [];
          
          set({ 
            currentPage: prevPageIdx, 
            guidedStep: isGuidedViewEnabled ? Math.max(0, prevPanels.length - 1) : 0 
          });
        } else if (currentPage > 0) {
          set({ currentPage: 0, guidedStep: 0 });
        }
      },
      
      toggleMenu: () => set((state) => ({ isMenuVisible: !state.isMenuVisible })),
      
      closeComic: () => set({ 
        currentComicId: null, 
        currentPage: 0, 
        totalPages: 0, 
        isMenuVisible: false,
        pagePanels: {} 
      }),
    }),
    {
      name: 'comet-reader-storage',
      // Only persist persistent settings, not session state
      partialize: (state) => ({
        mode: state.mode,
        zoomLevel: state.zoomLevel,
        brightness: state.brightness,
        isGuidedViewEnabled: state.isGuidedViewEnabled,
        comicSettings: state.comicSettings,
      }),
    }
  )
);
