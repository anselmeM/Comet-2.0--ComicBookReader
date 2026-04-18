'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { ComicReader } from '@/components/organisms/ComicReader';
import { ReaderControls } from '@/components/organisms/ReaderControls';
import { useReaderStore } from '@/stores/readerStore';

export default function ReaderPage() {
  const params = useParams();
  const comicId = params.comicId as string;
  const closeComic = useReaderStore((state) => state.closeComic);
  const isFullscreen = useReaderStore((state) => state.isFullscreen);
  const toggleFullscreen = useReaderStore((state) => state.toggleFullscreen);
  const isMenuVisible = useReaderStore((state) => state.isMenuVisible);
  const toggleMenu = useReaderStore((state) => state.toggleMenu);

  // Helper to sync visibility without complex dependencies
  const setMenuVisible = (visible: boolean) => {
    if (useReaderStore.getState().isMenuVisible !== visible) {
      toggleMenu();
    }
  };

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

    // Show menu initially
    showMenuAndResetTimeout();

    // Global activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearTimeout(timeoutId);
    };
  }, []); // Only on mount

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      closeComic();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeComic]);

  // Handle fullscreen key shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        // Toggle fullscreen state - Note: actual browser FS is handled in ReaderControls
        // but we still want to react to the 'F' key if it's pressed globally.
      }
      if (e.key === 'Escape' && isFullscreen) {
        // Fullscreen exit handled by browser normally, but sync store
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!comicId) return null;

  return (
    <div 
      className={`relative w-full h-screen bg-black overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-[9999]' : ''
      }`}
      style={isFullscreen ? {
        width: '100vw',
        height: '100vh',
      } : undefined}
    >
      {/* The main reading engine */}
      <ComicReader comicId={comicId} />

      {/* Reader Controls with fade-out logic */}
      <div className={`fixed inset-0 z-[100] flex flex-col justify-between p-2 sm:p-4 pointer-events-none transition-all duration-500 ${
        isMenuVisible ? 'opacity-100' : 'opacity-0 -translate-y-2'
      }`}>
        <div className={`pointer-events-auto transition-transform duration-500 ${isMenuVisible ? 'translate-y-0' : '-translate-y-10'}`}>
          <ReaderControls type="top" />
        </div>
        <div className={`pointer-events-auto transition-transform duration-500 ${isMenuVisible ? 'translate-y-0' : 'translate-y-10'}`}>
          <ReaderControls type="bottom" />
        </div>
      </div>

      {/* Fullscreen overlay hint */}
      {isFullscreen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
            Press <kbd className="bg-neutral-700 px-1.5 py-0.5 rounded text-xs">ESC</kbd> or <kbd className="bg-neutral-700 px-1.5 py-0.5 rounded text-xs">F</kbd> to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );
}
