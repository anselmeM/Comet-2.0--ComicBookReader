'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useReaderStore } from '@/stores/readerStore';
import { useParams } from 'next/navigation';
import { useLibrary } from '@/hooks/useLibrary';
import { useBookmarks } from '@/hooks/useBookmarks';
import { BookmarkPanel } from '@/components/organisms/BookmarkPanel';
import { Settings, Sun, Columns, File, Maximize, AlignRight, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, Minimize2, Bookmark, Home, List } from 'lucide-react';

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
  const comic = library.find(c => c.id === comicId);
  
  const [showBookmarkPanel, setShowBookmarkPanel] = useState(false);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

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

  const { 
    bookmarks, 
    isBookmarked, 
    addBookmark, 
    removeBookmark 
  } = useBookmarks({ comicId });

  const handleBookmarkToggle = async () => {
    if (!comicId) return;
    const existing = bookmarks.find(b => b.pageNumber === currentPage);
    if (existing) {
      await removeBookmark(existing.id);
    } else {
      await addBookmark(currentPage);
    }
  };

  // Check if fullscreen API is supported (only in browser)
  const isFullscreenSupported = typeof window !== 'undefined' && 
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
      console.error('Fullscreen error:', err);
      setFullscreenError(err instanceof Error ? err.message : 'Failed to toggle fullscreen');
    }
  }, [isFullscreenSupported, isFullscreen, toggleFullscreen]);

  // Listen for fullscreen changes (Escape key, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement ||
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

  if (type === 'top') {
    const bookmarked = comicId ? isBookmarked(currentPage) : false;
    
    return (
      <>
        <div className="flex items-center justify-between w-full h-14 bg-neutral-900/90 backdrop-blur-md rounded-2xl px-4 text-white pointer-events-auto shadow-lg border border-neutral-800">
          <div className="flex items-center gap-1">
            <Link href="/library" className="flex items-center gap-2 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-neutral-800">
              <Home size={20} />
              <span className="font-medium hidden sm:inline">Library</span>
            </Link>
          </div>
          <div className="font-semibold truncate max-w-[50%] text-center px-2">
            {comic ? comic.title : 'Loading...'}
          </div>
          <div className="flex items-center gap-1">
            {/* Bookmark Button - Combined List and Toggle */}
            <button
              type="button"
              onClick={() => {
                if (bookmarks.length > 0) {
                  // Show bookmark list
                  setShowBookmarkPanel(true);
                } else {
                  // Add bookmark for current page
                  handleBookmarkToggle();
                }
              }}
              className={`p-2 rounded-lg transition-colors relative ${
                bookmarked 
                  ? 'text-yellow-500 hover:text-yellow-400' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={bookmarked ? `Page ${currentPage + 1} bookmarked - Click for list` : `Add bookmark for page ${currentPage + 1}`}
              aria-label={bookmarked ? 'View bookmarks' : 'Add bookmark'}
            >
              <Bookmark size={20} fill={bookmarked ? "currentColor" : "none"} />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {bookmarks.length > 9 ? '9+' : bookmarks.length}
                </span>
              )}
            </button>
            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={handleFullscreen}
              className={`p-2 rounded-lg transition-colors ${
                fullscreenError 
                  ? 'text-red-400 hover:text-red-300' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
              title={isFullscreen ? 'Exit Fullscreen (F)' : fullscreenError || 'Fullscreen (F)'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <Link href="/settings" className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors">
              <Settings size={20} />
            </Link>
          </div>
        </div>

        {/* Bookmark Panel Modal */}
        {showBookmarkPanel && comicId && (
          <BookmarkPanel 
            comicId={comicId} 
            onClose={() => setShowBookmarkPanel(false)} 
          />
        )}
      </>
    );
  }

  // BOTTOM bar
  return (
    <div className="flex flex-col gap-4 w-full bg-neutral-900/90 backdrop-blur-md p-4 rounded-3xl text-white pointer-events-auto border border-neutral-800 shadow-xl mb-4 max-w-2xl mx-auto">
      
      {/* ProgressBar (Scrubber) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            console.log('Action: prevPage');
            prevPage();
          }}
          disabled={currentPage === 0}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-xs text-neutral-400 font-mono min-w-[40px] text-center">{currentPage + 1}</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalPages - 1)}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value, 10);
            console.log('Action: setPage', page);
            setPage(page);
          }}
          className="flex-1 h-2 bg-neutral-700 rounded-full appearance-none outline-none accent-blue-500"
          aria-label="Page navigation"
        />
        <span className="text-xs text-neutral-400 font-mono min-w-[40px] text-center">{totalPages}</span>
        <button
          type="button"
          onClick={() => {
            console.log('Action: nextPage');
            nextPage();
          }}
          disabled={currentPage >= totalPages - 1}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {/* Controls Row */}
      <div className="flex items-center justify-between mt-2 flex-wrap gap-4">
        
        {/* Reading Modes */}
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl">
          <ModeButton 
            active={mode === 'single-page'} 
            onClick={() => {
              console.log('Action: setMode single-page');
              setMode('single-page');
            }}
            icon={<File size={18} />} 
            label="Single" 
          />
          <ModeButton 
            active={mode === 'single-vertical'} 
            onClick={() => {
              console.log('Action: setMode single-vertical');
              setMode('single-vertical');
            }}
            icon={<List size={18} />} 
            label="Vertical" 
          />
          <ModeButton 
            active={mode === 'dual-spread'} 
            onClick={() => {
              console.log('Action: setMode dual-spread');
              setMode('dual-spread');
            }}
            icon={<Columns size={18} />} 
            label="Spread" 
          />
          <ModeButton 
            active={mode === 'manga-rtl'} 
            onClick={() => {
              console.log('Action: setMode manga-rtl');
              setMode('manga-rtl');
            }}
            icon={<AlignRight size={18} />} 
            label="Manga" 
          />
          <ModeButton 
            active={isGuidedViewEnabled} 
            onClick={() => {
              console.log('Action: toggleGuidedView');
              toggleGuidedView();
            }}
            icon={<Maximize size={18} />} 
            label="Guided" 
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl">
          <button 
            type="button"
            onClick={() => {
              console.log('Action: zoomOut, current zoom:', zoomLevel);
              setZoomLevel(Math.max(0.5, zoomLevel - 0.25));
            }}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all"
            title="Zoom Out (-)"
          >
            <ZoomOut size={18} />
          </button>
          <button 
            type="button"
            onClick={() => {
              console.log('Action: resetZoom');
              resetZoom();
            }}
            className="p-1 text-xs font-mono w-10 text-center text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-all"
            title="Reset Zoom (0)"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button 
            type="button"
            onClick={() => {
              console.log('Action: zoomIn, current zoom:', zoomLevel);
              setZoomLevel(Math.min(5, zoomLevel + 0.25));
            }}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all"
            title="Zoom In (+)"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Brightness slider */}
        <div className="flex items-center gap-2 flex-1 max-w-[120px]">
          <Sun size={16} className="text-neutral-400" />
          <input
            type="range"
            min={0.1}
            max={1.5}
            step={0.1}
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-700 rounded-full appearance-none accent-yellow-500 cursor-pointer"
            aria-label="Brightness control"
          />
        </div>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
        active ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
