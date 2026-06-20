import React from 'react';
import { ChevronLeft, Users } from 'lucide-react';
import Image from 'next/image';

import { FavouriteHero } from '@/lib/__mocks__/dashboard';

interface FavouriteHeroesViewProps {
  favouriteHeroes: FavouriteHero[];
  setActiveView: (view: string) => void;
}

const HERO_GLOWS: Record<string, string> = {
  'Spider-Man': 'group-hover:shadow-[0_0_35px_rgba(239,68,68,0.8)] group-hover:border-red-500',
  Hulk: 'group-hover:shadow-[0_0_35px_rgba(34,197,94,0.8)] group-hover:border-green-500',
  'Iron Man': 'group-hover:shadow-[0_0_35px_rgba(147,51,234,0.8)] group-hover:border-purple-600',
  Wolverine: 'group-hover:shadow-[0_0_35px_rgba(250,204,21,0.8)] group-hover:border-yellow-400',
  'Captain America':
    'group-hover:shadow-[0_0_35px_rgba(29,78,216,0.8)] group-hover:border-blue-700',
  Thor: 'group-hover:shadow-[0_0_35px_rgba(56,189,248,0.8)] group-hover:border-sky-400',
  'Black Widow': 'group-hover:shadow-[0_0_35px_rgba(17,24,39,0.8)] group-hover:border-gray-950',
  'Black Panther':
    'group-hover:shadow-[0_0_35px_rgba(38,38,38,0.8)] group-hover:border-neutral-800',
};

export const FavouriteHeroesView = ({
  favouriteHeroes,
  setActiveView,
}: FavouriteHeroesViewProps) => (
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
            Favourite Heroes
          </h2>
          <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">
            Discover your top rated characters
          </p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
      {favouriteHeroes.map((hero) => (
        <div key={hero.id} className="group flex flex-col items-center gap-6 cursor-pointer">
          <div
            className={`relative w-32 h-32 md:w-40 md:h-40 rounded-full p-2 overflow-hidden transition-all duration-500 group-hover:-translate-y-3 group-hover:scale-105 border-2 border-transparent bg-neutral-100/50 ${HERO_GLOWS[hero.name] || 'group-hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)]'}`}
          >
            <Image
              src={hero.image}
              alt={hero.name}
              width={160}
              height={160}
              className="w-full h-full rounded-full object-cover opacity-95 group-hover:opacity-100 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-lg font-black text-neutral-800 group-hover:text-blue-500 transition-colors tracking-tight">
              {hero.name}
            </h4>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              {hero.count} Comics
            </p>
          </div>
        </div>
      ))}

      {/* Add Hero Placeholder */}
      <div className="flex flex-col items-center gap-6 cursor-pointer group">
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-neutral-50 flex items-center justify-center border-4 border-dashed border-neutral-200 transition-all group-hover:border-blue-500 group-hover:bg-blue-50 group-hover:text-blue-500">
          <Users
            size={48}
            strokeWidth={1.5}
            className="text-neutral-300 group-hover:text-blue-500 transition-colors"
          />
        </div>
        <div className="text-center">
          <h4 className="text-lg font-black text-neutral-300 group-hover:text-blue-500 transition-colors tracking-tight">
            Add Hero
          </h4>
        </div>
      </div>
    </div>
  </div>
);
