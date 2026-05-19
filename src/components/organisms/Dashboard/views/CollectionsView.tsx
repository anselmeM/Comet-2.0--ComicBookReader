import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Folder, BookOpen, CheckCircle2, Edit3, Plus, Trash2, X } from 'lucide-react';
import { DashboardComic, DashboardComicCard } from '@/components/molecules/DashboardComicCard';
import { DndContext, closestCenter, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useCollections } from '@/hooks/useCollections';
import { motion, AnimatePresence } from 'framer-motion';

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
  sensors
}: CollectionsViewProps) => {
  const { collections, createCollection, deleteCollection, useCollection } = useCollections();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  const { data: currentCollectionData, isLoading: isLoadingCollection } = useCollection(selectedCollectionId);

  const stats = useMemo(() => {
    const totalPages = comics.reduce((acc, c) => acc + c.pageCount, 0);
    const completedComics = comics.filter(c => c.progress && c.progress.lastPage === c.progress.totalPages - 1).length;
    return { totalPages, completedComics };
  }, [comics]);

  const activeComics = useMemo(() => {
    if (!selectedCollectionId) return comics;
    const collectionComics = currentCollectionData?.comics || [];
    // Ensure the comics have the required fields for DashboardComic
    return collectionComics.map(c => ({
      ...c,
      author: c.author || (c as any).series || undefined,
    })) as DashboardComic[];
  }, [selectedCollectionId, currentCollectionData, comics]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    try {
      await createCollection.mutateAsync({ name: newCollectionName });
      triggerNotification(`Collection "${newCollectionName}" created!`, 'success');
      setNewCollectionName('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      triggerNotification(err.message || 'Failed to create collection', 'error');
    }
  };

  const handleDeleteCollection = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the collection "${name}"? The comics will remain in your library.`)) {
      try {
        await deleteCollection.mutateAsync(id);
        if (selectedCollectionId === id) setSelectedCollectionId(null);
        triggerNotification(`Collection "${name}" deleted`, 'success');
      } catch {
        triggerNotification('Failed to delete collection', 'error');
      }
    }
  };

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
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
        >
          <Plus size={18} /> New Collection
        </button>
      </div>

      {/* Collection Stats */}
      {!selectedCollectionId && (
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
      )}

      {/* Collections Sidebar-like navigation */}
      <div className="flex flex-wrap gap-4 pt-4">
        <button 
          onClick={() => setSelectedCollectionId(null)}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${!selectedCollectionId ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
        >
          All Comics
        </button>
        {collections.map(col => (
          <div key={col.id} className="relative group">
            <button 
              onClick={() => setSelectedCollectionId(col.id)}
              className={`px-6 py-3 pr-12 rounded-xl font-bold text-sm transition-all ${selectedCollectionId === col.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-300'}`}
            >
              {col.name}
              <span className={`ml-2 text-[10px] opacity-60`}>({col._count?.items || 0})</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id, col.name); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Collection Grid */}
      <section className="space-y-8 pt-4">
        <div className="flex items-center justify-between border-t border-neutral-100 pt-12">
          <div className="flex items-center gap-6">
              <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">
                {selectedCollectionId ? currentCollectionData?.name : 'All Comics'}
              </h3>
              <button onClick={() => { setIsEditMode(!isEditMode); setSelectedIds([]); }} className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}>
                <Edit3 size={14} /> {isEditMode ? 'Finish' : 'Edit'}
              </button>
          </div>
          {!selectedCollectionId && pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-1 border border-neutral-200 shadow-sm">
                <button onClick={() => onPageChange?.(pagination.page - 1)} disabled={pagination.page <= 1} className="p-2 hover:bg-white rounded-xl disabled:opacity-20 transition-all"><ChevronLeft size={16} /></button>
                <span className="text-xs font-black px-3 text-neutral-800">{pagination.page} / {pagination.totalPages}</span>
                <button onClick={() => onPageChange?.(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="p-2 hover:bg-white rounded-xl disabled:opacity-20 transition-all"><ChevronRight size={16} /></button>
            </div>
          )}
        </div>

        {selectedCollectionId && isLoadingCollection ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black text-neutral-300 uppercase tracking-widest">Loading Collection...</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={() => {}}>
            <SortableContext items={activeComics.map(c => c.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-8">
                {activeComics.map(comic => (
                  <DashboardComicCard 
                    key={comic.id} comic={comic} onNotification={triggerNotification}
                    onRestoreFromCloud={onRestoreFromCloud}
                    isFav={comic.isFavorite} onToggleFav={() => toggleFavorite(comic.id, !!comic.isFavorite)}
                    isEditMode={isEditMode} isSelected={selectedIds.includes(comic.id)} 
                    onToggleSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                  />
                ))}
                {activeComics.length === 0 && (
                  <div className="col-span-full py-40 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-neutral-100">
                    <Folder size={64} className="mx-auto mb-4 text-neutral-200" />
                    <h4 className="text-xl font-black text-neutral-400 uppercase tracking-tighter italic">This collection is empty</h4>
                    <p className="text-neutral-400 mt-2">Add comics to this collection using the bulk action menu.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
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
                <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">New Collection</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-neutral-50 rounded-xl transition-all text-neutral-400"><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateCollection} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Collection Name</label>
                  <input 
                    type="text"
                    autoFocus
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
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
  );
};
