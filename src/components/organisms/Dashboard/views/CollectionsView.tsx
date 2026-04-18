import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Folder, BookOpen, CheckCircle2, Edit3, Plus } from 'lucide-react';
import { DashboardComic, DashboardComicCard } from '@/components/molecules/DashboardComicCard';
import { DndContext, closestCenter, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

interface CollectionsViewProps {
  comics: DashboardComic[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
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
  isFavorite,
  toggleFavorite,
  setActiveView,
  isEditMode,
  setIsEditMode,
  selectedIds,
  setSelectedIds,
  pagination,
  onPageChange,
  triggerNotification,
  sensors
}: CollectionsViewProps) => {
  const stats = useMemo(() => {
    const totalPages = comics.reduce((acc, c) => acc + c.pageCount, 0);
    const completedComics = comics.filter(c => c.progress && c.progress.lastPage === c.progress.totalPages - 1).length;
    return { totalPages, completedComics };
  }, [comics]);

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
            <h2 className="text-4xl font-black text-neutral-900 tracking-tighter italic">My Collections</h2>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">Manage and organize your library</p>
          </div>
        </div>
        <button className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
          <Plus size={18} /> New Collection
        </button>
      </div>

      {/* Collection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
            <Folder size={32} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Total Comics</span>
            <h4 className="text-3xl font-black text-neutral-900 tracking-tighter">{comics.length}</h4>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500">
            <BookOpen size={32} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Pages Stored</span>
            <h4 className="text-3xl font-black text-neutral-900 tracking-tighter">{stats.totalPages.toLocaleString()}</h4>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
            <CheckCircle2 size={32} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Finished</span>
            <h4 className="text-3xl font-black text-neutral-900 tracking-tighter">{stats.completedComics}</h4>
          </div>
        </div>
      </div>

      {/* Collection Grid */}
      <section className="space-y-8 pt-8">
        <div className="flex items-center justify-between border-t border-neutral-100 pt-12">
          <div className="flex items-center gap-6">
              <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">All Comics</h3>
              <button onClick={() => { setIsEditMode(!isEditMode); setSelectedIds([]); }} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>
                <Edit3 size={14} /> {isEditMode ? 'Finish' : 'Edit'}
              </button>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-1 border border-neutral-200 shadow-sm">
                <button onClick={() => onPageChange?.(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 hover:bg-white rounded-xl disabled:opacity-20 transition-all"><ChevronLeft size={16} /></button>
                <span className="text-xs font-black px-3 text-neutral-800">{pagination.page} / {pagination.totalPages}</span>
                <button onClick={() => onPageChange?.(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-2 hover:bg-white rounded-xl disabled:opacity-20 transition-all"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={() => {}}>
          <SortableContext items={comics.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-8">
              {comics.map(comic => (
                <DashboardComicCard 
                  key={comic.id} comic={comic} onNotification={triggerNotification}
                  isFav={isFavorite(comic.id)} onToggleFav={() => toggleFavorite(comic.id)}
                  isEditMode={isEditMode} isSelected={selectedIds.includes(comic.id)} 
                  onToggleSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  );
};
