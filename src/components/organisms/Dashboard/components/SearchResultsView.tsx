'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Folder, ChevronDown } from 'lucide-react';
import { DashboardComicCard, DashboardComic } from '@/components/molecules/DashboardComicCard';
import { SearchResult } from '@/lib/search';

interface SearchResultsViewProps {
  results: SearchResult;
  onClearSearch: () => void;
  onSearchChange: (query: string) => void;
  setActiveView: (view: string) => void;
  isEditMode: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string, currentStatus: boolean) => void;
}

export function SearchResultsView({
  results,
  onClearSearch,
  onSearchChange,
  setActiveView,
  isEditMode,
  selectedIds,
  onToggleSelect,
  onToggleFavorite,
}: SearchResultsViewProps) {
  return (
    <motion.div
      key="search-results"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="space-y-12"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase">Search Results</h2>
        <button
          onClick={onClearSearch}
          className="text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-comet-accent transition-colors flex items-center gap-2"
        >
          <X size={14} /> Clear Search
        </button>
      </div>

      {results.comics.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 border-l-4 border-blue-500 pl-4">
            Comics ({results.comics.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {results.comics.map((comic) => (
              <DashboardComicCard
                key={comic.id}
                comic={comic as any}
                isFav={comic.isFavorite}
                onToggleFav={() => onToggleFavorite(comic.id, !!comic.isFavorite)}
                isEditMode={isEditMode}
                isSelected={selectedIds.includes(comic.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        </section>
      )}

      {results.collections.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 border-l-4 border-purple-500 pl-4">
            Collections ({results.collections.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.collections.map((col) => (
              <button
                key={col.id}
                onClick={() => {
                  setActiveView('collections');
                  onClearSearch();
                }}
                className="bg-white border border-neutral-100 p-8 rounded-3xl flex items-center justify-between group hover:border-purple-500 transition-all text-left"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                    <Folder size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl tracking-tight">{col.name}</h4>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">
                      {col.items?.length || 0} items
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className="-rotate-90 text-neutral-200 group-hover:text-purple-500 transition-colors"
                  size={24}
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {results.series.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-400 border-l-4 border-orange-500 pl-4">
            Series ({results.series.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {results.series.map((s) => (
              <button
                key={s}
                onClick={() => onSearchChange(s)}
                className="bg-orange-50 text-orange-600 px-6 py-3 rounded-xl font-black text-sm hover:bg-orange-100 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {results.comics.length === 0 &&
        results.collections.length === 0 &&
        results.series.length === 0 && (
          <div className="text-center py-40">
            <div className="w-24 h-24 bg-neutral-100 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-neutral-300">
              <Search size={48} />
            </div>
            <h4 className="text-2xl font-black text-neutral-900 mb-2">No results found</h4>
            <p className="text-neutral-400 font-bold">Try adjusting your search terms</p>
          </div>
        )}
    </motion.div>
  );
}
