import React, { useMemo } from 'react';

import { getErrorMessage } from '@/lib/errors';

import {
  Heart,
  BookOpen,
  ArrowRight,
  Users,
  Edit3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { DashboardComic, DashboardComicCard } from '@/components/molecules/DashboardComicCard';

import { CircularProgress } from '@/components/molecules/CircularProgress';

import { DndContext, closestCenter, SensorDescriptor, SensorOptions } from '@dnd-kit/core';

import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

import { FavouriteHero, TopRatedComic, heroAvatarClass } from '@/lib/dashboard';

import Image from 'next/image';

import { useEnrichment } from '@/hooks/useEnrichment';

import Link from 'next/link';

import { useRouter } from 'next/navigation';

import { PremiumModal } from '@/components/atoms/PremiumModal';

interface DashboardViewProps {
  comics: DashboardComic[];

  topRatedComics: TopRatedComic[];

  favouriteHeroes: FavouriteHero[];

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

export const DashboardView = ({
  comics,

  topRatedComics,

  favouriteHeroes,

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
}: DashboardViewProps) => {
  const router = useRouter();

  const enrichment = useEnrichment();

  const [isPremiumModalOpen, setIsPremiumModalOpen] = React.useState(false);

  // Logic for Dynamic Hero: Find the most read series

  const seriesStats = useMemo(() => {
    const stats: Record<string, { count: number; lastRead: number; comic: DashboardComic }> = {};

    comics.forEach((comic) => {
      if (comic.author && comic.progress) {
        if (!stats[comic.author]) {
          stats[comic.author] = { count: 0, lastRead: 0, comic };
        }

        stats[comic.author].count += 1;

        stats[comic.author].comic = comic;
      }
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [comics]);

  const dynamicFeaturedComic = seriesStats.length > 0 ? seriesStats[0].comic : comics[0];

  const featuredComic = dynamicFeaturedComic;

  const continueComic =
    comics.find((c) => c.progress !== null && c.progress !== undefined) || comics[0];

  const isFeaturedFav = !!featuredComic?.isFavorite;

  const isContinueFav = !!continueComic?.isFavorite;

  const handleEnrichFeatured = async () => {
    if (!featuredComic) return;

    try {
      triggerNotification(`Enriching "${featuredComic.title}"...`, 'info');

      await enrichment.mutateAsync(featuredComic.id);

      triggerNotification(`Metadata updated for "${featuredComic.title}"!`, 'success');
    } catch (err) {
      if (
        getErrorMessage(err)?.includes('Premium feature') ||
        getErrorMessage(err)?.includes('PREMIUM_REQUIRED')
      ) {
        setIsPremiumModalOpen(true);
      } else {
        triggerNotification(`Failed to enrich "${featuredComic.title}"`, 'error');
      }
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Hero Grid Section */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
        {/* Featured Hero Card */}

        <section className="lg:col-span-8 relative h-[300px] md:h-[400px] rounded-3xl md:rounded-[2.5rem] overflow-hidden group shadow-2xl">
          <div className="absolute inset-0">
            <Image
              src={
                featuredComic?.coverUrl ||
                'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=1200&q=80'
              }
              alt="Featured Hero"
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-1000"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          </div>

          {featuredComic && (
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-20 flex gap-2">
              <button
                onClick={handleEnrichFeatured}
                disabled={enrichment.isPending}
                className="p-3 md:p-4 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 hover:bg-white/20 transition-all group/enrich disabled:opacity-50"
                title="Enrich metadata"
              >
                {enrichment.isPending ? (
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </button>

              <button
                onClick={() => toggleFavorite(featuredComic.id, isFeaturedFav)}
                className="p-3 md:p-4 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 hover:bg-white/20 transition-all group/fav"
                aria-label={isFeaturedFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={`w-5 h-5 md:w-6 md:h-6 ${isFeaturedFav ? 'text-red-500 fill-red-500' : 'text-white'}`}
                />
              </button>
            </div>
          )}

          <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end">
            <div className="space-y-2 md:space-y-4 max-w-xl">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-comet-accent/70">
                {featuredComic?.author
                  ? `Featured Series: ${featuredComic.author}`
                  : `Featured Author: Nick Spencer`}
              </span>

              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter">
                {featuredComic?.title || 'the Amazing Spider-Man Vol. 1: Back To Basics'}
              </h2>

              {featuredComic && (
                <Link
                  href={`/reader/${featuredComic.id}`}
                  className="bg-comet-accent/100 hover:bg-comet-accent text-white px-6 md:px-10 py-3 md:py-4 rounded-full font-black text-[10px] md:text-sm uppercase tracking-widest transition-all shadow-xl shadow-comet-accent/30 active:scale-95 w-fit mt-2 md:mt-4 flex items-center gap-2"
                >
                  Read Now
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Continue Reading Widget */}

        <section className="lg:col-span-4 bg-[#0F172A] rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          {continueComic && (
            <button
              onClick={() => toggleFavorite(continueComic.id, isContinueFav)}
              className="absolute top-6 right-6 md:top-8 md:right-8 z-20 p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-lg md:rounded-xl transition-all"
              aria-label={isContinueFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-4 h-4 md:w-4 md:h-4 ${isContinueFav ? 'text-red-500 fill-red-500' : 'text-slate-400'}`}
              />
            </button>
          )}

          <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <BookOpen className="w-24 h-24 md:w-32 md:h-32" strokeWidth={1} />
          </div>

          <div className="space-y-1 md:space-y-2 mt-4 md:mt-0">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Continue Reading
            </span>

            <h3 className="text-xl md:text-2xl font-black tracking-tighter leading-tight pr-10">
              {continueComic?.title || 'No active reading'}
            </h3>
          </div>

          <div className="flex items-center gap-6 md:gap-8 mt-6 md:mt-8">
            <CircularProgress
              value={
                continueComic?.progress
                  ? Math.round(
                      (continueComic.progress.lastPage / continueComic.progress.totalPages) * 100,
                    )
                  : 0
              }
            />

            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-black tracking-tighter italic">
                {continueComic?.progress
                  ? Math.round(
                      (continueComic.progress.lastPage / continueComic.progress.totalPages) * 100,
                    )
                  : 0}
                %
              </span>

              <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                Progress
              </span>
            </div>
          </div>

          <button
            className="mt-6 md:mt-8 flex items-center justify-between w-full group/btn"
            onClick={() => continueComic && router.push(`/reader/${continueComic.id}`)}
          >
            <span className="text-xs md:text-sm font-black uppercase tracking-widest">
              Resume reading
            </span>

            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center group-hover/btn:bg-comet-accent/100 transition-all">
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-1 transition-transform" />
            </div>
          </button>
        </section>
      </div>

      {/* Favourite Heroes Section */}

      <section className="space-y-4 md:space-y-8">
        <h3 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tighter italic">
          Your Favourite Heroes
        </h3>

        <div className="flex flex-wrap gap-4 md:gap-8 justify-between md:justify-start">
          {favouriteHeroes.slice(0, 4).map((hero) => (
            <div
              key={hero.id}
              className="group flex flex-col items-center gap-2 md:gap-4 cursor-pointer"
            >
              <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-full p-[2px] md:p-[3px] overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-105 border-2 border-transparent bg-neutral-100/50 group-hover:shadow-xl">
                {hero.image ? (
                  <Image
                    src={hero.image}
                    alt={hero.name}
                    width={96}
                    height={96}
                    className="rounded-full object-cover opacity-95 group-hover:opacity-100 transition-all duration-500 w-full h-full"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center font-black text-xl md:text-3xl ${heroAvatarClass(hero.name)}`}
                  >
                    {hero.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <span className="text-[9px] md:text-[10px] font-black text-neutral-400 group-hover:text-comet-accent transition-colors uppercase tracking-widest text-center">
                {hero.name}
              </span>
            </div>
          ))}

          <div
            className="flex flex-col items-center gap-2 md:gap-4 cursor-pointer group"
            onClick={() => setActiveView('favourite-heroes')}
          >
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-neutral-100 flex items-center justify-center border-2 border-dashed border-neutral-200 transition-all group-hover:border-comet-accent group-hover:bg-comet-accent/10 group-hover:text-comet-accent">
              <Users
                className="w-6 h-6 md:w-8 md:h-8 text-neutral-300 group-hover:text-comet-accent"
                strokeWidth={1.5}
              />
            </div>

            <span className="text-[9px] md:text-[10px] font-black text-neutral-300 uppercase tracking-widest group-hover:text-comet-accent transition-colors">
              View All
            </span>
          </div>
        </div>
      </section>

      {/* Top Rated Comics Grid */}

      <section className="space-y-4 md:space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tighter italic">
            Top Rated Comics
          </h3>

          <button className="text-[10px] md:text-xs font-black uppercase tracking-widest text-comet-accent hover:underline">
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
          {topRatedComics.map((comic) => (
            <div key={comic.id} className="group flex flex-col gap-2 md:gap-4">
              <div className="aspect-[2/3] rounded-xl md:rounded-2xl overflow-hidden shadow-md md:shadow-lg border border-neutral-100 relative group-hover:shadow-2xl transition-all">
                <Image
                  src={
                    comic.coverUrl ||
                    'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&q=80'
                  }
                  alt={comic.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-comet-accent/0 group-hover:bg-comet-accent/20 transition-all" />
              </div>

              <div className="flex flex-col gap-0.5 md:gap-1">
                <h4 className="text-xs md:text-sm font-black text-comet-accent group-hover:underline decoration-2 underline-offset-2 cursor-pointer line-clamp-1">
                  {comic.title}
                </h4>

                <p className="text-[9px] md:text-[11px] font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
                  {comic.author}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collection Grid */}

      <section className="space-y-4 md:space-y-8">
        <div className="flex items-center justify-between border-t border-neutral-100 pt-8 md:pt-12">
          <div className="flex items-center gap-4 md:gap-6">
            <h3 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tighter italic">
              My Collection
            </h3>

            <button
              onClick={() => {
                setIsEditMode(!isEditMode);

                setSelectedIds([]);
              }}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-comet-accent/100 text-white shadow-lg shadow-comet-accent/20' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'}`}
            >
              <Edit3 className="w-3 h-3 md:w-3.5 md:h-3.5" /> {isEditMode ? 'Finish' : 'Edit'}
            </button>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-1 border border-neutral-200 shadow-sm">
              <button
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 md:p-2 hover:bg-white rounded-xl disabled:opacity-20 transition-all"
              >
                <ChevronLeft className="w-4 h-4 md:w-4 md:h-4" />
              </button>

              <span className="text-[10px] md:text-xs font-black px-2 md:px-3 text-neutral-800">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 md:p-2 hover:bg-white rounded-xl disabled:opacity-20 transition-all"
              >
                <ChevronRight className="w-4 h-4 md:w-4 md:h-4" />
              </button>
            </div>
          )}
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={() => {}}>
          <SortableContext items={comics.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-8">
              {comics.map((comic) => (
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
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        featureName="Automatic Metadata Enrichment"
      />
    </div>
  );
};
