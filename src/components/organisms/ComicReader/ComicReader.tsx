'use client';

import React, { useEffect, useRef } from 'react';
import { useComicPages } from '@/hooks/useComicPages';
import { useReaderStore } from '@/stores/readerStore';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { ReaderViewport } from './ReaderViewport';
import { BlobImage } from '@/components/atoms/BlobImage';
import { AnimatePresence, motion } from 'framer-motion';
import { detectPanels } from '@/lib/guidedView';
import { useSession } from 'next-auth/react';
import { Panel } from '@/types';
import { useBookmarks } from '@/hooks/useBookmarks';

interface ComicReaderProps {
  comicId: string;
}

export function ComicReader({ comicId }: ComicReaderProps) {
  const { comic, metadata, loading, error, errorType, is404 } = useComicPages(comicId);
  const { data: session } = useSession();

  const mode = useReaderStore((state) => state.mode);
  const currentPage = useReaderStore((state) => state.currentPage);
  const brightness = useReaderStore((state) => state.brightness);
  const zoomLevel = useReaderStore((state) => state.zoomLevel);

  const openComic = useReaderStore((state) => state.openComic);
  const nextPage = useReaderStore((state) => state.nextPage);
  const prevPage = useReaderStore((state) => state.prevPage);
  const zoomIn = useReaderStore((state) => state.zoomIn);
  const zoomOut = useReaderStore((state) => state.zoomOut);
  const resetZoom = useReaderStore((state) => state.resetZoom);
  const toggleFullscreen = useReaderStore((state) => state.toggleFullscreen);
  const setPage = useReaderStore((state) => state.setPage);
  const setPagePanels = useReaderStore((state) => state.setPagePanels);
  const pagePanels = useReaderStore((state) => state.pagePanels);

  const { addBookmark, removeBookmark, getBookmarkForPage } = useBookmarks({ comicId });

  const verticalContainerRef = useRef<HTMLDivElement>(null);
  // Detect panels for current and next pages
  useEffect(() => {
    if (!comic || loading) return;

    const detectForPage = async (index: number) => {
      if (pagePanels[index] || !comic.pages[index]) return;

      try {
        const imageBitmap = await createImageBitmap(comic.pages[index].blob);
        const detected = await detectPanels(imageBitmap);
        
        // Advanced sort for multi-column layouts
        // Group panels into logical "rows" based on Y overlap
        const sorted = [...detected].sort((a, b) => a.y - b.y);
        const rows: Panel[][] = [];
        
        sorted.forEach(panel => {
          let foundRow = false;
          for (const row of rows) {
            const rowY = row[0].y;
            const rowH = row[0].height;
            // If panel overlaps significantly with this row's vertical space
            if (Math.abs(panel.y - rowY) < rowH / 2) {
              row.push(panel);
              foundRow = true;
              break;
            }
          }
          if (!foundRow) rows.push([panel]);
        });

        // Sort each row horizontally based on reading mode
        const finalPanels = rows.flatMap(row => 
          row.sort((a, b) => mode === 'manga-rtl' ? b.x - a.x : a.x - b.x)
        );

        setPagePanels(index, finalPanels);
        imageBitmap.close();
      } catch (err) {
        console.error('Panel detection failed for page', index, err);
      }
    };

    // Detect for current and next few pages for pre-caching
    const pagesToDetect = [currentPage];
    if (currentPage + 1 < comic.pages.length) pagesToDetect.push(currentPage + 1);
    if (mode === 'dual-spread' || mode === 'manga-rtl') {
      if (currentPage + 2 < comic.pages.length) pagesToDetect.push(currentPage + 2);
    }

    pagesToDetect.forEach(idx => detectForPage(idx));
  }, [comic, loading, currentPage, mode, pagePanels, setPagePanels]);

  // Track reading progress
  useReadingProgress({ comicId });

  // Sync dynamic UI variables into CSS custom properties (no inline style attribute)
  useEffect(() => {
    document.documentElement.style.setProperty('--comic-brightness', String(brightness));
  }, [brightness]);

  useEffect(() => {
    const maxWidth = Math.min(95, 95 / zoomLevel);
    document.documentElement.style.setProperty('--comic-zoom', String(zoomLevel));
    document.documentElement.style.setProperty('--comic-max-width', `${maxWidth}vw`);
  }, [zoomLevel]);

  // Initialize the store when the comic loads
  useEffect(() => {
    if (comic && !loading) {
      const currentId = useReaderStore.getState().currentComicId;
      if (currentId !== comic.comicId) {
        const initialPage = metadata?.progress?.lastPage ?? 0;
        // Cast session user to any temporarily to access custom fields
        const initialMode = (session?.user as any)?.defaultReadingMode as any;
        openComic(comic.comicId, comic.pages.length, initialPage, initialMode);
      }
    }
  }, [comic, loading, openComic, metadata, session]);

  // Set up IntersectionObserver for vertical scroll mode
  useEffect(() => {
    if (mode !== 'single-vertical' || !comic || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageIndex = parseInt(entry.target.getAttribute('data-page-index') || '0', 10);
            setPage(pageIndex);
          }
        });
      },
      {
        root: verticalContainerRef.current,
        threshold: 0.5, // Trigger when 50% of the page is visible
      }
    );

    const pages = verticalContainerRef.current?.querySelectorAll('[data-page-index]');
    pages?.forEach((page) => observer.observe(page));

    return () => observer.disconnect();
  }, [mode, comic, loading, setPage]);

  // Scroll to current page when it changes in vertical mode
  useEffect(() => {
    if (mode !== 'single-vertical' || !verticalContainerRef.current) return;

    const pageElement = verticalContainerRef.current.querySelector(`[data-page-index="${currentPage}"]`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [mode, currentPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Space
        case 'd':
        case 'D':
          if (mode === 'manga-rtl') prevPage();
          else nextPage();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (mode === 'manga-rtl') nextPage();
          else prevPage();
          break;
        case 'Home':
          setPage(0);
          break;
        case 'End':
          if (comic) setPage(comic.pages.length - 1);
          break;
        case 'PageUp':
          for (let i = 0; i < 5; i++) prevPage();
          break;
        case 'PageDown':
          for (let i = 0; i < 5; i++) nextPage();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
        case 'b':
        case 'B':
          if (comic) {
            const existing = getBookmarkForPage(currentPage);
            if (existing) {
              await removeBookmark(existing.id);
            } else {
              await addBookmark(currentPage);
            }
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, mode, toggleFullscreen, zoomIn, zoomOut, resetZoom, currentPage, comic, setPage, addBookmark, removeBookmark, getBookmarkForPage]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="animate-pulse font-medium">Loading Speed of Light Pages...</p>
        </div>
      </div>
    );
  }

  if (!comic && !error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black p-8 text-center">
        <div className="max-w-md">
          <div className="text-yellow-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">
            Unable to Load Comic
          </h2>
          <p className="opacity-80 text-gray-300">
            There was an unexpected issue loading this comic. Please try again.
          </p>
        </div>
      </div>
    );
  }

  if (error || !comic) {
    const errorMessage = (error as Error)?.message || '';
    
    let title = 'Extraction Error';
    let message = errorMessage || 'Failed to initialize comic stream.';
    
    if (errorType === 'cache') {
      title = 'Comic Not Available';
      message = 'The comic could not be loaded from the local storage. Please try importing the file again.';
    } else if (errorType === 'auth') {
      title = 'Authentication Required';
      message = 'You need to be logged in to view this comic.';
    } else if (is404) {
      title = 'Comic Not Found';
      message = 'This comic may have been removed from your library.';
    }
    
    return (
      <div className="flex h-screen items-center justify-center bg-black p-8 text-center">
        <div className="max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">
            {title}
          </h2>
          <p className="opacity-80 text-gray-300">
            {message}
          </p>
        </div>
      </div>
    );
  }

  // Dual spread / Paged logic
  const getPagesToRender = () => {
    if (mode === 'single-page' || mode === 'guided-view') {
      return [{ page: comic.pages[currentPage], index: currentPage }];
    }

    const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
    if (isSmallScreen) {
      return [{ page: comic.pages[currentPage], index: currentPage }];
    }

    if (currentPage === 0) {
      return [{ page: comic.pages[0], index: 0 }];
    }

    const pairIndex = currentPage % 2 === 1 ? currentPage : currentPage - 1;
    
    const pages = [];
    if (mode === 'manga-rtl') {
      if (comic.pages[pairIndex + 1]) pages.push({ page: comic.pages[pairIndex + 1], index: pairIndex + 1 });
      if (comic.pages[pairIndex]) pages.push({ page: comic.pages[pairIndex], index: pairIndex });
    } else {
      if (comic.pages[pairIndex]) pages.push({ page: comic.pages[pairIndex], index: pairIndex });
      if (comic.pages[pairIndex + 1]) pages.push({ page: comic.pages[pairIndex + 1], index: pairIndex + 1 });
    }
    
    return pages;
  };

  const pagesToRender = getPagesToRender();

  if (mode === 'single-vertical') {
    return (
      <div className="comic-reader-root relative w-full h-screen bg-black overflow-hidden select-none">
        <div 
          ref={verticalContainerRef}
          className="comic-reader-vertical-container h-full w-full overflow-y-auto overflow-x-hidden pt-4 pb-20 flex flex-col items-center gap-4 scroll-smooth transition-all duration-300"
        >
          {comic.pages.map((page, idx) => (
            <div 
              key={`page-${idx}`} 
              data-page-index={idx}
              className="comic-reader-page-wrapper w-full flex justify-center"
            >
              <BlobImage
                blob={page.blob}
                width={page.width}
                height={page.height}
                alt={`Page ${idx + 1}`}
                className="comic-reader-image max-h-full max-w-full object-contain shadow-2xl rounded-sm"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="comic-reader-root relative w-full h-screen bg-black overflow-hidden select-none">
      <ReaderViewport>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${currentPage}-${mode}`}
            initial={{ opacity: 0, x: mode === 'manga-rtl' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'manga-rtl' ? 30 : -30 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center justify-center h-full w-full gap-1 sm:gap-4 md:gap-8 p-4"
          >
            {pagesToRender.map((item) => (
              <BlobImage
                key={`page-${item.index}`}
                blob={item.page.blob}
                width={item.page.width}
                height={item.page.height}
                className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                draggable={false}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </ReaderViewport>
    </div>
  );
}
