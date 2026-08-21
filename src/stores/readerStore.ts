import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Panel } from '@/types';

export type ReaderMode =
  | 'single-page'
  | 'single-vertical'
  | 'dual-spread'
  | 'manga-rtl'
  | 'guided-view';

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

  // Visual scan filters
  sepia: number;
  contrast: number;
  grayscale: number;
  sharpen: boolean;

  // Guided view customizer
  panSpeed: number;
  panEase: string;
  autoplayDelay: number;
  isAutoplayActive: boolean;

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

  setSepia: (val: number) => void;
  setContrast: (val: number) => void;
  setGrayscale: (val: number) => void;
  setSharpen: (val: boolean) => void;
  setPanSpeed: (val: number) => void;
  setPanEase: (val: string) => void;
  setAutoplayDelay: (val: number) => void;
  setAutoplayActive: (val: boolean) => void;
  toggleAutoplay: () => void;

  openComic: (
    comicId: string,
    totalPages: number,
    initialPage?: number,
    initialMode?: ReaderMode,
  ) => void;
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
      },
    },
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

      // Visual scan filters
      sepia: 0,
      contrast: 1.0,
      grayscale: 0,
      sharpen: false,

      // Guided view customizer & Autoplay
      panSpeed: 0.6,
      panEase: 'easeOut',
      autoplayDelay: 3000,
      isAutoplayActive: false,

      // Initial Session State
      currentComicId: null,
      currentPage: 0,
      totalPages: 0,
      isMenuVisible: false,
      pagePanels: {},

      // Actions implementation
      setMode: (mode) =>
        set((state) => {
          const isDual = mode === 'dual-spread' || mode === 'manga-rtl';
          const currentPage =
            isDual && state.currentPage > 0 && state.currentPage % 2 === 0
              ? state.currentPage - 1
              : state.currentPage;
          return {
            mode,
            currentPage,
            ...updateSettings(state, { mode }),
          };
        }),
      setZoomLevel: (zoomLevel) =>
        set((state) => {
          const nextZoom = Math.max(0.5, Math.min(5, zoomLevel));
          return {
            zoomLevel: nextZoom,
            ...updateSettings(state, { zoomLevel: nextZoom }),
          };
        }),
      zoomIn: () =>
        set((state) => {
          const nextZoom = Math.min(5, state.zoomLevel + 0.25);
          return {
            zoomLevel: nextZoom,
            ...updateSettings(state, { zoomLevel: nextZoom }),
          };
        }),
      zoomOut: () =>
        set((state) => {
          const nextZoom = Math.max(0.5, state.zoomLevel - 0.25);
          return {
            zoomLevel: nextZoom,
            ...updateSettings(state, { zoomLevel: nextZoom }),
          };
        }),
      resetZoom: () =>
        set((state) => ({
          zoomLevel: 1.0,
          ...updateSettings(state, { zoomLevel: 1.0 }),
        })),
      setBrightness: (brightness) =>
        set((state) => {
          const nextBrightness = Math.max(0.1, Math.min(1.5, brightness));
          return {
            brightness: nextBrightness,
            ...updateSettings(state, { brightness: nextBrightness }),
          };
        }),
      toggleGuidedView: () =>
        set((state) => {
          const nextVal = !state.isGuidedViewEnabled;
          return {
            isGuidedViewEnabled: nextVal,
            guidedStep: 0,
            ...updateSettings(state, { isGuidedViewEnabled: nextVal }),
          };
        }),
      setGuidedStep: (guidedStep) => set({ guidedStep }),
      setPagePanels: (pageIndex, panels) =>
        set((state) => ({
          pagePanels: { ...state.pagePanels, [pageIndex]: panels },
        })),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),

      setSepia: (sepia) => set({ sepia }),
      setContrast: (contrast) => set({ contrast }),
      setGrayscale: (grayscale) => set({ grayscale }),
      setSharpen: (sharpen) => set({ sharpen }),
      setPanSpeed: (panSpeed) => set({ panSpeed }),
      setPanEase: (panEase) => set({ panEase }),
      setAutoplayDelay: (autoplayDelay) => set({ autoplayDelay }),
      setAutoplayActive: (isAutoplayActive) => set({ isAutoplayActive }),
      toggleAutoplay: () => set((state) => ({ isAutoplayActive: !state.isAutoplayActive })),

      openComic: (comicId, totalPages, initialPage = 0, initialMode) => {
        const existing = get().comicSettings[comicId] || {
          mode: initialMode || get().mode,
          zoomLevel: 1.0,
          brightness: 1.0,
          isGuidedViewEnabled: false,
        };
        const isDual = existing.mode === 'dual-spread' || existing.mode === 'manga-rtl';
        const startPage =
          isDual && initialPage > 0 && initialPage % 2 === 0 ? initialPage - 1 : initialPage;

        set((state) => ({
          currentComicId: comicId,
          totalPages,
          currentPage: Math.min(Math.max(0, startPage), Math.max(0, totalPages - 1)),
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
          },
        }));
      },

      setPage: (pageIndex) => {
        const { totalPages, mode } = get();
        if (pageIndex >= 0 && pageIndex < totalPages) {
          const isDual = mode === 'dual-spread' || mode === 'manga-rtl';
          const targetPage =
            isDual && pageIndex > 0 && pageIndex % 2 === 0 ? pageIndex - 1 : pageIndex;
          set({ currentPage: targetPage, guidedStep: 0 });
        }
      },

      nextPage: () => {
        const { currentPage, totalPages, mode, isGuidedViewEnabled, guidedStep, pagePanels } =
          get();

        const currentPanels = pagePanels[currentPage] || [];
        const hasNextPanel = isGuidedViewEnabled && guidedStep < currentPanels.length - 1;

        if (hasNextPanel) {
          set({ guidedStep: guidedStep + 1 });
          return;
        }

        const isDual = mode === 'dual-spread' || mode === 'manga-rtl';

        if (isDual) {
          if (currentPage === 0) {
            if (totalPages > 1) {
              set({ currentPage: 1, guidedStep: 0 });
            }
            return;
          }

          const currentLeader = currentPage % 2 === 1 ? currentPage : currentPage - 1;
          const nextLeader = currentLeader + 2;

          if (nextLeader < totalPages) {
            set({ currentPage: nextLeader, guidedStep: 0 });
          }
          return;
        }

        if (currentPage + 1 < totalPages) {
          set({ currentPage: currentPage + 1, guidedStep: 0 });
        }
      },

      prevPage: () => {
        const { currentPage, mode, isGuidedViewEnabled, guidedStep, pagePanels } = get();

        if (isGuidedViewEnabled && guidedStep > 0) {
          set({ guidedStep: guidedStep - 1 });
          return;
        }

        const isDual = mode === 'dual-spread' || mode === 'manga-rtl';

        if (isDual) {
          if (currentPage === 0) return;

          const currentLeader = currentPage % 2 === 1 ? currentPage : currentPage - 1;
          const prevLeader = currentLeader - 2;

          if (prevLeader >= 1) {
            const prevPanels = pagePanels[prevLeader] || [];
            set({
              currentPage: prevLeader,
              guidedStep: isGuidedViewEnabled ? Math.max(0, prevPanels.length - 1) : 0,
            });
          } else {
            const prevPanels = pagePanels[0] || [];
            set({
              currentPage: 0,
              guidedStep: isGuidedViewEnabled ? Math.max(0, prevPanels.length - 1) : 0,
            });
          }
          return;
        }

        if (currentPage > 0) {
          const prevPageIdx = currentPage - 1;
          const prevPanels = pagePanels[prevPageIdx] || [];

          set({
            currentPage: prevPageIdx,
            guidedStep: isGuidedViewEnabled ? Math.max(0, prevPanels.length - 1) : 0,
          });
        }
      },

      toggleMenu: () => set((state) => ({ isMenuVisible: !state.isMenuVisible })),

      closeComic: () =>
        set({
          currentComicId: null,
          currentPage: 0,
          totalPages: 0,
          isMenuVisible: false,
          pagePanels: {},
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
        sepia: state.sepia,
        contrast: state.contrast,
        grayscale: state.grayscale,
        sharpen: state.sharpen,
        panSpeed: state.panSpeed,
        panEase: state.panEase,
        autoplayDelay: state.autoplayDelay,
      }),
    },
  ),
);
