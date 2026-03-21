import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Panel } from '@/types';

export type ReaderMode = 'single-vertical' | 'dual-spread' | 'manga-rtl' | 'guided-view';

interface ReaderState {
  // Settings
  mode: ReaderMode;
  zoomLevel: number;
  brightness: number;
  isGuidedViewEnabled: boolean;
  guidedStep: number; // Index into pagePanels[currentPage]

  // Current Session
  currentComicId: string | null;
  currentPage: number;
  totalPages: number;
  isMenuVisible: boolean;
  pagePanels: Record<number, Panel[]>; // Panels detected per page

  // Actions
  setMode: (mode: ReaderMode) => void;
  setZoomLevel: (level: number) => void;
  setBrightness: (level: number) => void;
  toggleGuidedView: () => void;
  setGuidedStep: (step: number) => void;
  setPagePanels: (pageIndex: number, panels: Panel[]) => void;
  
  openComic: (comicId: string, totalPages: number, initialPage?: number) => void;
  setPage: (pageIndex: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  toggleMenu: () => void;
  closeComic: () => void;
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      // Default Settings
      mode: 'single-vertical',
      zoomLevel: 1.0,
      brightness: 1.0,
      isGuidedViewEnabled: false,
      guidedStep: 0,

      // Initial Session State
      currentComicId: null,
      currentPage: 0,
      totalPages: 0,
      isMenuVisible: false,
      pagePanels: {},

      // Actions implementation
      setMode: (mode) => set({ mode }),
      setZoomLevel: (zoomLevel) => set({ zoomLevel }),
      setBrightness: (brightness) => set({ brightness }),
      toggleGuidedView: () => set((state) => ({ 
        isGuidedViewEnabled: !state.isGuidedViewEnabled,
        guidedStep: 0 
      })),
      setGuidedStep: (guidedStep) => set({ guidedStep }),
      setPagePanels: (pageIndex, panels) => set((state) => ({
        pagePanels: { ...state.pagePanels, [pageIndex]: panels }
      })),
      
      openComic: (comicId, totalPages, initialPage = 0) => {
        set({
          currentComicId: comicId,
          totalPages,
          currentPage: initialPage,
          zoomLevel: 1.0,
          guidedStep: 0,
          isMenuVisible: false,
          pagePanels: {}, // Reset panels on new comic
        });
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

        const increment = mode === 'dual-spread' || mode === 'manga-rtl' ? 2 : 1;
        
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

        const decrement = mode === 'dual-spread' || mode === 'manga-rtl' ? 2 : 1;
        
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
      
      closeComic: () => set({ currentComicId: null, currentPage: 0, totalPages: 0, guidedStep: 0, pagePanels: {} }),
    }),
    {
      name: 'comet-reader-storage',
      partialize: (state) => ({
        mode: state.mode,
        zoomLevel: state.zoomLevel,
        brightness: state.brightness,
        isGuidedViewEnabled: state.isGuidedViewEnabled,
      }),
    }
  )
);
