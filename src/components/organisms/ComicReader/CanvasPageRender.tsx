'use client';

import { useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

interface CanvasPageRenderProps {
  pageIndex: number;
  page: { blob: Blob; width: number; height: number };
  canvasCache: React.MutableRefObject<Record<number, HTMLCanvasElement>>;
  filterString: string;
}

/**
 * Renders a single comic page into a canvas element.
 *
 * The canvas is created/reused imperatively (appended into a plain div) and
 * cached by pageIndex so page turns don't re-decode the bitmap. Stale async
 * decodes are dropped via a per-effect flag so a recycled canvas is never
 * drawn into after navigation away from the page.
 */
export function CanvasPageRender({
  pageIndex,
  page,
  canvasCache,
  filterString,
}: CanvasPageRenderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isStaleRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    isStaleRef.current = false;

    container.querySelector('canvas')?.remove();

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
            if (isStaleRef.current) {
              imageBitmap.close();
              return;
            }
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

    return () => {
      isStaleRef.current = true;
    };
  }, [pageIndex, page, canvasCache, filterString]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center max-h-full max-w-full relative"
      style={{ aspectRatio: `${page.width}/${page.height}` }}
    />
  );
}
