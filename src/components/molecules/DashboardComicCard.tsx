import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Heart, Loader2, Sparkles, CheckCircle2, Circle, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useEnrichment } from '@/hooks/useEnrichment';

export interface DashboardComic {
  id: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  pageCount: number;
  year?: number | null;
  issue?: number | null;
  rating?: number | null;
  progress?: {
    lastPage: number;
    totalPages: number;
  } | null;
}

interface DashboardComicCardProps {
  comic: DashboardComic;
  onNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  isFav?: boolean;
  onToggleFav?: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function DashboardComicCard({
  comic,
  onNotification,
  isFav,
  onToggleFav,
  isEditMode,
  isSelected,
  onToggleSelect
}: DashboardComicCardProps) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: comic.id, disabled: !isEditMode });

  const enrichment = useEnrichment();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progressPercent = comic.progress
    ? (comic.progress.lastPage / comic.progress.totalPages) * 100
    : 0;

  const handleClick = () => {
    if (isEditMode) {
      onToggleSelect?.(comic.id);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFav?.();
  };

  const handleEnrich = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      onNotification?.(`Enriching "${comic.title}"...`, 'info');
      await enrichment.mutateAsync(comic.id);
      onNotification?.(`Metadata updated for "${comic.title}"!`, 'success');
    } catch {
      onNotification?.(`Failed to enrich "${comic.title}"`, 'error');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role={isEditMode ? "button" : "region"}
      tabIndex={isEditMode ? 0 : undefined}
      className={`group relative flex flex-col bg-white rounded-3xl overflow-hidden shadow-lg border transition-all cursor-pointer ${
        isDragging ? 'opacity-50 scale-105 z-50' : 'hover:shadow-xl hover:-translate-y-1'
      } ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-neutral-100 hover:border-neutral-700'
      }`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (isEditMode && (e.key === 'Enter' || e.key === ' ')) {
          handleClick();
        }
      }}
    >
      {isEditMode && (
        <div className="absolute top-2 left-2 z-30">
          {isSelected ? (
            <CheckCircle2 size={24} className="text-blue-500 fill-white" />
          ) : (
            <Circle size={24} className="text-neutral-200 fill-white" />
          )}
        </div>
      )}

      {!isEditMode && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFavoriteClick}
            className="p-1.5 bg-white/90 rounded-xl shadow-lg hover:bg-white text-neutral-600 transition-all"
            title={isFav ? "Remove from favorites" : "Add to favorites"}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart size={16} className={`${isFav ? 'text-red-500 fill-red-500' : ''}`} />
          </button>
          
          <button
            onClick={handleEnrich}
            disabled={enrichment.isPending}
            className="p-1.5 bg-white/90 rounded-xl shadow-lg hover:bg-white text-blue-500 transition-all disabled:opacity-50"
            title="Enrich metadata"
            aria-label="Enrich metadata"
          >
            {enrichment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          </button>
        </div>
      )}

      <div className="block relative aspect-[2/3] bg-neutral-800 w-full overflow-hidden">
        {comic.coverUrl ? (
          <img src={comic.coverUrl} alt={comic.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
            <LayoutGrid size={48} strokeWidth={1} />
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-900/50">
          <div className="h-full bg-blue-500 rounded-r-full" style={{ width: `${progressPercent}%` }} />
        </div>
        {!isEditMode && (
          <Link href={`/reader/${comic.id}`} className="absolute inset-0 z-10" onClick={(e) => e.stopPropagation()} aria-label={`Read ${comic.title}`} />
        )}
      </div>

      <div className="p-4 flex flex-col gap-1">
        <h3 className="text-sm font-bold text-neutral-800 line-clamp-1 mb-0.5">{comic.title}</h3>
        <p className="text-xs text-neutral-500 font-medium">{comic.author || 'Unknown Artist'}</p>
      </div>
    </div>
  );
}
