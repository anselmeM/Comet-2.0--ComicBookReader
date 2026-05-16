'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Trash2, MoreVertical, Sparkles, Loader2 } from 'lucide-react';
import { useDeleteComic } from '@/hooks/useLibrary';
import { useEnrichment } from '@/hooks/useEnrichment';
import { DashboardComic } from '@/components/molecules/DashboardComicCard';

interface ComicCardProps {
  comic: DashboardComic;
}

export function ComicCard({ comic }: ComicCardProps) {
  const deleteMutation = useDeleteComic();
  const enrichment = useEnrichment();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm(`Are you sure you want to delete "${comic.title}"?`)) {
      deleteMutation.mutate(comic.id);
    }
  };

  const handleEnrich = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await enrichment.mutateAsync(comic.id);
    } catch (err) {
      console.error('Manual enrichment failed:', err);
    }
  };

  const progressPercent = comic.progress 
    ? Math.round((comic.progress.lastPage / comic.progress.totalPages) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="group relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-lg hover:border-blue-500/50 transition-all"
    >
      <Link href={`/reader/${comic.id}`} className="block">
        <div className="aspect-[2/3] relative bg-neutral-800 overflow-hidden">
          {comic.coverUrl ? (
            <img
              src={comic.coverUrl}
              alt={comic.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-600">
              <BookOpen size={48} strokeWidth={1} />
            </div>
          )}
          
          {/* Progress Bar Overlay */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40">
            <div 
              className="h-full bg-blue-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Hover Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEnrich}
              disabled={enrichment.isPending}
              className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-blue-400 hover:bg-black/80 transition-all"
              title="Fetch metadata"
            >
              {enrichment.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-red-400 hover:bg-black/80 transition-all"
              title="Delete comic"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-white font-medium text-sm line-clamp-1 group-hover:text-blue-400 transition-colors">
            {comic.title}
          </h3>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-neutral-500">{comic.pageCount} pages</span>
            {progressPercent > 0 && (
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                {progressPercent === 100 ? 'Finished' : `${progressPercent}% Read`}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
