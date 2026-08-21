'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  motion,
  useMotionValue,
  animate,
  type AnimationPlaybackControls,
  type Easing,
} from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useReaderStore } from '@/stores/readerStore';

interface ReaderViewportProps {
  children: React.ReactNode;
}

export function ReaderViewport({ children }: ReaderViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizeKey, setResizeKey] = useState(0);

  // State from store
  const zoomLevel = useReaderStore((state) => state.zoomLevel);
  const setZoomLevel = useReaderStore((state) => state.setZoomLevel);
  const isGuidedViewEnabled = useReaderStore((state) => state.isGuidedViewEnabled);
  const guidedStep = useReaderStore((state) => state.guidedStep);
  const currentPage = useReaderStore((state) => state.currentPage);
  const pagePanels = useReaderStore((state) => state.pagePanels);
  const mode = useReaderStore((state) => state.mode);
  const toggleMenu = useReaderStore((state) => state.toggleMenu);
  const nextPage = useReaderStore((state) => state.nextPage);
  const prevPage = useReaderStore((state) => state.prevPage);

  const panSpeed = useReaderStore((state) => state.panSpeed);
  const panEase = useReaderStore((state) => state.panEase);

  // Motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(zoomLevel);

  // Update scale when zoomLevel changes
  useEffect(() => {
    if (!isGuidedViewEnabled) {
      scale.set(zoomLevel);
    }
  }, [zoomLevel, scale, isGuidedViewEnabled]);

  // Guided View Automated Panning
  useEffect(() => {
    let animScale: AnimationPlaybackControls | undefined;
    let animX: AnimationPlaybackControls | undefined;
    let animY: AnimationPlaybackControls | undefined;

    if (isGuidedViewEnabled && containerRef.current) {
      const panels = pagePanels[currentPage] || [];
      const panel = panels[guidedStep];

      if (!panel) return;

      const { width: viewW, height: viewH } = containerRef.current.getBoundingClientRect();

      const mediaElement =
        containerRef.current.querySelector('canvas') || containerRef.current.querySelector('img');
      if (!mediaElement) return;

      const mediaRect = mediaElement.getBoundingClientRect();

      const naturalWidth =
        (mediaElement as HTMLCanvasElement).width ||
        (mediaElement as HTMLImageElement).naturalWidth ||
        800;
      const naturalHeight =
        (mediaElement as HTMLCanvasElement).height ||
        (mediaElement as HTMLImageElement).naturalHeight ||
        1200;

      // Scale required to make the panel fill ~85% of the viewport
      const scaleW = (viewW * 0.85) / (panel.width * (mediaRect.width / naturalWidth));
      const scaleH = (viewH * 0.85) / (panel.height * (mediaRect.height / naturalHeight));
      const targetScale = Math.min(scaleW, scaleH, 4); // Max 4x zoom

      // Calculate centering offset
      // Coordinates are relative to natural image
      const panelCenterX = (panel.x + panel.width / 2) * (mediaRect.width / naturalWidth);
      const panelCenterY = (panel.y + panel.height / 2) * (mediaRect.height / naturalHeight);

      const viewCenterX = viewW / 2;
      const viewCenterY = viewH / 2;

      // targetX/Y are relative to the center of the element.
      const targetX = (viewCenterX - panelCenterX) * targetScale;
      const targetY = (viewCenterY - panelCenterY) * targetScale;

      animScale = animate(scale, targetScale, { duration: panSpeed, ease: panEase as Easing });
      animX = animate(x, targetX, { duration: panSpeed, ease: panEase as Easing });
      animY = animate(y, targetY, { duration: panSpeed, ease: panEase as Easing });
    } else {
      animScale = animate(scale, zoomLevel, { duration: panSpeed, ease: panEase as Easing });
      animX = animate(x, 0, { duration: panSpeed, ease: panEase as Easing });
      animY = animate(y, 0, { duration: panSpeed, ease: panEase as Easing });
    }

    return () => {
      animScale?.stop();
      animX?.stop();
      animY?.stop();
    };
  }, [
    isGuidedViewEnabled,
    guidedStep,
    currentPage,
    pagePanels,
    mode,
    x,
    y,
    scale,
    zoomLevel,
    resizeKey,
    panSpeed,
    panEase,
  ]);

  // Handle window resizing to keep panel centered
  useEffect(() => {
    if (!isGuidedViewEnabled) return;

    const handleResize = () => {
      setTimeout(() => {
        setResizeKey((prev) => prev + 1);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isGuidedViewEnabled]);

  useGesture(
    {
      onDrag: ({ offset: [dx, dy], intentional, swipe }) => {
        // Handle swipe detection ONLY when not zoomed in
        if (swipe && swipe[0] !== 0 && scale.get() < 1.05 && !isGuidedViewEnabled) {
          if (swipe[0] === -1) {
            if (mode === 'manga-rtl') prevPage();
            else nextPage();
          } else if (swipe[0] === 1) {
            if (mode === 'manga-rtl') nextPage();
            else prevPage();
          }
          return;
        }

        // Regular pan when zoomed in or guided view enabled
        if (!intentional || (scale.get() <= 1 && !isGuidedViewEnabled)) return;
        x.set(dx);
        y.set(dy);
      },
      onPinch: ({ offset: [s], memo }) => {
        setZoomLevel(s);
        return memo;
      },
    },
    {
      target: containerRef,
      drag: {
        filterTaps: true,
        from: () => [x.get(), y.get()],
        swipe: { velocity: 0.5, distance: 50 },
      },
      pinch: { scaleBounds: { min: 0.5, max: 5 }, from: () => [scale.get(), 0] },
    },
  );

  const lastTapRef = useRef<number>(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!e.isPrimary) return;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Only process primary pointer (e.g. not multi-touch pinch)
    if (!e.isPrimary) return;

    // Check if a drag or long pan occurred
    if (pointerDownPosRef.current) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      const dist = Math.hypot(dx, dy);
      const duration = Date.now() - pointerDownPosRef.current.time;
      pointerDownPosRef.current = null;

      // If pointer moved more than 8px or was held for pan (>800ms), treat as gesture, not tap
      if (dist > 8 || duration > 800) {
        return;
      }
    }

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      if (singleTapTimeoutRef.current) clearTimeout(singleTapTimeoutRef.current);
      lastTapRef.current = 0; // reset

      if (scale.get() > 1) {
        setZoomLevel(1);
        x.set(0);
        y.set(0);
      } else {
        setZoomLevel(2);
      }
      return;
    }

    lastTapRef.current = now;

    // Capture DOM node + coordinates synchronously. React nulls
    // e.currentTarget after the handler returns, so reading it inside
    // the setTimeout below would throw on every tap.
    const container = containerRef.current;
    const clientX = e.clientX;

    // Process single tap
    singleTapTimeoutRef.current = setTimeout(() => {
      if (scale.get() > 1.1) return; // Don't turn pages if zoomed in

      if (!container) return;
      const rect = container.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const width = rect.width;

      if (clickX < width * 0.3) {
        if (mode === 'manga-rtl') nextPage();
        else prevPage();
      } else if (clickX > width * 0.7) {
        if (mode === 'manga-rtl') prevPage();
        else nextPage();
      } else {
        toggleMenu();
      }
    }, DOUBLE_TAP_DELAY); // Wait for potential double-tap
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="relative w-full h-full overflow-hidden bg-black touch-none cursor-grab active:cursor-grabbing"
    >
      <motion.div
        className="w-full h-full flex items-center justify-center origin-center relative"
        style={{ x, y, scale }}
      >
        {children}

        {/* Center Fold Gutter for dual-spread mode (T-READ-008) */}
        {(mode === 'dual-spread' || mode === 'manga-rtl') && currentPage > 0 && (
          <div className="absolute inset-0 pointer-events-none flex justify-center z-10">
            <div className="w-8 h-full bg-gradient-to-r from-black/20 via-black/40 to-black/20 blur-sm opacity-50" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
