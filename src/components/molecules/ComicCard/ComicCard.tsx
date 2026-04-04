import React from 'react';
import Link from 'next/link';
import { LibraryComic } from '@/hooks/useLibrary';
import { BookOpen, MoreVertical, Trash2, Wand2, Loader2 } from 'lucide-react';
import { useEnrichment } from '@/hooks/useEnrichment';

interface ComicCardProps {
  comic: LibraryComic;
  onDelete?: (id: string) => void;
  disabled?: boolean;
}

export function ComicCard({ comic, onDelete, disabled }: ComicCardProps) {
  const { mutate: enrich, isPending: isEnriching } = useEnrichment(comic.id);

  // Simple reading progress indicator based on progress entries if included
  const progressPercent = comic.progress
    ? (comic.progress.lastPage / comic.progress.totalPages) * 100
    : 0;

  return (
    <div className={`group relative flex flex-col bg-neutral-900 rounded-2xl overflow-hidden shadow-lg border border-neutral-800 transition-all ${
      disabled ? 'opacity-50 pointer-events-none' : 'hover:border-neutral-700 hover:shadow-xl hover:-translate-y-1'
    }`}>
      <Link href={`/reader/${comic.id}`} className="block relative aspect-[2/3] bg-neutral-800 w-full overflow-hidden">
        {comic.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={comic.coverUrl} 
            alt={comic.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
            <BookOpen size={48} strokeWidth={1} />
          </div>
        )}
        
        {/* Enrichment Status Overlay */}
        {isEnriching && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Progress bar at bottom of thumbnail */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-neutral-900/50">
          <div 
            className="h-full bg-blue-500 rounded-r-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-1 pr-10">
        <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight" title={comic.title}>
          {comic.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>{comic.pageCount} pages</span>
          {(comic.year || comic.issue) && (
            <>
              <span className="w-1 h-1 bg-neutral-600 rounded-full" />
              <span>
                {comic.issue ? `#${comic.issue}` : ''}
                {comic.year ? ` (${comic.year})` : ''}
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!comic.comicVineId && (
            <button
              className="p-1.5 text-neutral-500 hover:text-blue-400 hover:bg-neutral-800 rounded-lg transition-colors"
              aria-label="Enrich metadata"
              disabled={disabled || isEnriching}
              onClick={(e) => {
                e.preventDefault();
                enrich();
              }}
            >
              <Wand2 size={16} />
            </button>
          )}

          <button
            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Delete"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              onDelete?.(comic.id);
            }}
          >
            {onDelete ? <Trash2 size={16} /> : <MoreVertical size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
