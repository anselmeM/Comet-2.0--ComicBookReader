'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
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
    if (isGuidedViewEnabled && containerRef.current) {
      const panels = pagePanels[currentPage] || [];
      const panel = panels[guidedStep];

      if (!panel) return;

      const { width: viewW, height: viewH } = containerRef.current.getBoundingClientRect();
      
      const imgElement = containerRef.current.querySelector('img');
      if (!imgElement) return;

      const imgRect = imgElement.getBoundingClientRect();
      
      // Scale required to make the panel fill ~85% of the viewport
      const scaleW = (viewW * 0.85) / (panel.width * (imgRect.width / imgElement.naturalWidth));
      const scaleH = (viewH * 0.85) / (panel.height * (imgRect.height / imgElement.naturalHeight));
      const targetScale = Math.min(scaleW, scaleH, 4); // Max 4x zoom

      // Calculate centering offset
      // Coordinates are relative to natural image
      const panelCenterX = (panel.x + panel.width / 2) * (imgRect.width / imgElement.naturalWidth);
      const panelCenterY = (panel.y + panel.height / 2) * (imgRect.height / imgElement.naturalHeight);

      const viewCenterX = viewW / 2;
      const viewCenterY = viewH / 2;

      // targetX/Y are relative to the center of the element.
      const targetX = (viewCenterX - panelCenterX) * targetScale;
      const targetY = (viewCenterY - panelCenterY) * targetScale;

      scale.set(targetScale);
      x.set(targetX);
      y.set(targetY);
    } else {
      scale.set(zoomLevel);
      x.set(0);
      y.set(0);
    }
  }, [isGuidedViewEnabled, guidedStep, currentPage, pagePanels, mode, x, y, scale, zoomLevel, resizeKey]);

  // Handle window resizing to keep panel centered
  useEffect(() => {
    if (!isGuidedViewEnabled) return;
    
    const handleResize = () => {
      setTimeout(() => {
        setResizeKey(prev => prev + 1);
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
      }
    },
    {
      target: containerRef,
      drag: { filterTaps: true, from: () => [x.get(), y.get()], swipe: { velocity: 0.5, distance: 50 } },
      pinch: { scaleBounds: { min: 0.5, max: 5 }, from: () => [scale.get(), 0] }
    }
  );

  return (
    <div 
      ref={containerRef}
      onDoubleClick={() => {
        if (scale.get() > 1) {
          setZoomLevel(1);
          x.set(0);
          y.set(0);
        } else {
          setZoomLevel(2);
        }
      }}
      onClick={(e) => {
        if (e.detail === 1 && scale.get() <= 1.1) {
          toggleMenu();
        }
      }}
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
