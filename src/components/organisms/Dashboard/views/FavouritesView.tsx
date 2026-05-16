import React, { useMemo } from 'react';
import { Heart, ChevronLeft } from 'lucide-react';
import { DashboardComic, DashboardComicCard } from '@/components/molecules/DashboardComicCard';
import { DndContext, closestCenter, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

interface FavouritesViewProps {
  comics: DashboardComic[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  setActiveView: (view: string) => void;
  isEditMode: boolean;
  selectedIds: string[];
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  triggerNotification: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  sensors: SensorDescriptor<SensorOptions>[];
}

export const FavouritesView = ({
  comics,
  isFavorite,
  toggleFavorite,
  setActiveView,
  isEditMode,
  selectedIds,
  setSelectedIds,
  triggerNotification,
  sensors
}: FavouritesViewProps) => {
  const favouritedComics = useMemo(() => 
    comics.filter(c => isFavorite(c.id)),
  [comics, isFavorite]);
  
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
            <h2 className="text-4xl font-black text-neutral-900 tracking-tighter italic">My Favourites</h2>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">Your curated collection of stories</p>
          </div>
        </div>
      </div>

      {favouritedComics.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={() => {}}>
          <SortableContext items={favouritedComics.map(c => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-8">
              {favouritedComics.map(comic => (
                <DashboardComicCard 
                  key={comic.id} comic={comic} onNotification={triggerNotification}
                  isFav={true} onToggleFav={() => toggleFavorite(comic.id)}
                  isEditMode={isEditMode} isSelected={selectedIds.includes(comic.id)} 
                  onToggleSelect={id => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-40 bg-white/50 rounded-[3rem] border-2 border-dashed border-neutral-100">
          <Heart size={80} className="mx-auto mb-6 text-neutral-200" strokeWidth={1} />
          <h4 className="text-2xl font-black text-neutral-400 uppercase tracking-tighter italic">No favourites yet</h4>
          <p className="text-neutral-400 mt-2">Start adding comics to your favourites to see them here!</p>
          <button 
            onClick={() => setActiveView('dashboard')}
            className="mt-8 bg-blue-500 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-500/20"
          >
            Explore Library
          </button>
        </div>
      )}
    </div>
  );
};
