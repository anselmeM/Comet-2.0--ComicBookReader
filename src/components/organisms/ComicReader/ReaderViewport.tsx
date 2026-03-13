'use client';

import React, { useRef, useEffect } from 'react';

import { motion, useMotionValue } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { useReaderStore } from '@/stores/readerStore';

interface ReaderViewportProps {
  children: React.ReactNode;
}

export function ReaderViewport({ children }: ReaderViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State from store
  const zoomLevel = useReaderStore((state) => state.zoomLevel);
  const setZoomLevel = useReaderStore((state) => state.setZoomLevel);
  const toggleMenu = useReaderStore((state) => state.toggleMenu);
  
  // Motion values
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(zoomLevel);
  
  useEffect(() => {
    scale.set(zoomLevel);
  }, [zoomLevel, scale]);

  useGesture(
    {
      onDrag: ({ offset: [dx, dy], intentional }) => {
        if (!intentional || zoomLevel <= 1) return;
        x.set(dx);
        y.set(dy);
      },
      onPinch: ({ offset: [s], memo }) => {
        setZoomLevel(s);
        return memo;
      }
    },
    {
      target: containerRef,
      drag: { filterTaps: true, from: () => [x.get(), y.get()] },
      pinch: { scaleBounds: { min: 0.5, max: 5 }, from: () => [zoomLevel, 0] }
    }
  );

  return (
    <div 
      ref={containerRef}
      onClick={() => {
        if (zoomLevel === 1) toggleMenu();
      }}
      className="relative w-full h-full overflow-hidden bg-black touch-none"
    >
      <motion.div
        className="w-full h-full flex items-center justify-center origin-center"
        style={{ x, y, scale }}
      >
        {children}
      </motion.div>
    </div>
  );
}
