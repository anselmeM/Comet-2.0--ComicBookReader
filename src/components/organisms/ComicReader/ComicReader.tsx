'use client';

import React, { useEffect, useRef } from 'react';
import { useComicPages } from '@/hooks/useComicPages';
import { useReaderStore } from '@/stores/readerStore';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { ReaderViewport } from './ReaderViewport';
import { BlobImage } from '@/components/atoms/BlobImage';
import { AnimatePresence, motion } from 'framer-motion';

interface ComicReaderProps {
  comicId: string;
}

export function ComicReader({ comicId }: ComicReaderProps) {
  const { comic, metadata, loading, error } = useComicPages(comicId);
  
  const readingMode = useReaderStore((state) => state.readingMode);
  const currentPage = useReaderStore((state) => state.currentPage);
  const brightness = useReaderStore((state) => state.brightness);
  
  const openComic = useReaderStore((state) => state.openComic);
  const nextPage = useReaderStore((state) => state.nextPage);
  const prevPage = useReaderStore((state) => state.prevPage);
  const setPage = useReaderStore((state) => state.setPage);
  
  const verticalContainerRef = useRef<HTMLDivElement>(null);

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
    if (readingMode !== 'single-vertical' || !comic || loading) return;

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
  }, [readingMode, comic, loading, setPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowRight':
        case ' ': // Space
        case 'd':
        case 'D':
          if (readingMode === 'manga-rtl') prevPage();
          else nextPage();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (readingMode === 'manga-rtl') nextPage();
          else prevPage();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage, readingMode]);

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

  if (error || !comic) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-red-500 p-8 text-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Extraction Error</h2>
          <p className="opacity-80">{(error as Error)?.message || 'Failed to initialize comic stream.'}</p>
        </div>
      </div>
    );
  }

  // Dual spread / Paged logic
  const getPagesToRender = () => {
    if (currentPage === 0) {
      return [comic.pages[0]];
    }

    const isEven = currentPage % 2 === 0;
    const pairIndex = isEven ? currentPage : currentPage - 1;
    
    const pages = [];
    if (readingMode === 'manga-rtl') {
      if (comic.pages[pairIndex + 1]) pages.push(comic.pages[pairIndex + 1]);
      if (comic.pages[pairIndex]) pages.push(comic.pages[pairIndex]);
    } else {
      if (comic.pages[pairIndex]) pages.push(comic.pages[pairIndex]);
      if (comic.pages[pairIndex + 1]) pages.push(comic.pages[pairIndex + 1]);
    }
    
    return pages;
  };

  const pagesToRender = getPagesToRender();

  if (readingMode === 'single-vertical') {
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
            key={`${currentPage}-${readingMode}`}
            initial={{ opacity: 0, x: readingMode === 'manga-rtl' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: readingMode === 'manga-rtl' ? 30 : -30 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex items-center justify-center h-full w-full gap-1 sm:gap-4 md:gap-8 p-4"
          >
            {pagesToRender.map((page, idx) => (
              <BlobImage
                key={`${currentPage}-${idx}`}
                blob={page.blob}
                width={page.width}
                height={page.height}
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
