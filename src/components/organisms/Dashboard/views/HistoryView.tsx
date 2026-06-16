import React from 'react';
import { ChevronLeft, History, BookOpen, ArrowRight } from 'lucide-react';
import { DashboardComic } from '@/components/molecules/DashboardComicCard';
import Image from 'next/image';

interface HistoryViewProps {
  comics: DashboardComic[];
  setActiveView: (view: string) => void;
}

export const HistoryView = ({ comics, setActiveView }: HistoryViewProps) => {
  const recentlyRead = comics.filter((c) => c.progress !== null && c.progress !== undefined);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-4 bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-all text-neutral-400 hover:text-blue-500 shadow-sm"
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
      </div>

      {recentlyRead.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recentlyRead.map((comic) => {
            const progress = comic.progress
              ? Math.round((comic.progress.lastPage / comic.progress.totalPages) * 100)
              : 0;
            return (
              <div
                key={comic.id}
                className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-sm flex gap-6 group hover:shadow-xl transition-all"
              >
                <div className="relative w-32 h-48 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                  {comic.coverUrl ? (
                    <Image
                      src={comic.coverUrl}
                      alt={comic.title}
                      fill
                      sizes="128px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center text-neutral-300">
                      <BookOpen size={40} />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">
                      Last Read
                    </span>
                    <h4 className="text-xl font-black text-neutral-900 tracking-tighter leading-tight line-clamp-2">
                      {comic.title}
                    </h4>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                      {comic.author || 'Unknown Artist'}
                    </p>
                  </div>

                  <div className="space-y-4">
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
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => (window.location.href = `/reader/${comic.id}`)}
                      className="bg-black text-white w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-600 transition-all"
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
        <div className="text-center py-40 bg-white/50 rounded-[3rem] border-2 border-dashed border-neutral-100">
          <History size={80} className="mx-auto mb-6 text-neutral-200" strokeWidth={1} />
          <h4 className="text-2xl font-black text-neutral-400 uppercase tracking-tighter italic">
            No history yet
          </h4>
          <p className="text-neutral-400 mt-2">Start reading comics to track your progress here!</p>
          <button
            onClick={() => setActiveView('dashboard')}
            className="mt-8 bg-blue-500 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
          >
            Start Exploring
          </button>
        </div>
      )}
    </div>
  );
};
