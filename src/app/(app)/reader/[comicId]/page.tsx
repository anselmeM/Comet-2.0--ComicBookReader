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

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      // Close the comic when navigating away via browser back/forward
      closeComic();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeComic]);

  // Handle fullscreen escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

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

      {/* Reader Controls - Always Visible with proper layering */}
      <div className={`fixed inset-0 z-[100] flex flex-col justify-between p-2 sm:p-4 pointer-events-none transition-opacity duration-200 ${
        isFullscreen ? 'opacity-90' : ''
      }`}>
        <div className="pointer-events-auto">
          <ReaderControls type="top" />
        </div>
        <div className="pointer-events-auto">
          <ReaderControls type="bottom" />
        </div>
      </div>

      {/* Fullscreen overlay hint */}
      {isFullscreen && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[150] pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/70 text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
            Press <kbd className="bg-neutral-700 px-1.5 py-0.5 rounded text-xs">ESC</kbd> or <kbd className="bg-neutral-700 px-1.5 py-0.5 rounded text-xs">F</kbd> to exit fullscreen
          </div>
        </div>
      )}
    </div>
  );
}
