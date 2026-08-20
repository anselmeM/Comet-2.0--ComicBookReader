'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';

import { getErrorMessage } from '@/lib/errors';

import {
  ChevronLeft,
  ChevronRight,
  Folder,
  BookOpen,
  Edit3,
  Plus,
  Trash2,
  X,
  LayoutGrid,
  List,
  Eye,
  AlignLeft,
  Columns,
  BookOpenCheck,
  Check,
  AlertCircle,
  CloudOff,
  Circle,
} from 'lucide-react';

import { DashboardComic, DashboardComicCard } from '@/components/molecules/DashboardComicCard';

import {
  DndContext,
  closestCenter,
  SensorDescriptor,
  SensorOptions,
  useDroppable,
} from '@dnd-kit/core';

import { useCollections } from '@/hooks/useCollections';

import { CreateCollectionModal } from './collections/CreateCollectionModal';

import { DroppableCollectionButton } from './collections/DroppableCollectionButton';

import { CollectionsToolbar } from './collections/CollectionsToolbar';

import { CollectionsGrid } from './collections/CollectionsGrid';

import { useStats } from '@/hooks/useStats';

import { useResetProgress, useUpdateProgress } from '@/hooks/useLibrary';

import { motion, AnimatePresence } from 'framer-motion';

import { Flame, Clock, Trophy } from 'lucide-react';

interface CollectionsViewProps {
  comics: DashboardComic[];

  toggleFavorite: (id: string, currentStatus: boolean) => void;

  onRestoreFromCloud?: (id: string, title: string) => Promise<void>;
  onSyncToCloud?: (id: string) => Promise<void>;
  setActiveView: (view: string) => void;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  sensors: SensorDescriptor<SensorOptions>[];
}

export const CollectionsView = ({
  comics,
  toggleFavorite,
  onRestoreFromCloud,
  onSyncToCloud,

  setActiveView,

  isEditMode,

  setIsEditMode,

  selectedIds,

  setSelectedIds,

  pagination,

  onPageChange,

  triggerNotification,

  sensors,
}: CollectionsViewProps) => {
  const { collections, createCollection, deleteCollection, useCollection, addItem } =
    useCollections();

  const { data: userStats, isLoading: isStatsLoading } = useStats();

  const resetProgress = useResetProgress();

  const updateProgress = useUpdateProgress();

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: currentCollectionData, isLoading: isLoadingCollection } = useCollection(
    selectedCollectionId && !selectedCollectionId.startsWith('smart-')
      ? selectedCollectionId
      : null,
  );

  // Layout View States

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [density, setDensity] = useState<'compact' | 'default' | 'large'>('default');

  const [showPageCount, setShowPageCount] = useState<boolean>(true);

  const [showYear, setShowYear] = useState<boolean>(true);

  const [showProgress, setShowProgress] = useState<boolean>(true);

  // Resize Listener to calculate columns dynamically for virtual grid

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format time spent

  const formatTime = (seconds: number) => {
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;

    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const activeComics = useMemo(() => {
    if (!selectedCollectionId) return comics;

    if (selectedCollectionId === 'smart-unread') {
      return comics.filter(
        (c) => !c.progress || c.progress.readStatus === 'UNREAD' || c.progress.lastPage === 0,
      );
    }

    if (selectedCollectionId === 'smart-inprogress') {
      return comics.filter((c) => c.progress && c.progress.readStatus === 'READING');
    }

    if (selectedCollectionId === 'smart-completed') {
      return comics.filter(
        (c) =>
          c.progress &&
          (c.progress.readStatus === 'COMPLETED' ||
            c.progress.lastPage === c.progress.totalPages - 1),
      );
    }

    if (selectedCollectionId === 'smart-recent') {
      return [...comics].sort(
        (a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime(),
      );
    }

    const collectionComics = currentCollectionData?.comics || [];

    return collectionComics.map((c) => ({
      ...c,

      author: c.author || (c as { series?: string }).series || undefined,
    })) as DashboardComic[];
  }, [selectedCollectionId, currentCollectionData, comics]);

  const handleDragEnd = async (event: import('@dnd-kit/core').DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const comicId = active.id as string;

    const targetId = over.id as string;

    const comic = comics.find((c) => c.id === comicId);

    if (!comic) return;

    if (targetId.startsWith('col-')) {
      const collectionId = targetId.replace('col-', '');

      try {
        await addItem.mutateAsync({ collectionId, comicId });

        triggerNotification('Added comic to collection', 'success');
      } catch (err) {
        triggerNotification(getErrorMessage(err) || 'Failed to add comic to collection', 'error');
      }
    } else if (targetId === 'smart-unread') {
      try {
        await resetProgress.mutateAsync(comicId);

        triggerNotification('Progress reset (marked as unread)', 'success');
      } catch (err) {
        triggerNotification(getErrorMessage(err) || 'Failed to update progress', 'error');
      }
    } else if (targetId === 'smart-inprogress') {
      try {
        await updateProgress.mutateAsync({
          comicId,

          lastPage: 1,

          totalPages: comic.pageCount,

          readStatus: 'READING',
        });

        triggerNotification('Comic marked as in progress', 'success');
      } catch (err) {
        triggerNotification(getErrorMessage(err) || 'Failed to update progress', 'error');
      }
    } else if (targetId === 'smart-completed') {
      try {
        await updateProgress.mutateAsync({
          comicId,

          lastPage: comic.pageCount - 1,

          totalPages: comic.pageCount,

          readStatus: 'COMPLETED',
        });

        triggerNotification('Comic marked as completed!', 'success');
      } catch (err) {
        triggerNotification(getErrorMessage(err) || 'Failed to update progress', 'error');
      }
    }
  };

  // Virtualization Scroll Container Ref

  // Calculate Grid Column count dynamically

  // Virtual Grid Rows calculations

  // Row height estimate based on density

  // Row Virtualizer for Grid view

  // Row Virtualizer for List view

  const handleDeleteCollection = async (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete the collection "${name}"? The comics will remain in your library.`,
      )
    ) {
      try {
        await deleteCollection.mutateAsync(id);

        if (selectedCollectionId === id) setSelectedCollectionId(null);

        triggerNotification(`Collection "${name}" deleted`, 'success');
      } catch {
        triggerNotification('Failed to delete collection', 'error');
      }
    }
  };

  // Sync Status Badge for List row

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-12 animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveView('dashboard')}
              className="p-4 bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-all text-neutral-400 hover:text-comet-accent shadow-sm"
            >
              <ChevronLeft size={24} />
            </button>

            <div>
              <h2 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tighter italic">
                My Collections
              </h2>

              <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">
                Manage and organize your library
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <Plus size={18} /> New Collection
          </button>
        </div>

        {/* Collection Stats / Gamification */}

        {!selectedCollectionId && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-4 sm:p-6 rounded-[2rem] shadow-lg shadow-orange-500/20 flex flex-col justify-between text-white relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Flame size={120} />
              </div>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                  <Flame size={20} className="text-white" />
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-white/80">
                  Reading Streak
                </span>
              </div>

              <div>
                <h4 className="text-3xl md:text-4xl font-black tracking-tighter">
                  {isStatsLoading ? '-' : userStats?.streak || 0}{' '}
                  <span className="text-xl opacity-80">days</span>
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col justify-between group hover:border-comet-accent/40 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-comet-accent/10 rounded-xl flex items-center justify-center text-comet-accent group-hover:scale-110 transition-transform">
                  <BookOpen size={20} />
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
                  Pages Read
                </span>
              </div>

              <div>
                <h4 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tighter">
                  {isStatsLoading ? '-' : (userStats?.pagesFlipped || 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col justify-between group hover:border-green-200 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Trophy size={20} />
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
                  Comics Finished
                </span>
              </div>

              <div>
                <h4 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tighter">
                  {isStatsLoading ? '-' : userStats?.comicsFinished || 0}
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col justify-between group hover:border-purple-200 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <Clock size={20} />
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
                  Time Spent
                </span>
              </div>

              <div>
                <h4 className="text-3xl md:text-4xl font-black text-neutral-900 tracking-tighter">
                  {isStatsLoading ? '-' : formatTime(userStats?.timeSpentSeconds || 0)}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs (Smart & Custom Collections) */}

        <div className="space-y-6 pt-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-3">
              Smart Collections (Drag here to categorize)
            </span>

            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible md:gap-4">
              <DroppableCollectionButton
                id="all-comics"
                isActive={selectedCollectionId === null}
                onClick={() => setSelectedCollectionId(null)}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${!selectedCollectionId ? 'bg-comet-accent/100 text-white shadow-lg shadow-comet-accent/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                All Comics
              </DroppableCollectionButton>

              <DroppableCollectionButton
                id="smart-unread"
                isActive={selectedCollectionId === 'smart-unread'}
                onClick={() => setSelectedCollectionId('smart-unread')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === 'smart-unread' ? 'bg-comet-accent/100 text-white shadow-lg shadow-comet-accent/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                Unread
              </DroppableCollectionButton>

              <DroppableCollectionButton
                id="smart-inprogress"
                isActive={selectedCollectionId === 'smart-inprogress'}
                onClick={() => setSelectedCollectionId('smart-inprogress')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === 'smart-inprogress' ? 'bg-comet-accent/100 text-white shadow-lg shadow-comet-accent/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                In Progress
              </DroppableCollectionButton>

              <DroppableCollectionButton
                id="smart-completed"
                isActive={selectedCollectionId === 'smart-completed'}
                onClick={() => setSelectedCollectionId('smart-completed')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === 'smart-completed' ? 'bg-comet-accent/100 text-white shadow-lg shadow-comet-accent/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                Completed
              </DroppableCollectionButton>

              <DroppableCollectionButton
                id="smart-recent"
                isActive={selectedCollectionId === 'smart-recent'}
                onClick={() => setSelectedCollectionId('smart-recent')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === 'smart-recent' ? 'bg-comet-accent/100 text-white shadow-lg shadow-comet-accent/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                Recently Added
              </DroppableCollectionButton>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-3">
              Custom Collections
            </span>

            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible md:gap-4">
              {collections.map((col) => (
                <div key={col.id} className="relative group">
                  <DroppableCollectionButton
                    id={`col-${col.id}`}
                    isActive={selectedCollectionId === col.id}
                    onClick={() => setSelectedCollectionId(col.id)}
                    className={`px-6 py-3 pr-12 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === col.id ? 'bg-comet-accent/100 text-white shadow-lg shadow-comet-accent/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
                  >
                    {col.name}

                    <span className={`ml-2 text-[10px] opacity-60`}>
                      ({col._count?.items || 0})
                    </span>
                  </DroppableCollectionButton>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      handleDeleteCollection(col.id, col.name);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {collections.length === 0 && (
                <p className="text-xs text-neutral-400 font-bold italic py-2">
                  No custom collections created yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <CollectionsToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          density={density}
          onDensityChange={setDensity}
          showPageCount={showPageCount}
          onShowPageCountChange={setShowPageCount}
          showYear={showYear}
          onShowYearChange={setShowYear}
          showProgress={showProgress}
          onShowProgressChange={setShowProgress}
        />

        {/* Collection Grid / List View */}

        <section className="space-y-8 pt-4">
          <div className="flex items-center justify-between border-t border-neutral-100 pt-12">
            <div className="flex items-center gap-6">
              <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">
                {selectedCollectionId ? currentCollectionData?.name : 'All Comics'}
              </h3>

              <button
                onClick={() => {
                  setIsEditMode(!isEditMode);

                  setSelectedIds([]);
                }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-comet-accent/100 text-white shadow-lg shadow-comet-accent/20' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}
              >
                <Edit3 size={14} /> {isEditMode ? 'Finish' : 'Edit'}
              </button>
            </div>

            {!selectedCollectionId && pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-1 border border-neutral-200 shadow-sm">
                <button
                  onClick={() => onPageChange?.(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 hover:bg-white rounded-xl disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="text-xs font-black px-3 text-neutral-800">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => onPageChange?.(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 hover:bg-white rounded-xl disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <CollectionsGrid
            comics={activeComics}
            isLoadingCollection={!!selectedCollectionId && isLoadingCollection}
            viewMode={viewMode}
            density={density}
            showPageCount={showPageCount}
            showYear={showYear}
            showProgress={showProgress}
            isEditMode={isEditMode}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            toggleFavorite={toggleFavorite}
            onRestoreFromCloud={onRestoreFromCloud}
            onSyncToCloud={onSyncToCloud}
            triggerNotification={triggerNotification}
          />
        </section>

        {/* Create Modal */}

        <CreateCollectionModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </DndContext>
  );
};
