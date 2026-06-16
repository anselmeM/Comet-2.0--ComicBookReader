import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  History,
  BookOpen,
  ArrowRight,
  Trash2,
  Search,
  RotateCcw,
} from 'lucide-react';
import { DashboardComic } from '@/components/molecules/DashboardComicCard';
import Image from 'next/image';
import { useResetProgress, useClearAllHistory } from '@/hooks/useLibrary';

interface HistoryViewProps {
  comics: DashboardComic[];
  setActiveView: (view: string) => void;
}

/**
 * Formats an ISO date string into a relative human-readable timestamp.
 *
 * @param dateString - The ISO date string or null.
 * @returns A relative time string (e.g., "5m ago", "Yesterday") or empty string.
 * @example
 * formatRelativeTime("2026-06-16T16:20:12Z")
 */
function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Formats reading time in seconds into a friendly human-readable format.
 *
 * @param seconds - Number of seconds read.
 * @returns Formatted duration string (e.g., "45m read", "1.2h read") or empty string.
 * @example
 * formatTimeSpent(120)
 */
function formatTimeSpent(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s read`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m read`;
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs}h read`;
}

export const HistoryView = ({ comics, setActiveView }: HistoryViewProps) => {
  const resetProgress = useResetProgress();
  const clearAllHistory = useClearAllHistory();

  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'reading' | 'completed'>('all');

  const recentlyRead = useMemo(() => {
    return comics.filter((c) => c.progress !== null && c.progress !== undefined);
  }, [comics]);

  // Filter and search logic
  const filteredComics = useMemo(() => {
    return recentlyRead.filter((comic) => {
      // 1. Filter by Tab
      const progressPercent = comic.progress
        ? Math.round((comic.progress.lastPage / comic.progress.totalPages) * 100)
        : 0;
      const isCompleted = progressPercent >= 100;

      if (filterTab === 'reading' && isCompleted) return false;
      if (filterTab === 'completed' && !isCompleted) return false;

      // 2. Filter by Search Query
      if (searchQuery.trim() === '') return true;
      const query = searchQuery.toLowerCase();
      return (
        comic.title.toLowerCase().includes(query) ||
        (comic.author && comic.author.toLowerCase().includes(query))
      );
    });
  }, [recentlyRead, filterTab, searchQuery]);

  const handleReset = async (comicId: string, title: string) => {
    if (confirm(`Reset reading progress for "${title}"? This will remove it from your history.`)) {
      await resetProgress.mutateAsync(comicId);
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        'Are you sure you want to clear all reading history? This will reset progress for all comics in your library.',
      )
    ) {
      await clearAllHistory.mutateAsync();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-neutral-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-4 bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-all text-neutral-400 hover:text-blue-500 shadow-sm cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-4xl font-black text-neutral-900 tracking-tighter italic">
              Reading History
            </h2>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">
              Pick up where you left off
            </p>
          </div>
        </div>

        {recentlyRead.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearAllHistory.isPending}
            className="flex items-center justify-center gap-2 px-5 py-3 text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-2xl transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer"
          >
            <Trash2 size={16} />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {recentlyRead.length > 0 ? (
        <div className="space-y-6">
          {/* Filters & Search Header */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Tabs */}
            <div className="flex bg-neutral-100 p-1.5 rounded-2xl w-full md:w-auto">
              {[
                { id: 'all', label: 'All' },
                { id: 'reading', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    filterTab === tab.id
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:max-w-md flex items-center">
              <span className="absolute left-4 text-neutral-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search history by title or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-neutral-400 placeholder:font-bold"
              />
            </div>
          </div>

          {filteredComics.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredComics.map((comic) => {
                const progress = comic.progress
                  ? Math.round((comic.progress.lastPage / comic.progress.totalPages) * 100)
                  : 0;
                return (
                  <div
                    key={comic.id}
                    className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex gap-6 group hover:shadow-xl transition-all relative"
                  >
                    <div className="relative w-32 h-48 rounded-2xl overflow-hidden shrink-0 shadow-lg bg-neutral-100">
                      {comic.coverUrl ? (
                        <Image
                          src={comic.coverUrl}
                          alt={comic.title}
                          fill
                          sizes="128px"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                          <BookOpen size={40} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest block truncate">
                            {formatRelativeTime(comic.progress?.lastReadAt) || 'Last Read'}
                          </span>
                          <button
                            onClick={() => handleReset(comic.id, comic.title)}
                            disabled={resetProgress.isPending}
                            className="text-neutral-300 hover:text-red-500 p-1.5 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer shrink-0"
                            title="Reset progress"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </div>
                        <h4 className="text-xl font-black text-neutral-900 tracking-tighter leading-tight line-clamp-2">
                          {comic.title}
                        </h4>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest truncate">
                          {comic.author || 'Unknown Artist'}
                        </p>
                      </div>

                      <div className="space-y-4 pt-2">
                        {/* Pages and Time Stats */}
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs font-bold text-neutral-400">
                          {comic.progress?.totalTimeSpent !== undefined &&
                            comic.progress.totalTimeSpent > 0 && (
                              <span>{formatTimeSpent(comic.progress.totalTimeSpent)}</span>
                            )}
                          {comic.progress?.totalTimeSpent !== undefined &&
                            comic.progress.totalTimeSpent > 0 &&
                            comic.progress?.totalPages && <span>•</span>}
                          <span>
                            {comic.progress
                              ? `${comic.progress.lastPage + 1} / ${comic.progress.totalPages} pages`
                              : ''}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-black text-neutral-900 italic">
                              {progress}%
                            </span>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                              Progress
                            </span>
                          </div>
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <button
                          onClick={() => (window.location.href = `/reader/${comic.id}`)}
                          className="bg-black text-white w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-600 transition-all cursor-pointer"
                        >
                          Resume Reading <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 bg-white/50 rounded-[3rem] border border-neutral-100">
              <History size={60} className="mx-auto mb-4 text-neutral-200" strokeWidth={1} />
              <h4 className="text-xl font-black text-neutral-400 uppercase tracking-tighter italic">
                No matching history
              </h4>
              <p className="text-neutral-400 text-sm mt-1">
                Try adjusting your search query or filters.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-40 bg-white/50 rounded-[3rem] border-2 border-dashed border-neutral-100">
          <History size={80} className="mx-auto mb-6 text-neutral-200" strokeWidth={1} />
          <h4 className="text-2xl font-black text-neutral-400 uppercase tracking-tighter italic">
            No history yet
          </h4>
          <p className="text-neutral-400 mt-2 font-bold text-sm">
            Start reading comics to track your progress here!
          </p>
          <button
            onClick={() => setActiveView('dashboard')}
            className="mt-8 bg-blue-500 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-500/20 cursor-pointer"
          >
            Start Exploring
          </button>
        </div>
      )}
    </div>
  );
};
