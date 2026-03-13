import React from 'react';
import Link from 'next/link';
import { LibraryComic } from '@/hooks/useLibrary';
import { BookOpen, MoreVertical, Trash2 } from 'lucide-react';

interface ComicCardProps {
  comic: LibraryComic;
  onDelete?: (id: string) => void;
  disabled?: boolean;
}

export function ComicCard({ comic, onDelete, disabled }: ComicCardProps) {
  // Simple reading progress indicator based on progress entries if included
  const progressPercent = 0; // For later

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
        
        {/* Progress bar at bottom of thumbnail */}
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-neutral-900/50">
          <div 
            className="h-full bg-blue-500 rounded-r-full" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-1">
        <h3 className="text-sm font-medium text-white line-clamp-2 leading-tight" title={comic.title}>
          {comic.title}
        </h3>
        <p className="text-xs text-neutral-400">
          {comic.pageCount} pages
        </p>

        {/* Options menu stub */}
        <button 
          className="absolute bottom-3 right-3 p-1 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          aria-label="Options"
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
  );
}
