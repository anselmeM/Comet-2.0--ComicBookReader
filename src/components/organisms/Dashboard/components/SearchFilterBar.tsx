'use client';

import React from 'react';

import { motion } from 'framer-motion';

import { SortAsc, ChevronDown, BookOpen, Calendar, Hash, X, CloudOff } from 'lucide-react';

interface SearchFilterBarProps {
  sortBy: string | undefined;

  onSortChange: (sort: string) => void;

  readStatus: string | undefined;

  onReadStatusChange: (status: string) => void;

  yearStart: number | null | undefined;

  onYearStartChange: (year: number | null) => void;

  yearEnd: number | null | undefined;

  onYearEndChange: (year: number | null) => void;

  isOfflineOnly?: boolean;

  onOfflineOnlyChange?: (val: boolean) => void;

  onReset: () => void;

  className?: string;
}

export function SearchFilterBar({
  sortBy,

  onSortChange,

  readStatus,

  onReadStatusChange,

  yearStart,

  onYearStartChange,

  yearEnd,

  onYearEndChange,

  isOfflineOnly,

  onOfflineOnlyChange,

  onReset,

  className,
}: SearchFilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white/95 backdrop-blur-2xl border border-neutral-200/50 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] shrink-0 z-50 p-6 md:p-8 ${className || ''}`}
    >
      <div className="flex flex-col gap-6 w-full">
        {/* Sort By */}

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-400 flex items-center gap-1.5">
            <SortAsc size={12} className="text-comet-accent" /> Sort By
          </label>

          <div className="relative group">
            <select
              value={sortBy || 'recent'}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-neutral-50/50 group-hover:bg-neutral-50 hover:border-neutral-300 focus:bg-white border border-neutral-200/60 rounded-2xl py-3.5 pl-4 pr-10 text-sm font-bold text-neutral-700 outline-none focus:ring-4 focus:ring-comet-accent/5 focus:border-comet-accent/40 appearance-none cursor-pointer transition-all duration-300"
            >
              <option value="recent">Recently Read</option>

              <option value="added">Recently Added</option>

              <option value="title_asc">Title (A-Z)</option>

              <option value="title_desc">Title (Z-A)</option>

              <option value="year_desc">Year (Newest)</option>

              <option value="year_asc">Year (Oldest)</option>

              <option value="pages_desc">Pages (Most)</option>

              <option value="pages_asc">Pages (Least)</option>

              <option value="rating_desc">Rating (High to Low)</option>

              <option value="rating_asc">Rating (Low to High)</option>
            </select>

            <ChevronDown
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-neutral-600 transition-colors pointer-events-none"
              size={16}
            />
          </div>
        </div>

        {/* Read Status */}

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-400 flex items-center gap-1.5">
            <BookOpen size={12} className="text-comet-accent" /> Status
          </label>

          <div className="flex gap-1 bg-neutral-100/50 p-1 rounded-2xl border border-neutral-200/30">
            {['all', 'unread', 'reading', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => onReadStatusChange(status)}
                className={`flex-1 py-2.5 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${
                  (readStatus || 'all') === status
                    ? 'bg-white text-comet-accent shadow-md shadow-neutral-200/60 border border-neutral-100 font-extrabold scale-100'
                    : 'text-neutral-400 hover:text-neutral-700 hover:scale-[1.02]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Year Range */}

        <div className="space-y-2.5 pt-2 border-t border-neutral-100">
          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-neutral-400 flex items-center gap-1.5">
            <Calendar size={12} className="text-comet-accent" /> Release Period
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Hash
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                size={14}
              />

              <input
                type="number"
                placeholder="From Year (e.g. 1999)"
                value={yearStart || ''}
                onChange={(e) =>
                  onYearStartChange(e.target.value ? parseInt(e.target.value) : null)
                }
                className="w-full bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-300 focus:bg-white border border-neutral-200/60 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-neutral-700 outline-none focus:ring-4 focus:ring-comet-accent/5 focus:border-comet-accent/40 transition-all duration-300"
              />
            </div>

            <div className="hidden sm:block w-4 h-px bg-neutral-200" />

            <div className="relative flex-1 w-full">
              <Hash
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                size={14}
              />

              <input
                type="number"
                placeholder="To Year (e.g. 2026)"
                value={yearEnd || ''}
                onChange={(e) => onYearEndChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-300 focus:bg-white border border-neutral-200/60 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-neutral-700 outline-none focus:ring-4 focus:ring-comet-accent/5 focus:border-comet-accent/40 transition-all duration-300"
              />
            </div>

            <div className="flex gap-3 w-full sm:w-auto justify-end">
              {onOfflineOnlyChange && (
                <button
                  onClick={() => onOfflineOnlyChange(!isOfflineOnly)}
                  className={`p-3.5 rounded-2xl transition-all duration-300 border flex items-center justify-center ${
                    isOfflineOnly
                      ? 'bg-comet-accent/10 text-comet-accent border-comet-accent/40 shadow-md shadow-comet-accent/5 hover:bg-comet-accent/10'
                      : 'bg-neutral-50/50 text-neutral-400 border-neutral-200/60 hover:bg-neutral-100/50 hover:border-neutral-300'
                  }`}
                  title={
                    isOfflineOnly ? 'Showing offline comics only' : 'Filter by offline availability'
                  }
                >
                  <CloudOff size={18} strokeWidth={2.5} />
                </button>
              )}

              <button
                onClick={onReset}
                className="p-3.5 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-400 hover:text-neutral-600 rounded-2xl transition-all duration-300 hover:rotate-12 active:scale-95"
                title="Reset all filters"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
