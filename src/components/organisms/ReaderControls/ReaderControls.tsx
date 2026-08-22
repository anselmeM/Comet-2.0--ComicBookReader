'use client';

// cSpell:ignore customizer mozfullscreenchange

import React, { useState, useEffect, useCallback, useRef } from 'react';

import Link from 'next/link';

import { useReaderStore } from '@/stores/readerStore';

import { useParams } from 'next/navigation';

import { useLibrary } from '@/hooks/useLibrary';

import { useBookmarks } from '@/hooks/useBookmarks';

import { useSession } from 'next-auth/react';

import { useComicPages } from '@/hooks/useComicPages';

import { ReaderSettingsPanel } from './ReaderSettingsPanel';

import { BlobImage } from '@/components/atoms/BlobImage';

import { BookmarkPanel } from '@/components/organisms/BookmarkPanel';

import { PremiumModal } from '@/components/atoms/PremiumModal';

import {
  Settings,
  Sun,
  Columns,
  File,
  Maximize,
  AlignRight,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Bookmark,
  Home,
  List,
  Sparkles,
  Sliders,
} from 'lucide-react';

import { logger } from '@/lib/logger';

// Extended types for vendor-prefixed fullscreen APIs

interface ExtendedDocument extends Document {
  webkitFullscreenEnabled?: boolean;

  mozFullScreenEnabled?: boolean;

  msFullscreenEnabled?: boolean;

  webkitFullscreenElement?: Element | null;

  mozFullScreenElement?: Element | null;

  msFullscreenElement?: Element | null;

  webkitExitFullscreen?: () => Promise<void>;

  mozCancelFullScreen?: () => Promise<void>;

  msExitFullscreen?: () => Promise<void>;
}

interface ExtendedElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;

  mozRequestFullScreen?: () => Promise<void>;

  msRequestFullscreen?: () => Promise<void>;
}

interface ReaderControlsProps {
  type: 'top' | 'bottom';
}

export function ReaderControls({ type }: ReaderControlsProps) {
  const params = useParams();

  const comicId = params.comicId as string;

  const { data: libraryData } = useLibrary();

  const library = libraryData?.data ?? [];

  const comic = library.find((c) => c.id === comicId);

  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);

  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const [showReaderSettings, setShowReaderSettings] = useState(false);

  const [showFullscreenBtn, setShowFullscreenBtn] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone;

    const ua = window.navigator.userAgent;

    const isIOSDevice =
      /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;

    // Hide fullscreen button if it's iOS (API unsupported) or already running as a standalone PWA

    if (isStandaloneMode || isIOSDevice) {
      setShowFullscreenBtn(false);
    }
  }, []);

  const { data: session } = useSession();

  const mode = useReaderStore((state) => state.mode);

  const setMode = useReaderStore((state) => state.setMode);

  const isGuidedViewEnabled = useReaderStore((state) => state.isGuidedViewEnabled);

  const toggleGuidedView = useReaderStore((state) => state.toggleGuidedView);

  const zoomLevel = useReaderStore((state) => state.zoomLevel);

  const setZoomLevel = useReaderStore((state) => state.setZoomLevel);

  const currentPage = useReaderStore((state) => state.currentPage);

  const totalPages = useReaderStore((state) => state.totalPages);

  const setPage = useReaderStore((state) => state.setPage);

  const nextPage = useReaderStore((state) => state.nextPage);

  const prevPage = useReaderStore((state) => state.prevPage);

  const brightness = useReaderStore((state) => state.brightness);

  const setBrightness = useReaderStore((state) => state.setBrightness);

  const isFullscreen = useReaderStore((state) => state.isFullscreen);

  const toggleFullscreen = useReaderStore((state) => state.toggleFullscreen);

  const resetZoom = useReaderStore((state) => state.resetZoom);

  // Visual scan filters

  // Guided view customizer & Autoplay

  const autoplayDelay = useReaderStore((state) => state.autoplayDelay);

  const setAutoplayDelay = useReaderStore((state) => state.setAutoplayDelay);

  const isAutoplayActive = useReaderStore((state) => state.isAutoplayActive);

  const setAutoplayActive = useReaderStore((state) => state.setAutoplayActive);

  const toggleAutoplay = useReaderStore((state) => state.toggleAutoplay);

  const filmstripRef = useRef<HTMLDivElement>(null);

  const { comic: comicPages, loading: comicPagesLoading } = useComicPages(comicId);

  // Center active filmstrip thumbnail

  useEffect(() => {
    if (!filmstripRef.current) return;

    const activeEl = filmstripRef.current.querySelector(`[data-filmstrip-thumb="${currentPage}"]`);

    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',

        block: 'nearest',

        inline: 'center',
      });
    }
  }, [currentPage]);

  // Guided View / Reader Autoplay Loop

  useEffect(() => {
    if (!isAutoplayActive) return;

    const interval = setInterval(() => {
      const state = useReaderStore.getState();

      const currentPanels = state.pagePanels[state.currentPage] || [];

      const isLastPanel =
        !state.isGuidedViewEnabled || state.guidedStep >= currentPanels.length - 1;

      const isLastPage = state.currentPage >= state.totalPages - 1;

      if (isLastPage && isLastPanel) {
        setAutoplayActive(false);
      } else {
        nextPage();
      }
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [isAutoplayActive, autoplayDelay, setAutoplayActive, nextPage]);

  const { bookmarks, isBookmarked, addBookmark, removeBookmark } = useBookmarks({ comicId });

  const handleBookmarkToggle = async () => {
    if (!comicId) return;

    const existing = bookmarks.find((b) => b.pageNumber === currentPage);

    if (existing) {
      await removeBookmark(existing.id);
    } else {
      await addBookmark(currentPage);
    }
  };

  // Check if fullscreen API is supported (only in browser)

  const isFullscreenSupported =
    typeof window !== 'undefined' &&
    (document.fullscreenEnabled ||
      (document as ExtendedDocument).webkitFullscreenEnabled ||
      (document as ExtendedDocument).mozFullScreenEnabled ||
      (document as ExtendedDocument).msFullscreenEnabled);

  // Handle fullscreen with browser API

  const handleFullscreen = useCallback(async () => {
    if (!isFullscreenSupported || typeof window === 'undefined') {
      setFullscreenError('Fullscreen is not supported in this browser');

      return;
    }

    const docEl = document.documentElement as ExtendedElement;

    try {
      if (!isFullscreen) {
        // Enter fullscreen

        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        } else if (docEl.mozRequestFullScreen) {
          await docEl.mozRequestFullScreen();
        } else if (docEl.msRequestFullscreen) {
          await docEl.msRequestFullscreen();
        }

        toggleFullscreen();
      } else {
        // Exit fullscreen

        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as ExtendedDocument).webkitExitFullscreen) {
          await (document as ExtendedDocument).webkitExitFullscreen!();
        } else if ((document as ExtendedDocument).mozCancelFullScreen) {
          await (document as ExtendedDocument).mozCancelFullScreen!();
        } else if ((document as ExtendedDocument).msExitFullscreen) {
          await (document as ExtendedDocument).msExitFullscreen!();
        }

        toggleFullscreen();
      }

      setFullscreenError(null);
    } catch (err) {
      logger.error('Fullscreen error:', {}, err instanceof Error ? err : undefined);

      setFullscreenError(err instanceof Error ? err.message : 'Failed to toggle fullscreen');
    }
  }, [isFullscreenSupported, isFullscreen, toggleFullscreen]);

  // Listen for fullscreen changes (Escape key, etc.)

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as ExtendedDocument).webkitFullscreenElement ||
        (document as ExtendedDocument).mozFullScreenElement ||
        (document as ExtendedDocument).msFullscreenElement;

      // Sync store state with actual fullscreen state

      const isInFullscreen = !!fullscreenElement;

      if (isInFullscreen !== isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);

      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);

      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);

      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen, toggleFullscreen]);

  const bookmarked = comicId ? isBookmarked(currentPage) : false;

  return (
    <>
      {type === 'top' ? (
        <div className="flex items-center justify-between w-full h-14 bg-comet-surface/90 backdrop-blur-md rounded-2xl px-4 text-comet-text pointer-events-auto shadow-lg border border-comet-border">
          <div className="flex items-center gap-1">
            <Link
              href="/library"
              className="flex items-center gap-2 hover:text-comet-accent transition-colors p-2 rounded-lg hover:bg-comet-surface-2"
              aria-label="Return to library"
            >
              <Home size={20} />

              <span className="font-medium hidden sm:inline">Library</span>
            </Link>
          </div>

          <div className="font-semibold truncate max-w-[50%] text-center px-2">
            {comic ? comic.title : 'Loading...'}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                bookmarks.length > 0 ? setShowBookmarkPanel(true) : handleBookmarkToggle()
              }
              className={`p-2 rounded-lg transition-colors relative ${bookmarked ? 'text-yellow-500 hover:text-yellow-400' : 'text-comet-muted hover:text-comet-text hover:bg-comet-surface-2'}`}
              title={
                bookmarked
                  ? `Page ${currentPage + 1} bookmarked - Click for list`
                  : `Add bookmark for page ${currentPage + 1}`
              }
              aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              <Bookmark
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill={bookmarked ? 'currentColor' : 'none'}
              />

              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                  {bookmarks.length > 9 ? '9+' : bookmarks.length}
                </span>
              )}
            </button>

            {showFullscreenBtn && (
              <button
                type="button"
                onClick={handleFullscreen}
                className={`hidden sm:flex p-2 rounded-lg transition-colors items-center justify-center ${fullscreenError ? 'text-red-400 hover:text-red-300' : 'text-comet-muted hover:text-comet-text hover:bg-comet-surface-2'}`}
                title={isFullscreen ? 'Exit Fullscreen (F)' : fullscreenError || 'Fullscreen (F)'}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            )}

            <Link
              href="/settings"
              className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface-2 rounded-lg transition-colors"
              aria-label="Open settings"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full bg-comet-surface/90 backdrop-blur-md p-4 rounded-3xl text-comet-text pointer-events-auto border border-comet-border shadow-xl mb-4 max-w-2xl mx-auto">
          {/* ProgressBar (Scrubber) */}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => prevPage()}
              disabled={currentPage === 0}
              className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface-2 rounded-lg transition-all disabled:opacity-30 flex-shrink-0"
              aria-label="Previous page"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-xs text-comet-muted font-mono min-w-[40px] text-center flex-shrink-0">
              {currentPage + 1}
            </span>

            {/* Mobile Touch Scrubber Slider */}
            <div className="flex md:hidden flex-1 items-center gap-2 px-2">
              <input
                type="range"
                min={1}
                max={Math.max(1, totalPages)}
                value={currentPage + 1}
                onChange={(e) => {
                  const newPage = parseInt(e.target.value, 10) - 1;
                  setPage(newPage);
                }}
                className="w-full h-2 bg-comet-surface-2 rounded-full appearance-none accent-comet-accent cursor-pointer touch-none"
                aria-label="Scrub pages"
              />
            </div>

            {/* Horizontal Filmstrip */}
            <div
              ref={filmstripRef}
              className="hidden md:flex flex-1 items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-none scroll-smooth select-none snap-x"
              style={{
                maxWidth: 'calc(100vw - 12rem)',
              }}
            >
              {comicPagesLoading ? (
                <div className="flex-1 flex items-center justify-center text-xs text-comet-muted animate-pulse py-4">
                  Loading thumbnails...
                </div>
              ) : (
                comicPages?.pages.map((page, idx) => {
                  const isActive = idx === currentPage;

                  return (
                    <button
                      key={`filmstrip-${idx}`}
                      type="button"
                      onClick={() => setPage(idx)}
                      className={`relative flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 snap-center ${
                        isActive
                          ? 'border-comet-accent scale-105 shadow-md shadow-comet-accent/30 ring-2 ring-comet-accent/50'
                          : 'border-transparent hover:border-comet-muted opacity-60 hover:opacity-100'
                      }`}
                      data-filmstrip-thumb={idx}
                      title={`Go to page ${idx + 1}`}
                    >
                      <BlobImage
                        blob={page.blob}
                        width={page.width || 48}
                        height={page.height || 64}
                        alt={`Page ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-center font-mono py-0.5 text-neutral-300">
                        {idx + 1}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <span className="text-xs text-comet-muted font-mono min-w-[40px] text-center flex-shrink-0">
              {totalPages}
            </span>

            <button
              type="button"
              onClick={() => nextPage()}
              disabled={currentPage >= totalPages - 1}
              className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface-2 rounded-lg transition-all disabled:opacity-30 flex-shrink-0"
              aria-label="Next page"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Controls Row */}

          <div className="flex items-center justify-between mt-2 gap-4">
            <div className="flex items-center gap-1 bg-comet-surface-2 p-1 rounded-xl overflow-x-auto no-scrollbar">
              <ModeButton
                active={mode === 'single-page'}
                onClick={() => setMode('single-page')}
                icon={<File size={18} />}
                label="Single"
              />

              <ModeButton
                active={mode === 'single-vertical'}
                onClick={() => setMode('single-vertical')}
                icon={<List size={18} />}
                label="Vertical"
              />

              <ModeButton
                active={mode === 'dual-spread'}
                onClick={() => setMode('dual-spread')}
                icon={<Columns size={18} />}
                label="Spread"
              />

              <ModeButton
                active={mode === 'manga-rtl'}
                onClick={() => setMode('manga-rtl')}
                icon={<AlignRight size={18} />}
                label="Manga"
              />

              <ModeButton
                active={isGuidedViewEnabled}
                onClick={() => {
                  if (session?.user?.plan !== 'PREMIUM') {
                    setIsPremiumModalOpen(true);

                    return;
                  }

                  toggleGuidedView();
                }}
                icon={
                  <Sparkles
                    size={18}
                    className={session?.user?.plan !== 'PREMIUM' ? 'text-comet-accent' : ''}
                  />
                }
                label="Guided"
              />
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-comet-surface-2 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
                className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface rounded-lg"
                aria-label="Zoom out"
              >
                <ZoomOut size={18} />
              </button>

              <button
                type="button"
                onClick={() => resetZoom()}
                className="p-1 text-xs font-mono w-10 text-center text-comet-muted hover:text-comet-text hover:bg-comet-surface rounded"
                aria-label="Reset zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.25))}
                className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface rounded-lg"
                aria-label="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-[120px]">
              <Sun size={16} className="text-comet-muted" />

              <input
                type="range"
                min={0.1}
                max={1.5}
                step={0.1}
                value={brightness}
                onChange={(e) => setBrightness(parseFloat(e.target.value))}
                className="w-full h-1 bg-comet-surface-2 rounded-full appearance-none accent-yellow-500 cursor-pointer"
                aria-label="Screen brightness"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowReaderSettings(!showReaderSettings)}
              className={`p-2 rounded-xl transition-all ${
                showReaderSettings
                  ? 'bg-comet-accent text-white shadow-md'
                  : 'text-comet-muted hover:text-comet-text hover:bg-comet-surface-2'
              }`}
              title="Visual Adjustments & Guided View Settings"
              aria-label="Toggle reader settings"
            >
              <Sliders size={18} />
            </button>
          </div>
        </div>
      )}

      <ReaderSettingsPanel open={showReaderSettings} onClose={() => setShowReaderSettings(false)} />

      {showBookmarkPanel && comicId && (
        <BookmarkPanel comicId={comicId} onClose={() => setShowBookmarkPanel(false)} />
      )}

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        featureName="Guided View"
      />
    </>
  );
}

function ModeButton({
  active,

  onClick,

  icon,

  label,
}: {
  active: boolean;

  onClick: () => void;

  icon: React.ReactNode;

  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-comet-accent text-white shadow-md' : 'text-comet-muted hover:text-comet-text hover:bg-comet-surface'}`}
      title={label}
      aria-label={`${label} reading mode`}
    >
      {icon}
    </button>
  );
}
