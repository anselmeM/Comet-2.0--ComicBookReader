'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SortAsc, ChevronDown, BookOpen, Calendar, Hash, X } from 'lucide-react';

interface SearchFilterBarProps {
  sortBy: string | undefined;
  onSortChange: (sort: string) => void;
  readStatus: string | undefined;
  onReadStatusChange: (status: string) => void;
  yearStart: number | null | undefined;
  onYearStartChange: (year: number | null) => void;
  yearEnd: number | null | undefined;
  onYearEndChange: (year: number | null) => void;
  onReset: () => void;
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
  onReset
}: SearchFilterBarProps) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-white border-b border-neutral-100 overflow-hidden shrink-0 z-40"
    >
      <div className="px-12 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sort By */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <SortAsc size={12} /> Sort By
          </label>
          <div className="relative">
            <select 
              value={sortBy || 'recent'} 
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 px-4 text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
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
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Read Status */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <BookOpen size={12} /> Status
          </label>
          <div className="flex bg-neutral-50 p-1 rounded-xl border border-neutral-100">
            {['all', 'unread', 'reading', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => onReadStatusChange(status)}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                  (readStatus || 'all') === status 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Year Range */}
        <div className="md:col-span-2 space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
            <Calendar size={12} /> Release Period
          </label>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
              <input 
                type="number" 
                placeholder="From Year" 
                value={yearStart || ''} 
                onChange={(e) => onYearStartChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="w-4 h-px bg-neutral-200" />
            <div className="relative flex-1">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
              <input 
                type="number" 
                placeholder="To Year" 
                value={yearEnd || ''} 
                onChange={(e) => onYearEndChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button 
              onClick={onReset}
              className="p-3 bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 rounded-xl transition-all"
              title="Reset all filters"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
