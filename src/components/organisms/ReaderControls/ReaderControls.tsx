'use client';

import React from 'react';
import Link from 'next/link';
import { useReaderStore } from '@/stores/readerStore';
import { useParams } from 'next/navigation';
import { useLibrary } from '@/hooks/useLibrary';
import { Settings, ArrowLeft, Sun, Columns, File, Maximize, AlignRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ReaderControlsProps {
  type: 'top' | 'bottom';
}

export function ReaderControls({ type }: ReaderControlsProps) {
  const params = useParams();
  const comicId = params.comicId as string;
  const { data: library } = useLibrary();
  const comic = library?.find(c => c.id === comicId);
  // useComicPages(comicId); // Redundant if ComicReader already calls it

  const mode = useReaderStore((state) => state.mode);
  const setMode = useReaderStore((state) => state.setMode);
  const isGuidedViewEnabled = useReaderStore((state) => state.isGuidedViewEnabled);
  const toggleGuidedView = useReaderStore((state) => state.toggleGuidedView);
  const zoomLevel = useReaderStore((state) => state.zoomLevel);
  const setZoomLevel = useReaderStore((state) => state.setZoomLevel);
  
  const currentPage = useReaderStore((state) => state.currentPage);
  const totalPages = useReaderStore((state) => state.totalPages);
  const setPage = useReaderStore((state) => state.setPage);
  
  const brightness = useReaderStore((state) => state.brightness);
  const setBrightness = useReaderStore((state) => state.setBrightness);

  if (type === 'top') {
    return (
      <div className="flex items-center justify-between w-full h-14 bg-neutral-900/90 backdrop-blur-md rounded-2xl px-4 text-white pointer-events-auto shadow-lg border border-neutral-800">
        <Link href="/library" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium hidden sm:inline">Library</span>
        </Link>
        <div className="font-semibold truncate max-w-[50%] text-center">
          {comic ? comic.title : 'Loading...'}
        </div>
        <Link href="/settings" className="hover:text-blue-400 transition-colors">
          <Settings size={20} />
        </Link>
      </div>
    );
  }

  // BOTTOM bar
  return (
    <div className="flex flex-col gap-4 w-full bg-neutral-900/90 backdrop-blur-md p-4 rounded-3xl text-white pointer-events-auto border border-neutral-800 shadow-xl mb-4 max-w-2xl mx-auto">
      
      {/* ProgressBar (Scrubber) */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-neutral-400 font-mono">{currentPage + 1}</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, totalPages - 1)}
          value={currentPage}
          onChange={(e) => setPage(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-neutral-700 rounded-full appearance-none outline-none accent-blue-500"
        />
        <span className="text-xs text-neutral-400 font-mono">{totalPages}</span>
      </div>
      
      {/* Controls Row */}
      <div className="flex items-center justify-between mt-2 flex-wrap gap-4">
        
        {/* Reading Modes */}
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl">
          <ModeButton 
            active={mode === 'single-vertical'} 
            onClick={() => setMode('single-vertical')}
            icon={<File size={18} />} 
            label="Single" 
          />
          <ModeButton 
            active={mode === 'dual-spread'} 
            onClick={() => setMode('dual-spread')}
            icon={<Columns size={18} />} 
            label="Spread" 
          />
          <ModeButton 
            active={mode === 'manga-rtl'} 
            onClick={() => setMode('manga-rtl')}
            icon={<AlignRight size={18} />} 
            label="Manga" 
          />
          <ModeButton 
            active={isGuidedViewEnabled} 
            onClick={() => toggleGuidedView()}
            icon={<Maximize size={18} />} 
            label="Guided" 
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-xl">
          <button 
            onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-xs font-mono w-12 text-center text-neutral-400">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button 
            onClick={() => setZoomLevel(Math.min(5, zoomLevel + 0.25))}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-all"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* Brightness slider */}
        <div className="flex items-center gap-2 flex-1 max-w-[120px]">
          <Sun size={16} className="text-neutral-400" />
          <input
            type="range"
            min={0.1}
            max={1.5}
            step={0.1}
            value={brightness}
            onChange={(e) => setBrightness(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-700 rounded-full appearance-none accent-yellow-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg flex items-center justify-center transition-all ${
        active ? 'bg-blue-600 text-white shadow-md' : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
