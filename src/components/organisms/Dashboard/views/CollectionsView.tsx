'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { getErrorMessage } from '@/lib/errors';
import {
  ChevronLeft,
  ChevronRight,
  Folder,
  BookOpen,
  CheckCircle2,
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
  Loader2,
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
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useCollections } from '@/hooks/useCollections';
import { useStats } from '@/hooks/useStats';
import { useResetProgress, useUpdateProgress } from '@/hooks/useLibrary';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Clock, Trophy } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import Link from 'next/link';

interface DroppableCollectionButtonProps {
  id: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

const DroppableCollectionButton = ({
  id,
  isActive,
  onClick,
  children,
  className = '',
}: DroppableCollectionButtonProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`${className} relative transition-all cursor-pointer ${
        isOver ? 'ring-4 ring-blue-500 ring-offset-2 scale-105 bg-blue-50/50' : ''
      }`}
    >
      {children}
    </button>
  );
};

interface CollectionsViewProps {
  comics: DashboardComic[];
  toggleFavorite: (id: string, currentStatus: boolean) => void;
  onRestoreFromCloud?: (id: string, title: string) => Promise<void>;
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
  const [newCollectionName, setNewCollectionName] = useState('');

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
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate Grid Column count dynamically
  const columnsCount = useMemo(() => {
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024 && windowWidth < 1536;

    if (density === 'compact') {
      if (isMobile) return 3;
      if (isTablet) return 5;
      if (isDesktop) return 7;
      return 9;
    } else if (density === 'large') {
      if (isMobile) return 1;
      if (isTablet) return 2;
      if (isDesktop) return 4;
      return 5;
    } else {
      if (isMobile) return 2;
      if (isTablet) return 3;
      if (isDesktop) return 5;
      return 7;
    }
  }, [windowWidth, density]);

  // Virtual Grid Rows calculations
  const rowsCount = useMemo(() => {
    return Math.ceil(activeComics.length / columnsCount);
  }, [activeComics.length, columnsCount]);

  // Row height estimate based on density
  const estimatedRowHeight = useMemo(() => {
    return density === 'compact' ? 240 : density === 'large' ? 440 : 340;
  }, [density]);

  // Row Virtualizer for Grid view
  const rowVirtualizer = useVirtualizer({
    count: rowsCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 3,
  });

  // Row Virtualizer for List view
  const rowVirtualizerList = useVirtualizer({
    count: activeComics.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 6,
  });

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      await createCollection.mutateAsync({ name: newCollectionName });
      triggerNotification(`Collection "${newCollectionName}" created!`, 'success');
      setNewCollectionName('');
      setIsCreateModalOpen(false);
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to create collection', 'error');
    }
  };

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
  const renderListSyncBadge = (syncStatus?: string) => {
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
          <span>Syncing</span>
        </div>
      );
    }
    if (syncStatus === 'ERROR') {
      return (
        <div className={`${badgeBase} bg-red-500/10 text-red-600 border border-red-500/20`}>
          <AlertCircle size={9} />
          <span>Error</span>
        </div>
      );
    }
    // LOCAL
    return (
      <div className={`${badgeBase} bg-zinc-100 text-zinc-500 border border-zinc-200`}>
        <CloudOff size={9} />
        <span>Local</span>
      </div>
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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

            <div className="bg-white p-4 sm:p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
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
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${!selectedCollectionId ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                All Comics
              </DroppableCollectionButton>
              <DroppableCollectionButton
                id="smart-unread"
                isActive={selectedCollectionId === 'smart-unread'}
                onClick={() => setSelectedCollectionId('smart-unread')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === 'smart-unread' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                Unread
              </DroppableCollectionButton>
              <DroppableCollectionButton
                id="smart-inprogress"
                isActive={selectedCollectionId === 'smart-inprogress'}
                onClick={() => setSelectedCollectionId('smart-inprogress')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === 'smart-inprogress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                In Progress
              </DroppableCollectionButton>
              <DroppableCollectionButton
                id="smart-completed"
                isActive={selectedCollectionId === 'smart-completed'}
                onClick={() => setSelectedCollectionId('smart-completed')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === 'smart-completed' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
              >
                Completed
              </DroppableCollectionButton>
              <DroppableCollectionButton
                id="smart-recent"
                isActive={selectedCollectionId === 'smart-recent'}
                onClick={() => setSelectedCollectionId('smart-recent')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === 'smart-recent' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
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
                    className={`px-6 py-3 pr-12 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === col.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
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

        {/* View & Settings Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-100/60 border border-neutral-150 p-4 rounded-3xl shadow-sm">
          {/* Left: View Mode Toggles */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-white rounded-xl border border-neutral-150 shadow-inner">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-neutral-400 hover:text-neutral-700'
                }`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>

            {/* Grid Density Controls */}
            {viewMode === 'grid' && (
              <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-neutral-150 shadow-inner">
                <button
                  onClick={() => setDensity('compact')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    density === 'compact'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Compact
                </button>
                <button
                  onClick={() => setDensity('default')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    density === 'default'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => setDensity('large')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    density === 'large'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  Large
                </button>
              </div>
            )}
          </div>

          {/* Right: Details Toggles */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <span className="text-[10px] text-neutral-400 font-black">Show Details:</span>
            <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-700 select-none">
              <input
                type="checkbox"
                checked={showPageCount}
                onChange={(e) => setShowPageCount(e.target.checked)}
                className="rounded border-neutral-300 text-blue-500 focus:ring-blue-500 cursor-pointer w-4 h-4"
              />
              <span>Pages</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-700 select-none">
              <input
                type="checkbox"
                checked={showYear}
                onChange={(e) => setShowYear(e.target.checked)}
                className="rounded border-neutral-300 text-blue-500 focus:ring-blue-500 cursor-pointer w-4 h-4"
              />
              <span>Year</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-700 select-none">
              <input
                type="checkbox"
                checked={showProgress}
                onChange={(e) => setShowProgress(e.target.checked)}
                className="rounded border-neutral-300 text-blue-500 focus:ring-blue-500 cursor-pointer w-4 h-4"
              />
              <span>Progress %</span>
            </label>
          </div>
        </div>

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
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}
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

          {selectedCollectionId && isLoadingCollection ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-black text-neutral-300 uppercase tracking-widest">
                Loading Collection...
              </p>
            </div>
          ) : activeComics.length === 0 ? (
            <div className="col-span-full py-40 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-neutral-100">
              <Folder size={64} className="mx-auto mb-4 text-neutral-200" />
              <h4 className="text-xl font-black text-neutral-400 uppercase tracking-tighter italic">
                This collection is empty
              </h4>
              <p className="text-neutral-400 mt-2">
                Add comics to this collection using the bulk action menu.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── VIRTUALIZED GRID VIEW ── */
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
                <SortableContext
                  items={activeComics.map((c) => c.id)}
                  strategy={rectSortingStrategy}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const rowIndex = virtualItem.index;
                    const startIdx = rowIndex * columnsCount;
                    const rowComics = activeComics.slice(startIdx, startIdx + columnsCount);

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
          ) : (
            /* ── VIRTUALIZED SPREADSHEET LIST VIEW ── */
            <div
              ref={parentRef}
              className="overflow-y-auto pr-2 h-[65vh] border border-neutral-150 rounded-[2rem] bg-white shadow-inner scrollbar-thin relative"
            >
              <div className="min-w-[800px] w-full">
                {/* Sticky Table Header */}
                <div className="sticky top-0 bg-neutral-900 text-white flex items-center px-6 py-4 font-bold text-xs uppercase tracking-widest z-30 select-none">
                  <div className="w-[8%]">Select</div>
                  <div className="w-[37%]">Title</div>
                  <div className="w-[20%]">Series / Author</div>
                  <div className="w-[10%] text-center">Pages</div>
                  <div className="w-[10%] text-center">Year</div>
                  <div className="w-[15%] flex justify-end pr-4">Sync Status</div>
                </div>

                {/* Virtualized Body */}
                <div
                  style={{
                    height: `${rowVirtualizerList.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizerList.getVirtualItems().map((virtualItem) => {
                    const comic = activeComics[virtualItem.index];
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
                          isSelected ? 'bg-blue-50/40' : ''
                        }`}
                        style={{
                          transform: `translateY(${virtualItem.start}px)`,
                          height: `${virtualItem.size}px`,
                        }}
                      >
                        {/* Checkbox Select */}
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
                              <CheckCircle2 size={20} className="text-blue-500 fill-white" />
                            ) : (
                              <Circle size={20} className="text-neutral-200 fill-white" />
                            )}
                          </button>
                        </div>

                        {/* Cover Image & Title */}
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
                              <BookOpen
                                size={16}
                                className="text-neutral-400 absolute inset-0 m-auto"
                              />
                            )}
                          </div>
                          <div className="flex flex-col truncate">
                            <Link
                              href={`/reader/${comic.id}`}
                              className="font-bold text-sm text-neutral-800 hover:text-blue-500 truncate"
                            >
                              {comic.title}
                            </Link>
                            {showProgress && progressPercent > 0 && (
                              <span className="text-[10px] text-blue-500 font-extrabold uppercase mt-0.5">
                                {progressPercent === 100 ? 'Read' : `${progressPercent}% Complete`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Author */}
                        <div className="w-[20%] text-sm font-semibold text-neutral-600 truncate">
                          {comic.author || 'Unknown'}
                        </div>

                        {/* Pages */}
                        <div className="w-[10%] text-center text-sm font-semibold text-neutral-500">
                          {showPageCount ? comic.pageCount : '-'}
                        </div>

                        {/* Year */}
                        <div className="w-[10%] text-center text-sm font-semibold text-neutral-500">
                          {showYear && comic.year ? comic.year : '-'}
                        </div>

                        {/* Sync Badge */}
                        <div className="w-[15%] flex justify-end items-center gap-2 pr-4">
                          {renderListSyncBadge(comic.syncStatus)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Create Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">
                    New Collection
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-2 hover:bg-neutral-50 rounded-xl transition-all text-neutral-400"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleCreateCollection} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                      Collection Name
                    </label>
                    <input
                      type="text"
                      autoFocus
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="e.g. Spider-Man Favorites"
                      className="w-full bg-neutral-50 border-none rounded-2xl py-4 px-6 text-base font-bold text-neutral-800 placeholder:text-neutral-300 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newCollectionName.trim() || createCollection.isPending}
                    className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20"
                  >
                    {createCollection.isPending ? 'Creating...' : 'Create Collection'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DndContext>
  );
};
