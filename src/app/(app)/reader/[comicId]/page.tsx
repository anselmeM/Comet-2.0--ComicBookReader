'use client';

import { useParams } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { ComicReader } from '@/components/organisms/ComicReader';
import { ReaderControls } from '@/components/organisms/ReaderControls';
import { useReaderStore } from '@/stores/readerStore';

export default function ReaderPage() {
  const params = useParams();
  const comicId = params.comicId as string;

  const isMenuVisible = useReaderStore((state) => state.isMenuVisible);
  const toggleMenu = useReaderStore((state) => state.toggleMenu);

  // Helper to sync visibility without complex dependencies
  const setMenuVisible = useCallback((visible: boolean) => {
    if (useReaderStore.getState().isMenuVisible !== visible) {
      toggleMenu();
    }
  }, [toggleMenu]);

  // Handle inactivity for controls fade-out (T-READ-006)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const hideMenu = () => {
      setMenuVisible(false);
    };

    const showMenuAndResetTimeout = () => {
      setMenuVisible(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(hideMenu, 3000);
    };

    const handleActivity = () => {
      showMenuAndResetTimeout();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial timeout
    timeoutId = setTimeout(hideMenu, 3000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(timeoutId);
    };
  }, [setMenuVisible]);

  // Check if browser supports fullscreen (only in browser)
  const isFullscreen = useReaderStore((state) => state.isFullscreen);

  return (
    <div className={`relative h-screen w-full bg-black overflow-hidden ${isFullscreen ? 'cursor-none' : ''}`}>
      {/* The Reading Engine */}
      <ComicReader comicId={comicId} />

      {/* Persistent Controls Overlays */}
      <div className={`transition-opacity duration-500 z-50 ${isMenuVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute top-0 left-0 w-full">
          <ReaderControls type="top" />
        </div>
        <div className="absolute bottom-0 left-0 w-full">
          <ReaderControls type="bottom" />
        </div>
      </div>

      {/* Fullscreen indicator if active */}
      {isFullscreen && !isMenuVisible && (
        <div className="absolute top-4 right-4 text-white/20 text-[10px] uppercase font-bold pointer-events-none">
          <div className="flex flex-col items-end">
            <span>Fullscreen Active</span>
            <span>Press <kbd className="bg-neutral-700 px-1.5 py-0.5 rounded text-xs">ESC</kbd> or <kbd className="bg-neutral-700 px-1.5 py-0.5 rounded text-xs">F</kbd> to exit</span>
          </div>
        </div>
      )}
    </div>
  );
}
