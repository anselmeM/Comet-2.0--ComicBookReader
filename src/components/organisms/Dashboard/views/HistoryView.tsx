'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  History,
  BookOpen,
  Trash2,
  Clock,
  RotateCcw,
  Loader2,
  Calendar,
  TrendingUp,
  Award,
} from 'lucide-react';
import { DashboardComic } from '@/components/molecules/DashboardComicCard';
import Image from 'next/image';
import { useResetProgress, useClearAllHistory } from '@/hooks/useLibrary';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { useNotification } from '@/components/atoms/Toast';

interface HistoryViewProps {
  comics: DashboardComic[];
  setActiveView: (view: string) => void;
}

/**
 * Helper to format duration in seconds to a human-readable string.
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hrs}h`;
  return `${hrs}h ${remainingMins}m`;
}

/**
 * Helper to format a session date/time.
 */
function formatSessionDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[d.getDay()];
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStrFormatted = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${dayName}, ${dateStrFormatted} at ${timeStr}`;
  } catch {
    return 'Recently';
  }
}

export const HistoryView = ({ comics, setActiveView }: HistoryViewProps) => {
  const { triggerNotification } = useNotification();
  const resetProgress = useResetProgress();
  const clearAllHistory = useClearAllHistory();
  const {
    data: historyData,
    isLoading: isHistoryLoading,
    deleteSession,
    clearHistory,
  } = useReadingHistory();

  // Search & Filtering states for comics
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'logs' | 'comics'>('stats');

  // 1. Process Heatmap Data (180 days, 26 weeks)
  const heatmapCells = useMemo(() => {
    if (!historyData?.heatmap) return [];

    const cells: { dateStr: string; date: Date; intensity: number; count: number }[] = [];
    const now = new Date();

    // Start from 25 weeks ago Sunday to align the grid perfectly
    const startDate = new Date();
    startDate.setDate(now.getDate() - 25 * 7);
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - day);
    startDate.setHours(0, 0, 0, 0);

    for (let d = 0; d < 26 * 7; d++) {
      const currentDate = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = historyData.heatmap[dateStr] || 0;

      // Classify color intensity
      let intensity = 0;
      if (count > 0 && count <= 5) intensity = 1;
      else if (count > 5 && count <= 20) intensity = 2;
      else if (count > 20 && count <= 50) intensity = 3;
      else if (count > 50) intensity = 4;

      cells.push({
        dateStr,
        date: currentDate,
        intensity,
        count,
      });
    }
    return cells;
  }, [historyData]);

  // Group cells by column (weeks) for rendering
  const heatmapWeeks = useMemo(() => {
    const weeks: (typeof heatmapCells)[] = [];
    for (let i = 0; i < heatmapCells.length; i += 7) {
      weeks.push(heatmapCells.slice(i, i + 7));
    }
    return weeks;
  }, [heatmapCells]);

  // Max weekly pages read
  const maxWeeklyCount = useMemo(() => {
    const weekly = historyData?.weekly || [];
    return Math.max(...weekly.map((w) => w.count), 1);
  }, [historyData]);

  // Filter comics list
  const recentlyReadComics = useMemo(() => {
    return comics.filter((c) => c.progress !== null && c.progress !== undefined);
  }, [comics]);

  const filteredComics = useMemo(() => {
    return recentlyReadComics.filter((comic) => {
      if (searchQuery.trim() === '') return true;
      const query = searchQuery.toLowerCase();
      return (
        comic.title.toLowerCase().includes(query) ||
        (comic.author && comic.author.toLowerCase().includes(query))
      );
    });
  }, [recentlyReadComics, searchQuery]);

  const handleResetComicProgress = async (comicId: string, title: string) => {
    if (confirm(`Reset reading progress for "${title}"? This will remove it from your history.`)) {
      try {
        await resetProgress.mutateAsync(comicId);
        triggerNotification('Comic progress reset', 'success');
      } catch (err: any) {
        triggerNotification(err.message || 'Failed to reset progress', 'error');
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Delete this reading session log?')) {
      try {
        await deleteSession.mutateAsync(sessionId);
        triggerNotification('Session log deleted', 'info');
      } catch (err: any) {
        triggerNotification(err.message || 'Failed to delete session', 'error');
      }
    }
  };

  const handleClearAllHistory = async () => {
    if (
      confirm(
        'Are you sure you want to clear all reading history? This will clear all logged sessions and reset reading progress for all comics.',
      )
    ) {
      try {
        await Promise.all([clearAllHistory.mutateAsync(), clearHistory.mutateAsync()]);
        triggerNotification('All reading history and logs cleared', 'success');
      } catch (err: any) {
        triggerNotification('Failed to clear history', 'error');
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 text-neutral-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-neutral-100 pb-8">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-4 bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-all text-neutral-400 hover:text-blue-500 shadow-sm cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-4xl font-black text-neutral-900 tracking-tighter italic">
              Reading Dashboard
            </h2>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">
              Visualize your habits & session logs
            </p>
          </div>
        </div>

        {((historyData?.sessions && historyData.sessions.length > 0) ||
          recentlyReadComics.length > 0) && (
          <button
            onClick={handleClearAllHistory}
            disabled={clearAllHistory.isPending || clearHistory.isPending}
            className="flex items-center justify-center gap-2.5 px-6 py-4 text-red-500 border border-red-100 hover:bg-red-50 hover:border-red-200 rounded-2xl transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Trash2 size={16} />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-neutral-100 p-1.5 rounded-2.5xl max-w-md">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          Habits & Stats
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          Session Logs
        </button>
        <button
          onClick={() => setActiveTab('comics')}
          className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'comics'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          Comics History
        </button>
      </div>

      {isHistoryLoading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="font-bold text-neutral-400 italic">Calculating stats...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: HABITS & STATS GRAPHS */}
          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Heatmap (SVG) */}
              <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neutral-900 tracking-tight italic">
                      Daily Heatmap
                    </h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      Active reading days (Last 180 days)
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto pt-2 select-none">
                  <svg viewBox="0 0 350 100" className="w-full min-w-[320px]">
                    <g transform="translate(20, 15)">
                      {/* Weekday labels */}
                      <text
                        x="-5"
                        y="10"
                        className="text-[7px] font-black fill-neutral-300"
                        textAnchor="end"
                      >
                        M
                      </text>
                      <text
                        x="-5"
                        y="34"
                        className="text-[7px] font-black fill-neutral-300"
                        textAnchor="end"
                      >
                        W
                      </text>
                      <text
                        x="-5"
                        y="58"
                        className="text-[7px] font-black fill-neutral-300"
                        textAnchor="end"
                      >
                        F
                      </text>

                      {/* Map columns (weeks) */}
                      {heatmapWeeks.map((week, colIdx) => (
                        <g key={colIdx} transform={`translate(${colIdx * 12}, 0)`}>
                          {week.map((cell, rowIdx) => {
                            let cellColorClass =
                              'fill-neutral-100 hover:fill-neutral-200 dark:fill-neutral-900/10 dark:hover:fill-neutral-900/20';
                            if (cell.intensity === 1)
                              cellColorClass = 'fill-blue-100 hover:fill-blue-200';
                            else if (cell.intensity === 2)
                              cellColorClass = 'fill-blue-300 hover:fill-blue-400';
                            else if (cell.intensity === 3)
                              cellColorClass = 'fill-blue-500 hover:fill-blue-600';
                            else if (cell.intensity === 4)
                              cellColorClass = 'fill-blue-700 hover:fill-blue-800';

                            return (
                              <rect
                                key={rowIdx}
                                y={rowIdx * 12}
                                width={10}
                                height={10}
                                rx={2}
                                className={`${cellColorClass} transition-colors duration-300 cursor-pointer`}
                              >
                                <title>
                                  {cell.count > 0
                                    ? `${cell.count} pages read on ${cell.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                                    : `No pages read on ${cell.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                                </title>
                              </rect>
                            );
                          })}
                        </g>
                      ))}
                    </g>
                  </svg>
                </div>

                {/* Heatmap Legend */}
                <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest pr-4 select-none">
                  <span>Less</span>
                  <div className="w-3.5 h-3.5 bg-neutral-100 rounded-md"></div>
                  <div className="w-3.5 h-3.5 bg-blue-100 rounded-md"></div>
                  <div className="w-3.5 h-3.5 bg-blue-300 rounded-md"></div>
                  <div className="w-3.5 h-3.5 bg-blue-500 rounded-md"></div>
                  <div className="w-3.5 h-3.5 bg-blue-700 rounded-md"></div>
                  <span>More</span>
                </div>
              </div>

              {/* Weekly Pages (SVG) */}
              <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neutral-900 tracking-tight italic">
                      Weekly Progress
                    </h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      Pages read per week
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-4 select-none">
                  {historyData?.weekly && historyData.weekly.length > 0 ? (
                    <svg viewBox="0 0 300 150" className="w-full max-h-[140px]">
                      {historyData.weekly.map((week, idx) => {
                        const barHeight = (week.count / maxWeeklyCount) * 80;
                        const x = 30 + idx * 32;
                        const y = 100 - barHeight;
                        return (
                          <g key={idx} className="group cursor-pointer">
                            <rect
                              x={x}
                              y={y}
                              width={20}
                              height={barHeight}
                              className="fill-blue-500 group-hover:fill-blue-600 transition-colors rx-md"
                              rx={4}
                            />
                            <text
                              x={x + 10}
                              y={122}
                              textAnchor="middle"
                              className="text-[9px] font-black fill-neutral-400 uppercase tracking-wider"
                            >
                              {week.weekLabel}
                            </text>
                            <text
                              x={x + 10}
                              y={y - 8}
                              textAnchor="middle"
                              className="text-[9px] font-extrabold fill-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {week.count}
                            </text>
                            <title>{week.count} pages read</title>
                          </g>
                        );
                      })}
                    </svg>
                  ) : (
                    <p className="text-xs text-neutral-300 font-bold italic py-10">
                      No data logged yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORICAL SESSION LOGS */}
          {activeTab === 'logs' && (
            <div className="max-w-4xl mx-auto w-full bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-neutral-50 pb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-neutral-900 tracking-tight italic">
                    Session History
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    Recent individual reading sessions
                  </p>
                </div>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                {historyData?.sessions && historyData.sessions.length > 0 ? (
                  historyData.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex items-center justify-between group hover:bg-white hover:border-blue-200 transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 shadow bg-neutral-100">
                          {session.comic.coverUrl ? (
                            <Image
                              src={session.comic.coverUrl}
                              alt={session.comic.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <BookOpen
                              size={18}
                              className="text-neutral-300 absolute inset-0 m-auto"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-neutral-900 font-medium text-sm leading-relaxed">
                            Read{' '}
                            <span className="font-black text-blue-600">
                              {session.pagesRead} pages
                            </span>{' '}
                            of{' '}
                            <span className="font-bold italic text-neutral-800 truncate inline-block max-w-[200px] align-bottom">
                              {session.comic.title}
                            </span>{' '}
                            in{' '}
                            <span className="font-bold text-neutral-800">
                              {formatDuration(session.durationSeconds)}
                            </span>
                            .
                          </p>
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">
                            {formatSessionDate(session.createdAt)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deleteSession.isPending}
                        className="text-neutral-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all cursor-pointer shrink-0"
                        title="Delete log"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-neutral-50 rounded-[2rem] border border-dashed border-neutral-200">
                    <Clock size={48} className="text-neutral-250 mx-auto mb-4" />
                    <h4 className="text-lg font-black text-neutral-400 italic">No session logs</h4>
                    <p className="text-xs text-neutral-300 font-bold max-w-xs mx-auto mt-2">
                      When you spend time reading, details of your session will appear here!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMICS HISTORY GRID */}
          {activeTab === 'comics' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <h3 className="text-xl font-black text-neutral-900 tracking-tight italic flex items-center gap-3">
                  <Award size={20} className="text-blue-500" />
                  Your Reading Journey
                </h3>

                {/* Search */}
                {recentlyReadComics.length > 0 && (
                  <div className="relative w-full md:max-w-md flex items-center">
                    <span className="absolute left-4 text-neutral-400">
                      <History size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search recently read comics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-neutral-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-neutral-400 placeholder:font-bold"
                    />
                  </div>
                )}
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
                        <div className="relative w-28 h-40 rounded-2xl overflow-hidden shrink-0 shadow bg-neutral-100">
                          {comic.coverUrl ? (
                            <Image
                              src={comic.coverUrl}
                              alt={comic.title}
                              fill
                              sizes="112px"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
                              <BookOpen size={32} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest block truncate">
                                {comic.progress?.lastReadAt
                                  ? new Date(comic.progress.lastReadAt).toLocaleDateString()
                                  : 'Active'}
                              </span>
                              <button
                                onClick={() => handleResetComicProgress(comic.id, comic.title)}
                                disabled={resetProgress.isPending}
                                className="text-neutral-300 hover:text-red-500 p-1.5 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer shrink-0"
                                title="Reset progress"
                              >
                                <RotateCcw size={14} />
                              </button>
                            </div>
                            <h4 className="text-lg font-black text-neutral-900 tracking-tighter leading-snug line-clamp-2">
                              {comic.title}
                            </h4>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest truncate">
                              {comic.author || 'Unknown Artist'}
                            </p>
                          </div>

                          <div className="space-y-3 pt-1">
                            <div className="flex justify-between items-end text-xs font-bold text-neutral-400">
                              <span className="text-sm font-black text-neutral-900 italic">
                                {progress}%
                              </span>
                              <span>
                                {comic.progress
                                  ? `${comic.progress.lastPage + 1} / ${comic.progress.totalPages} pgs`
                                  : ''}
                              </span>
                            </div>
                            <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-neutral-200">
                  <History size={48} className="text-neutral-150 mx-auto mb-4" />
                  <h4 className="text-lg font-black text-neutral-400 italic">
                    No recently read comics
                  </h4>
                  <p className="text-xs text-neutral-300 font-bold max-w-xs mx-auto mt-2">
                    Open a comic from your library and start reading to record progress!
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
