import React from 'react';
import { Heart, BookOpen, ArrowRight, Users } from 'lucide-react';
import { DashboardComic, DashboardComicCard } from '@/components/molecules/DashboardComicCard';
import { CircularProgress } from '@/components/molecules/CircularProgress';
import { DndContext, closestCenter, SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Edit3, ChevronLeft, ChevronRight } from 'lucide-react';
import { FavouriteHero, TopRatedComic } from '../mockData';
import Image from 'next/image';

interface DashboardViewProps {
  comics: DashboardComic[];
  topRatedComics: TopRatedComic[];
  favouriteHeroes: FavouriteHero[];
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

export const DashboardView = ({
  comics,
  topRatedComics,
  favouriteHeroes,
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
}: DashboardViewProps) => {
  const featuredComic = comics[0];
  const continueComic = comics.find(c => (c.progress?.lastPage ?? 0) > 0) || comics[1] || comics[0];
  const isFeaturedFav = featuredComic ? isFavorite(featuredComic.id) : false;
  const isContinueFav = continueComic ? isFavorite(continueComic.id) : false;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Hero Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Featured Hero Card */}
        <section className="lg:col-span-8 relative h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl">
          <div className="absolute inset-0">
            <Image 
              src="https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=1200&q=80" 
              alt="Featured Hero"
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-1000" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>
          
          {featuredComic && (
            <button 
              onClick={() => toggleFavorite(featuredComic.id)}
              className="absolute top-8 right-8 z-20 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all group/fav"
              aria-label={isFeaturedFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={24} className={`${isFeaturedFav ? 'text-red-500 fill-red-500' : 'text-white'}`} />
            </button>
          )}

          <div className="absolute inset-0 p-12 flex flex-col justify-end">
            <div className="space-y-4 max-w-xl">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Featured Author: Nick Spencer</span>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter">
                the Amazing Spider-Man Vol. 1: <br /> Back To Basics
              </h2>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-10 py-4 rounded-full font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/30 active:scale-95 w-fit mt-4">
                Read Now
              </button>
            </div>
          </div>
        </section>

        {/* Continue Reading Widget */}
        <section className="lg:col-span-4 bg-[#0F172A] rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          {continueComic && (
            <button 
              onClick={() => toggleFavorite(continueComic.id)}
              className="absolute top-8 right-8 z-20 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              aria-label={isContinueFav ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={18} className={`${isContinueFav ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
            </button>
          )}

          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <BookOpen size={120} strokeWidth={1} />
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Continue Reading</span>
            <h3 className="text-2xl font-black tracking-tighter leading-tight">
              {continueComic?.title || 'No active reading'}
            </h3>
          </div>

          <div className="flex items-center gap-8 mt-8">
            <CircularProgress value={continueComic?.progress ? Math.round((continueComic.progress.lastPage / continueComic.progress.totalPages) * 100) : 0} />
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter italic">{continueComic?.progress ? Math.round((continueComic.progress.lastPage / continueComic.progress.totalPages) * 100) : 0}%</span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progress</span>
            </div>
          </div>

          <button 
            className="mt-8 flex items-center justify-between w-full group/btn"
            onClick={() => continueComic && (window.location.href = `/reader/${continueComic.id}`)}
          >
            <span className="text-sm font-black uppercase tracking-widest">Resume reading</span>
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover/btn:bg-blue-500 transition-all">
              <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
            </div>
          </button>
        </section>
      </div>

      {/* Favourite Heroes Section */}
      <section className="space-y-8">
        <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">Your Favourite Heroes</h3>
        <div className="flex flex-wrap gap-8">
          {favouriteHeroes.slice(0, 4).map(hero => (
            <div key={hero.id} className="group flex flex-col items-center gap-4 cursor-pointer">
              <div className={`relative w-24 h-24 rounded-full ${hero.color} p-1 overflow-hidden transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl`}>
                <Image 
                  src={hero.image} 
                  alt={hero.name} 
                  width={96}
                  height={96}
                  className="rounded-full object-cover mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity" 
                />
              </div>
              <span className="text-sm font-black text-neutral-400 group-hover:text-blue-500 transition-colors uppercase tracking-widest text-[10px]">{hero.name}</span>
            </div>
          ))}
          <div 
            className="flex flex-col items-center gap-4 cursor-pointer group"
            onClick={() => setActiveView('favourite-heroes')}
          >
            <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center border-2 border-dashed border-neutral-200 transition-all group-hover:border-blue-500 group-hover:bg-blue-50 group-hover:text-blue-500">
              <Users size={32} strokeWidth={1.5} className="text-neutral-300 group-hover:text-blue-500" />
            </div>
            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest group-hover:text-blue-500 transition-colors">View All</span>
          </div>
        </div>
      </section>

      {/* Top Rated Comics Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">Top Rated Comics</h3>
          <button className="text-xs font-black uppercase tracking-widest text-blue-500 hover:underline">View All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {topRatedComics.map(comic => (
            <div key={comic.id} className="group flex flex-col gap-4">
              <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-lg border border-neutral-100 relative group-hover:shadow-2xl transition-all">
                <Image 
                  src={comic.coverUrl} 
                  alt={comic.title} 
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-black text-blue-600 group-hover:underline decoration-2 underline-offset-2 cursor-pointer line-clamp-1">{comic.title}</h4>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{comic.author}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collection Grid */}
      <section className="space-y-8">
        <div className="flex items-center justify-between border-t border-neutral-100 pt-12">
           <div className="flex items-center gap-6">
              <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">My Collection</h3>
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
