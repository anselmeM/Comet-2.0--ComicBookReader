'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Heart, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  LayoutGrid, 
  Edit3, 
  Cloud, 
  CloudDownload, 
  CloudOff,
  Trash2,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEnrichment } from '@/hooks/useEnrichment';
import { useDeleteComic } from '@/hooks/useLibrary';
import { MetadataModal } from '../organisms/Dashboard/views/MetadataModal';
import { PremiumModal } from '../atoms/PremiumModal';

export interface DashboardComic {
  id: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  pageCount: number;
  year?: number | null;
  issue?: number | null;
  rating?: number | null;
  isFavorite?: boolean;
  syncStatus?: 'LOCAL' | 'PENDING' | 'SYNCED' | 'ERROR';
  isLocallyAvailable?: boolean;
  progress?: {
    lastPage: number;
    totalPages: number;
  } | null;
}

interface DashboardComicCardProps {
  comic: DashboardComic;
  variant?: 'dashboard' | 'standard';
  onNotification?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onRestoreFromCloud?: (id: string, title: string) => Promise<void>;
  isFav?: boolean;
  onToggleFav?: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

/**
 * Unified Comic Card component with multiple style variants.
 * Handles both the interactive dashboard view and the standard library view.
 */
export function DashboardComicCard({
  comic,
  variant = 'dashboard',
  onNotification,
  onRestoreFromCloud,
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
  } = useSortable({ id: comic.id, disabled: !isEditMode || variant === 'standard' });

  const enrichment = useEnrichment();
  const deleteMutation = useDeleteComic();
  const [isMetadataOpen, setIsMetadataOpen] = React.useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = React.useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progressPercent = comic.progress
    ? Math.round((comic.progress.lastPage / comic.progress.totalPages) * 100)
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
    e.preventDefault();
    try {
      if (onNotification) onNotification(`Enriching "${comic.title}"...`, 'info');
      await enrichment.mutateAsync(comic.id);
      if (onNotification) onNotification(`Metadata updated for "${comic.title}"!`, 'success');
    } catch (err: any) {
      if (err.message?.includes('Premium feature') || err.message?.includes('PREMIUM_REQUIRED')) {
        setIsPremiumModalOpen(true);
      } else {
        if (onNotification) onNotification(err.message || `Failed to enrich "${comic.title}"`, 'error');
        else console.error('Manual enrichment failed:', err);
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm(`Are you sure you want to delete "${comic.title}"?`)) {
      deleteMutation.mutate(comic.id);
    }
  };

  const handleMetadataClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMetadataOpen(true);
  };

  const handleRestoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRestoreFromCloud) {
      if (onNotification) onNotification(`Starting restoration of "${comic.title}"...`, 'info');
      onRestoreFromCloud(comic.id, comic.title);
    }
  };

  // Variant: Standard (Dark mode library style)
  if (variant === 'standard') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="group relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-lg hover:border-blue-500/50 transition-all cursor-pointer"
      >
        <Link href={`/reader/${comic.id}`} className="block">
          <div className="aspect-[2/3] relative bg-neutral-800 overflow-hidden">
            {comic.coverUrl ? (
              <Image
                src={comic.coverUrl}
                alt={comic.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-600">
                <BookOpen size={48} strokeWidth={1} />
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/40">
              <div className="h-full bg-blue-500" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleEnrich}
                disabled={enrichment.isPending}
                className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:text-blue-400 hover:bg-black/80 transition-all"
                title="Fetch metadata"
              >
                {enrichment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
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
        
        <PremiumModal 
          isOpen={isPremiumModalOpen} 
          onClose={() => setIsPremiumModalOpen(false)} 
          featureName="Automatic Metadata Enrichment"
        />
      </motion.div>
    );
  }

  // Variant: Dashboard (Original white style)
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

          <button
            onClick={handleMetadataClick}
            className="p-1.5 bg-white/90 rounded-xl shadow-lg hover:bg-white text-neutral-600 transition-all"
            title="Edit details"
            aria-label="Edit details"
          >
            <Edit3 size={16} />
          </button>

          {comic.syncStatus === 'SYNCED' && !comic.isLocallyAvailable && (
            <button
              onClick={handleRestoreClick}
              className="p-1.5 bg-blue-500 rounded-xl shadow-lg hover:bg-blue-600 text-white transition-all animate-pulse"
              title="Restore from Cloud"
              aria-label="Restore from Cloud"
            >
              <CloudDownload size={16} />
            </button>
          )}
        </div>
      )}

      {!isEditMode && comic.syncStatus === 'SYNCED' && (
        <div className="absolute bottom-14 right-2 z-20 p-1.5 bg-blue-500/80 backdrop-blur-md rounded-lg text-white shadow-sm border border-white/20">
          <Cloud size={12} />
        </div>
      )}

      {comic.syncStatus === 'SYNCED' && !comic.isLocallyAvailable && (
        <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center gap-4">
           <CloudOff size={40} className="text-white/40" />
           <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Missing Locally<br/><span className="text-blue-400">Cloud Sync Available</span></p>
           <button 
             onClick={handleRestoreClick}
             className="bg-blue-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
           >
             Download Now
           </button>
        </div>
      )}

      <div className="block relative aspect-[2/3] bg-neutral-800 w-full overflow-hidden">
        {comic.coverUrl ? (
          <Image 
            src={comic.coverUrl} 
            alt={comic.title} 
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105" 
          />
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

      <MetadataModal 
        comic={comic} 
        isOpen={isMetadataOpen} 
        onClose={() => setIsMetadataOpen(false)} 
      />

      <PremiumModal 
        isOpen={isPremiumModalOpen} 
        onClose={() => setIsPremiumModalOpen(false)} 
        featureName="Automatic Metadata Enrichment"
      />
    </div>
  );
}

/**
 * Loading skeleton for the Comic Card.
 */
export function ComicCardSkeleton({ variant = 'dashboard' }: { variant?: 'dashboard' | 'standard' }) {
  if (variant === 'standard') {
    return (
      <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-lg animate-pulse">
        <div className="aspect-[2/3] bg-neutral-800" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-neutral-800 rounded-md w-3/4" />
          <div className="flex justify-between items-center">
            <div className="h-3 bg-neutral-800 rounded-md w-1/3" />
            <div className="h-3 bg-neutral-800 rounded-md w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-neutral-100 animate-pulse">
      <div className="aspect-[2/3] bg-neutral-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-neutral-100 rounded-md w-3/4" />
        <div className="h-3 bg-neutral-50 rounded-md w-1/2" />
      </div>
    </div>
  );
}
