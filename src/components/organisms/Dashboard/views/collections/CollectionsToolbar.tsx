'use client';

import { LayoutGrid, List } from 'lucide-react';

export type CollectionsViewMode = 'grid' | 'list';
export type CollectionsDensity = 'compact' | 'default' | 'large';

interface CollectionsToolbarProps {
  viewMode: CollectionsViewMode;
  onViewModeChange: (mode: CollectionsViewMode) => void;
  density: CollectionsDensity;
  onDensityChange: (density: CollectionsDensity) => void;
  showPageCount: boolean;
  onShowPageCountChange: (v: boolean) => void;
  showYear: boolean;
  onShowYearChange: (v: boolean) => void;
  showProgress: boolean;
  onShowProgressChange: (v: boolean) => void;
}

/** View & Settings control bar — grid/list, density, and detail toggles. */
export const CollectionsToolbar = ({
  viewMode,
  onViewModeChange,
  density,
  onDensityChange,
  showPageCount,
  onShowPageCountChange,
  showYear,
  onShowYearChange,
  showProgress,
  onShowProgressChange,
}: CollectionsToolbarProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-100/60 border border-neutral-150 p-4 rounded-3xl shadow-sm">
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-white rounded-xl border border-neutral-150 shadow-inner">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-comet-accent/100 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="Grid View"
          >
            <LayoutGrid size={18} />
          </button>

          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-comet-accent/100 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
            title="List View"
          >
            <List size={18} />
          </button>
        </div>

        {viewMode === 'grid' && (
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-neutral-150 shadow-inner">
            <button
              onClick={() => onDensityChange('compact')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                density === 'compact'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Compact
            </button>

            <button
              onClick={() => onDensityChange('default')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                density === 'default'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Default
            </button>

            <button
              onClick={() => onDensityChange('large')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                density === 'large'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Large
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">
        <span className="text-[10px] text-neutral-400 font-black">Show Details:</span>

        <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={showPageCount}
            onChange={(e) => onShowPageCountChange(e.target.checked)}
            className="rounded border-neutral-300 text-comet-accent focus:ring-comet-accent cursor-pointer w-4 h-4"
          />
          <span>Pages</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={showYear}
            onChange={(e) => onShowYearChange(e.target.checked)}
            className="rounded border-neutral-300 text-comet-accent focus:ring-comet-accent cursor-pointer w-4 h-4"
          />
          <span>Year</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={showProgress}
            onChange={(e) => onShowProgressChange(e.target.checked)}
            className="rounded border-neutral-300 text-comet-accent focus:ring-comet-accent cursor-pointer w-4 h-4"
          />
          <span>Progress %</span>
        </label>
      </div>
    </div>
  );
};
