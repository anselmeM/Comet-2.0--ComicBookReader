'use client';

import React, { useEffect, useRef } from 'react';
import { useComicPages } from '@/hooks/useComicPages';
import { useReaderStore } from '@/stores/readerStore';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { ReaderViewport } from './ReaderViewport';
import { BlobImage } from '@/components/atoms/BlobImage';
import { AnimatePresence, motion } from 'framer-motion';
import { detectPanels } from '@/lib/guidedView';

interface ComicReaderProps {
  comicId: string;
}

export function ComicReader({ comicId }: ComicReaderProps) {
  const { comic, metadata, loading, error, errorType, is404, isAuthError } = useComicPages(comicId);
  
  const mode = useReaderStore((state) => state.mode);
  const currentPage = useReaderStore((state) => state.currentPage);
  const brightness = useReaderStore((state) => state.brightness);
  
  const openComic = useReaderStore((state) => state.openComic);
  const nextPage = useReaderStore((state) => state.nextPage);
  const prevPage = useReaderStore((state) => state.prevPage);
  const setPage = useReaderStore((state) => state.setPage);
  const setPagePanels = useReaderStore((state) => state.setPagePanels);
  const pagePanels = useReaderStore((state) => state.pagePanels);
  
  const verticalContainerRef = useRef<HTMLDivElement>(null);

  // Detect panels for current and next pages
  useEffect(() => {
    if (!comic || loading) return;

    const detectForPage = async (index: number) => {
      if (pagePanels[index] || !comic.pages[index]) return;

      try {
        const imageBitmap = await createImageBitmap(comic.pages[index].blob);
        const detected = await detectPanels(imageBitmap);
        
        // Final sort based on mode
        const sorted = [...detected].sort((a, b) => {
          // Primary sort: Y (rows)
          if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
          // Secondary sort: X (columns)
          return mode === 'manga-rtl' ? b.x - a.x : a.x - b.x;
        });

        setPagePanels(index, sorted);
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
  useReadingProgress(comicId);

  // Initialize the store when the comic loads
  useEffect(() => {
    if (comic && !loading) {
      const currentId = useReaderStore.getState().currentComicId;
      if (currentId !== comic.comicId) {
        const initialPage = metadata?.progress?.lastPage ?? 0;
        openComic(comic.comicId, comic.pages.length, initialPage);
      }
    }
  }, [comic, loading, openComic, metadata]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, mode]);

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

  // Defensive check: if loading is complete but comic is null without an explicit error,
  // this could indicate an edge case - treat as unknown error
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
          <p className="opacity-80 text-gray-300 mb-6">
            There was an unexpected issue loading this comic. Please try again or return to the library.
          </p>
          <a 
            href="/library" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Return to Library
          </a>
        </div>
      </div>
    );
  }

  if (error || !comic) {
    const errorMessage = (error as Error)?.message || '';
    
    // Determine appropriate error message based on error type
    let title = 'Extraction Error';
    let message = errorMessage || 'Failed to initialize comic stream.';
    
    if (errorType === 'cache') {
      title = 'Comic Not Available';
      message = 'The comic could not be loaded from the local storage. Please try importing the file again or check if the comic file has been moved, renamed, or deleted from its original location.';
    } else if (errorType === 'auth') {
      title = 'Authentication Required';
      message = 'You need to be logged in to view this comic. Please sign in to continue.';
    } else if (is404) {
      title = 'Comic Not Found';
      message = 'This comic may have been removed from your library. Please check the library or try re-importing the comic.';
    } else if (errorType === 'metadata') {
      title = 'Comic Not Available';
      message = 'There was a problem loading the comic metadata. Please try again or re-import the comic.';
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
          <p className="opacity-80 text-gray-300 mb-6">
            {message}
          </p>
          <a 
            href="/library" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
            Return to Library
          </a>
        </div>
      </div>
    );
  }

  // Dual spread / Paged logic
  const getPagesToRender = () => {
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
      <div className="relative w-full h-screen bg-black overflow-hidden select-none">
        <div 
          className="absolute inset-0 pointer-events-none z-50 bg-black/0 transition-opacity duration-300" 
          style={{ opacity: Math.max(0, 1 - brightness) }}
        />
        <div 
          ref={verticalContainerRef}
          className="h-full w-full overflow-y-auto overflow-x-hidden pt-4 pb-20 flex flex-col items-center gap-4 scroll-smooth"
        >
          {comic.pages.map((page, idx) => (
            <div 
              key={`page-${idx}`} 
              data-page-index={idx}
              className="w-full flex justify-center"
            >
              <BlobImage
                blob={page.blob}
                width={page.width}
                height={page.height}
                alt={`Page ${idx + 1}`}
                className="max-w-[95vw] md:max-w-[80vw] h-auto shadow-2xl rounded-sm"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <div 
        className="absolute inset-0 pointer-events-none z-50 bg-black/0 transition-opacity duration-300" 
        style={{ opacity: Math.max(0, 1 - brightness) }}
      />

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
