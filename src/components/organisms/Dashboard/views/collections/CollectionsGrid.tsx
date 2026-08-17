'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import Link from 'next/link';

import { useVirtualizer } from '@tanstack/react-virtual';

import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

import { CheckCircle2, Circle, BookOpen, Check, Loader2 } from 'lucide-react';

import { DashboardComic, DashboardComicCard } from '@/components/molecules/DashboardComicCard';

export type CollectionsViewMode = 'grid' | 'list';

export type CollectionsDensity = 'compact' | 'default' | 'large';

interface CollectionsGridProps {
  comics: DashboardComic[];

  isLoadingCollection: boolean;

  viewMode: CollectionsViewMode;

  density: CollectionsDensity;

  showPageCount: boolean;

  showYear: boolean;

  showProgress: boolean;

  isEditMode: boolean;

  selectedIds: string[];

  setSelectedIds: (fn: (prev: string[]) => string[]) => void;

  toggleFavorite: (id: string, currentStatus: boolean) => void;

  onRestoreFromCloud?: (id: string, title: string) => Promise<void>;

  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

function renderListSyncBadge(syncStatus?: string) {
  const badgeBase =
    'flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm';

  if (syncStatus === 'SYNCED') {
    return (
      <div className={`${badgeBase} bg-green-500/10 text-green-600 border border-green-500/20`}>
        <Check size={9} strokeWidth={3} />

        <span>Synced</span>
      </div>
    );
  }

  if (syncStatus === 'PENDING') {
    return (
      <div
        className={`${badgeBase} bg-amber-500/10 text-amber-600 border border-amber-500/20 animate-pulse`}
      >
        <Loader2 size={9} className="animate-spin" />

        <span>Pending</span>
      </div>
    );
  }

  return (
    <div className={`${badgeBase} bg-neutral-500/10 text-neutral-500 border border-neutral-200`}>
      <span>Local</span>
    </div>
  );
}

/**

 * The virtualized collection grid/list (tanstack-virtual + dnd sortable).

 * Owns the window-size tracking and virtualization metrics; the parent owns

 * the filtered `comics` list and the selection state.

 */

export const CollectionsGrid = ({
  comics,

  isLoadingCollection,

  viewMode,

  density,

  showPageCount,

  showYear,

  showProgress,

  isEditMode,

  selectedIds,

  setSelectedIds,

  toggleFavorite,

  onRestoreFromCloud,

  triggerNotification,
}: CollectionsGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columnsCount = useMemo(() => {
    if (windowWidth >= 1536) return density === 'large' ? 5 : density === 'compact' ? 7 : 6;

    if (windowWidth >= 1280) return density === 'large' ? 4 : density === 'compact' ? 6 : 5;

    if (windowWidth >= 1024) return density === 'large' ? 3 : density === 'compact' ? 5 : 4;

    if (windowWidth >= 768) return density === 'large' ? 2 : density === 'compact' ? 4 : 3;

    return density === 'large' ? 1 : density === 'compact' ? 3 : 2;
  }, [windowWidth, density]);

  const rowsCount = useMemo(() => {
    if (viewMode === 'list') return comics.length;

    return Math.ceil(comics.length / columnsCount);
  }, [comics.length, columnsCount, viewMode]);

  const estimatedRowHeight = useMemo(() => {
    if (viewMode === 'list') return 64;

    return density === 'compact' ? 240 : density === 'large' ? 440 : 340;
  }, [viewMode, density]);

  const rowVirtualizer = useVirtualizer({
    count: rowsCount,

    getScrollElement: () => parentRef.current,

    estimateSize: () => estimatedRowHeight,

    overscan: 5,
  });

  const rowVirtualizerList = useVirtualizer({
    count: comics.length,

    getScrollElement: () => parentRef.current,

    estimateSize: () => 64,

    overscan: 10,
  });

  if (isLoadingCollection) {
    return (
      <div className="py-20 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-comet-accent border-t-transparent rounded-full animate-spin" />

        <p className="text-sm font-black text-neutral-300 uppercase tracking-widest">
          Loading Collection...
        </p>
      </div>
    );
  }

  if (comics.length === 0) {
    return (
      <div className="col-span-full py-40 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-neutral-100">
        <BookOpen size={64} className="mx-auto mb-4 text-neutral-200" />

        <h4 className="text-xl font-black text-neutral-400 uppercase tracking-tighter italic">
          This collection is empty
        </h4>

        <p className="text-neutral-400 mt-2">
          Add comics to this collection using the bulk action menu.
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div
        ref={parentRef}
        className="overflow-y-auto pr-2 h-[65vh] scrollbar-thin rounded-2xl relative"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,

            width: '100%',

            position: 'relative',
          }}
        >
          <SortableContext items={comics.map((c) => c.id)} strategy={rectSortingStrategy}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const rowIndex = virtualItem.index;

              const startIdx = rowIndex * columnsCount;

              const rowComics = comics.slice(startIdx, startIdx + columnsCount);

              return (
                <div
                  key={virtualItem.key}
                  data-index={rowIndex}
                  ref={rowVirtualizer.measureElement}
                  className="absolute top-0 left-0 w-full"
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,

                    paddingBottom: '24px',
                  }}
                >
                  <div
                    className="grid gap-6"
                    style={{
                      gridTemplateColumns: `repeat(${columnsCount}, minmax(0, 1fr))`,
                    }}
                  >
                    {rowComics.map((comic) => (
                      <DashboardComicCard
                        key={comic.id}
                        comic={comic}
                        onNotification={triggerNotification}
                        onRestoreFromCloud={onRestoreFromCloud}
                        isFav={comic.isFavorite}
                        onToggleFav={() => toggleFavorite(comic.id, !!comic.isFavorite)}
                        isEditMode={isEditMode}
                        isSelected={selectedIds.includes(comic.id)}
                        onToggleSelect={(id) =>
                          setSelectedIds((prev) =>
                            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
                          )
                        }
                        density={density}
                        showPageCount={showPageCount}
                        showYear={showYear}
                        showProgress={showProgress}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </SortableContext>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="overflow-y-auto pr-2 h-[65vh] border border-neutral-150 rounded-[2rem] bg-white shadow-inner scrollbar-thin relative"
    >
      <div className="min-w-[800px] w-full">
        <div className="sticky top-0 bg-neutral-900 text-white flex items-center px-6 py-4 font-bold text-xs uppercase tracking-widest z-30 select-none">
          <div className="w-[8%]">Select</div>

          <div className="w-[37%]">Title</div>

          <div className="w-[20%]">Series / Author</div>

          <div className="w-[10%] text-center">Pages</div>

          <div className="w-[10%] text-center">Year</div>

          <div className="w-[15%] flex justify-end pr-4">Sync Status</div>
        </div>

        <div
          style={{
            height: `${rowVirtualizerList.getTotalSize()}px`,

            width: '100%',

            position: 'relative',
          }}
        >
          {rowVirtualizerList.getVirtualItems().map((virtualItem) => {
            const comic = comics[virtualItem.index];

            if (!comic) return null;

            const isSelected = selectedIds.includes(comic.id);

            const progressPercent = comic.progress
              ? Math.round((comic.progress.lastPage / comic.progress.totalPages) * 100)
              : 0;

            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={rowVirtualizerList.measureElement}
                className={`absolute top-0 left-0 w-full flex items-center px-6 py-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                  isSelected ? 'bg-comet-accent/6' : ''
                }`}
                style={{
                  transform: `translateY(${virtualItem.start}px)`,

                  height: `${virtualItem.size}px`,
                }}
              >
                <div className="w-[8%]">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedIds((prev) =>
                        prev.includes(comic.id)
                          ? prev.filter((i) => i !== comic.id)
                          : [...prev, comic.id],
                      )
                    }
                    className="focus:outline-none"
                  >
                    {isSelected ? (
                      <CheckCircle2 size={20} className="text-comet-accent fill-white" />
                    ) : (
                      <Circle size={20} className="text-neutral-200 fill-white" />
                    )}
                  </button>
                </div>

                <div className="w-[37%] flex items-center gap-3">
                  <div className="relative w-8 h-12 rounded-md overflow-hidden bg-neutral-100 shrink-0 border border-neutral-250">
                    {comic.coverUrl ? (
                      <Image
                        src={comic.coverUrl}
                        alt={comic.title}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <BookOpen size={16} className="text-neutral-400 absolute inset-0 m-auto" />
                    )}
                  </div>

                  <div className="flex flex-col truncate">
                    <Link
                      href={`/reader/${comic.id}`}
                      className="font-bold text-sm text-neutral-800 hover:text-comet-accent truncate"
                    >
                      {comic.title}
                    </Link>

                    {showProgress && progressPercent > 0 && (
                      <span className="text-[10px] text-comet-accent font-extrabold uppercase mt-0.5">
                        {progressPercent === 100 ? 'Read' : `${progressPercent}% Complete`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-[20%] text-sm font-semibold text-neutral-600 truncate">
                  {comic.author || 'Unknown'}
                </div>

                <div className="w-[10%] text-center text-sm font-semibold text-neutral-500">
                  {showPageCount ? comic.pageCount : '-'}
                </div>

                <div className="w-[10%] text-center text-sm font-semibold text-neutral-500">
                  {showYear && comic.year ? comic.year : '-'}
                </div>

                <div className="w-[15%] flex justify-end items-center gap-2 pr-4">
                  {renderListSyncBadge(comic.syncStatus)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
