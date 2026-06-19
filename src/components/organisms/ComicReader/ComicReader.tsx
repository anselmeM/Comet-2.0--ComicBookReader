'use client';

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
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
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useComicParser } from '@/hooks/useComicParser';
import { UploadCloud, Loader2, ArrowLeft } from 'lucide-react';

interface ComicReaderProps {
  comicId: string;
}

interface CanvasPageRenderProps {
  pageIndex: number;
  page: { blob: Blob; width: number; height: number };
  canvasCache: React.MutableRefObject<Record<number, HTMLCanvasElement>>;
  filterString: string;
}

function CanvasPageRender({ pageIndex, page, canvasCache, filterString }: CanvasPageRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    let canvas = canvasCache.current[pageIndex];
    if (canvas) {
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.objectFit = 'contain';
      canvas.style.filter = filterString;
      container.appendChild(canvas);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = page.width || 800;
      canvas.height = page.height || 1200;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.objectFit = 'contain';
      canvas.style.filter = filterString;
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        createImageBitmap(page.blob)
          .then((imageBitmap) => {
            ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
            imageBitmap.close();
            canvasCache.current[pageIndex] = canvas;
          })
          .catch((err) => {
            logger.error(
              `Canvas fallback render failed for page ${pageIndex}:`,
              {},
              err instanceof Error ? err : undefined,
            );
          });
      }
    }
  }, [pageIndex, page, canvasCache, filterString]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center max-h-full max-w-full relative"
      style={{ aspectRatio: `${page.width}/${page.height}` }}
    />
  );
}

export function ComicReader({ comicId }: ComicReaderProps) {
  const { comic, metadata, loading, error, errorType, is404 } = useComicPages(comicId);
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { parseComic, isParsing, progress: parseProgress, error: parseError } = useComicParser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await parseComic(file, { skipServerPOST: true, existingComicId: comicId });
      await queryClient.invalidateQueries({
        queryKey: ['comic-pages', comicId, session?.user?.id],
      });
    } catch (err) {
      logger.error('Failed to re-import comic', {}, err instanceof Error ? err : undefined);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        await parseComic(file, { skipServerPOST: true, existingComicId: comicId });
        await queryClient.invalidateQueries({
          queryKey: ['comic-pages', comicId, session?.user?.id],
        });
      } catch (err) {
        logger.error('Failed to re-import comic', {}, err instanceof Error ? err : undefined);
      }
    }
  };

  const mode = useReaderStore((state) => state.mode);
  const currentPage = useReaderStore((state) => state.currentPage);
  const brightness = useReaderStore((state) => state.brightness);
  const zoomLevel = useReaderStore((state) => state.zoomLevel);
  const isGuidedViewEnabled = useReaderStore((state) => state.isGuidedViewEnabled);

  // Visual scan filters
  const sepia = useReaderStore((state) => state.sepia);
  const contrast = useReaderStore((state) => state.contrast);
  const grayscale = useReaderStore((state) => state.grayscale);
  const sharpen = useReaderStore((state) => state.sharpen);

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
  const toggleMenu = useReaderStore((state) => state.toggleMenu);

  const { addBookmark, removeBookmark, getBookmarkForPage } = useBookmarks({ comicId });

  const verticalContainerRef = useRef<HTMLDivElement>(null);
  const canvasCacheRef = useRef<Record<number, HTMLCanvasElement>>({});

  // Construct GPU-accelerated CSS filter string
  const filterString = useMemo(() => {
    const filters = [];
    if (sepia > 0) filters.push(`sepia(${sepia})`);
    if (contrast !== 1.0) filters.push(`contrast(${contrast})`);
    if (grayscale > 0) filters.push(`grayscale(${grayscale})`);
    if (sharpen) filters.push(`url(#sharpen-filter)`);
    return filters.length > 0 ? filters.join(' ') : 'none';
  }, [sepia, contrast, grayscale, sharpen]);

  // Clear canvas cache when comic changes or component unmounts
  useEffect(() => {
    canvasCacheRef.current = {};
    return () => {
      canvasCacheRef.current = {};
    };
  }, [comicId]);

  // Offscreen preloader callback
  const preRenderPage = useCallback(
    (index: number) => {
      if (index < 0 || !comic || index >= comic.pages.length) return;
      if (canvasCacheRef.current[index]) return;

      const page = comic.pages[index];
      const canvas = document.createElement('canvas');
      canvas.width = page.width || 800;
      canvas.height = page.height || 1200;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        createImageBitmap(page.blob)
          .then((imageBitmap) => {
            ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
            imageBitmap.close();
            canvasCacheRef.current[index] = canvas;
            logger.debug(`Pre-rendered page ${index} to cache`);
          })
          .catch((err) => {
            logger.error(
              `Pre-render failed for page ${index}:`,
              {},
              err instanceof Error ? err : undefined,
            );
          });
      }
    },
    [comic],
  );
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

        sorted.forEach((panel) => {
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
        const finalPanels = rows.flatMap((row) =>
          row.sort((a, b) => (mode === 'manga-rtl' ? b.x - a.x : a.x - b.x)),
        );

        setPagePanels(index, finalPanels);
        imageBitmap.close();
      } catch (err) {
        logger.error(
          `Panel detection failed for page ${index}`,
          {},
          err instanceof Error ? err : undefined,
        );
      }
    };

    // Detect for current and next few pages for pre-caching
    const pagesToDetect = [currentPage];
    if (currentPage + 1 < comic.pages.length) pagesToDetect.push(currentPage + 1);
    if (mode === 'dual-spread' || mode === 'manga-rtl') {
      if (currentPage + 2 < comic.pages.length) pagesToDetect.push(currentPage + 2);
    }

    pagesToDetect.forEach((idx) => detectForPage(idx));
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
      },
    );

    const pages = verticalContainerRef.current?.querySelectorAll('[data-page-index]');
    pages?.forEach((page) => observer.observe(page));

    return () => observer.disconnect();
  }, [mode, comic, loading, setPage]);

  // Scroll to current page when it changes in vertical mode
  useEffect(() => {
    if (mode !== 'single-vertical' || !verticalContainerRef.current) return;

    const pageElement = verticalContainerRef.current.querySelector(
      `[data-page-index="${currentPage}"]`,
    );
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
  }, [
    nextPage,
    prevPage,
    mode,
    toggleFullscreen,
    zoomIn,
    zoomOut,
    resetZoom,
    currentPage,
    comic,
    setPage,
    addBookmark,
    removeBookmark,
    getBookmarkForPage,
  ]);

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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">Unable to Load Comic</h2>
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
      return (
        <div className="flex h-screen items-center justify-center bg-black p-8 text-center text-white">
          <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl">
            <div className="text-amber-500 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Comic Not Available Offline</h2>
              <p className="text-sm text-neutral-400">
                The local copy of{' '}
                <span className="text-white font-semibold">{metadata?.title || 'this comic'}</span>{' '}
                is missing from your browser cache.
              </p>
            </div>

            {isParsing ? (
              <div className="p-6 bg-black/40 rounded-2xl border border-neutral-800/80 space-y-4">
                <div className="flex items-center justify-center gap-3 text-blue-400">
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span className="font-semibold text-sm capitalize">
                    {parseProgress?.phase === 'hashing' ? 'Reading file...' : 'Extracting pages...'}
                  </span>
                </div>
                {parseProgress && (
                  <div className="space-y-2">
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round((parseProgress.page / parseProgress.total) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500 font-mono">
                      <span>{Math.round((parseProgress.page / parseProgress.total) * 100)}%</span>
                      <span>
                        {parseProgress.page} / {parseProgress.total}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-blue-500/50 bg-black/20 hover:bg-blue-500/5 p-8 rounded-2xl cursor-pointer transition-all duration-300 group flex flex-col items-center gap-3"
              >
                <UploadCloud className="text-neutral-500 group-hover:text-blue-400 transition-colors w-10 h-10" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-neutral-300">
                    Click to browse or drag & drop file
                  </p>
                  <p className="text-xs text-neutral-500">Supports .cbz, .cbr, .zip</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".cbz,.cbr,.zip"
                  onChange={handleReImport}
                  className="hidden"
                />
              </div>
            )}

            {parseError && (
              <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {parseError}
              </p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => router.push('/library')}
                className="flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors py-2 cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back to Library</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (errorType === 'auth') {
      title = 'Authentication Required';
      message = 'You need to be logged in to view this comic.';
    } else if (is404) {
      title = 'Comic Not Found';
      message = 'This comic may have been removed from your library.';
    }

    return (
      <div className="flex h-screen items-center justify-center bg-black p-8 text-center text-white">
        <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-red-500 flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-sm text-neutral-400">{message}</p>
          </div>
          <div className="flex justify-center pt-2">
            <button
              onClick={() => router.push('/library')}
              className="flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Back to Library</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dual spread / Paged logic
  const getPagesToRender = () => {
    if (mode === 'single-page' || isGuidedViewEnabled) {
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
      if (comic.pages[pairIndex + 1])
        pages.push({ page: comic.pages[pairIndex + 1], index: pairIndex + 1 });
      if (comic.pages[pairIndex]) pages.push({ page: comic.pages[pairIndex], index: pairIndex });
    } else {
      if (comic.pages[pairIndex]) pages.push({ page: comic.pages[pairIndex], index: pairIndex });
      if (comic.pages[pairIndex + 1])
        pages.push({ page: comic.pages[pairIndex + 1], index: pairIndex + 1 });
    }

    return pages;
  };

  const pagesToRender = getPagesToRender();

  if (mode === 'single-vertical') {
    return (
      <div
        className="comic-reader-root relative w-full h-screen bg-black overflow-hidden select-none"
        role="main"
      >
        <svg
          className="sr-only"
          width="0"
          height="0"
          style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        >
          <defs>
            <filter id="sharpen-filter">
              <feConvolveMatrix
                order="3 3"
                preserveAlpha="true"
                kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"
              />
            </filter>
          </defs>
        </svg>
        <div
          ref={verticalContainerRef}
          onClick={() => toggleMenu()}
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
                style={{ filter: filterString }}
                className="comic-reader-image max-h-full max-w-full object-contain shadow-2xl rounded-sm"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="comic-reader-root relative w-full h-screen bg-black overflow-hidden select-none"
      role="main"
    >
      <svg
        className="sr-only"
        width="0"
        height="0"
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
      >
        <defs>
          <filter id="sharpen-filter">
            <feConvolveMatrix
              order="3 3"
              preserveAlpha="true"
              kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"
            />
          </filter>
        </defs>
      </svg>
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
              <CanvasPageRender
                key={`page-${item.index}`}
                pageIndex={item.index}
                page={item.page}
                canvasCache={canvasCacheRef}
                filterString={filterString}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </ReaderViewport>
    </div>
  );
}
