'use client';

import React, { useState } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import {
  Search, 
  Settings, 
  LogOut,
  ChevronDown,
  Filter,
  UploadCloud,
  Bell,
  AlignRight,
  SortAsc,
  BookOpen,
  Hash,
  X,
  Clock,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import Link from 'next/link';
import { useNotification } from '@/components/atoms/Toast';
import { useFavorites } from '@/hooks/useFavorites';

// Modular Imports
import { DashboardComic } from '@/components/molecules/DashboardComicCard';
import { navItems, favouriteHeroes, topRatedComics } from './mockData';
import { DashboardView } from './views/DashboardView';
import { CollectionsView } from './views/CollectionsView';
import { HistoryView } from './views/HistoryView';
import { FavouritesView } from './views/FavouritesView';
import { FavouriteHeroesView } from './views/FavouriteHeroesView';

interface DashboardLayoutProps {
  comics: DashboardComic[];
  onComicUpload?: (comic: DashboardComic) => void;
  onFileSelect?: (file: File) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  yearStart?: number | null;
  onYearStartChange?: (year: number | null) => void;
  yearEnd?: number | null;
  onYearEndChange?: (year: number | null) => void;
  readStatus?: string;
  onReadStatusChange?: (status: string) => void;
}

const bottomNavItems = [
  { name: 'Settings', icon: Settings, id: 'settings' },
  { name: 'Log out', icon: LogOut, id: 'logout' },
];

export function DashboardLayout(props: DashboardLayoutProps) {
  const { 
    comics, 
    onFileSelect,
    onBulkDelete,
    pagination,
    onPageChange,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange,
    yearStart,
    onYearStartChange,
    yearEnd,
    onYearEndChange,
    readStatus,
    onReadStatusChange
  } = props;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { isFavorite, toggleFavorite } = useFavorites();
  const { triggerNotification } = useNotification();
  const { data: session } = useSession();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleNavClick = (viewId: string) => {
    if (viewId === 'logout') { 
      nextAuthSignOut({ callbackUrl: '/login' }); 
      return; 
    }
    setActiveView(viewId);
  };

  const viewProps = {
    comics,
    isFavorite,
    toggleFavorite,
    setActiveView,
    isEditMode,
    setIsEditMode,
    selectedIds,
    setSelectedIds,
    triggerNotification,
    sensors,
    pagination,
    onPageChange,
    favouriteHeroes,
    topRatedComics
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView {...viewProps} />;
      case 'collections':
        return <CollectionsView {...viewProps} />;
      case 'favourites':
        return <FavouritesView {...viewProps} />;
      case 'history':
        return <HistoryView comics={comics} setActiveView={setActiveView} />;
      case 'favourite-heroes':
        return <FavouriteHeroesView favouriteHeroes={favouriteHeroes} setActiveView={setActiveView} />;
      default:
        return (
          <div className="text-center py-40">
            <Clock size={80} className="mx-auto mb-6 text-neutral-100" />
            <h4 className="text-4xl font-black text-neutral-200 uppercase tracking-tighter italic opacity-50 underline decoration-comet-accent">Preparing {activeView}...</h4>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100 flex items-center justify-center p-4 md:p-12 font-sans text-neutral-800 selection:bg-blue-500 selection:text-white">
      <div className="bg-white w-full max-w-[1400px] h-[850px] rounded-[2.5rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.1)] flex overflow-hidden border border-white relative">
        
        {/* Bulk Action Fab */}
        <AnimatePresence>
          {isEditMode && selectedIds.length > 0 && (
            <motion.div initial={{ y: 120, x: '-50%' }} animate={{ y: 0, x: '-50%' }} exit={{ y: 120, x: '-50%' }} className="absolute bottom-10 left-1/2 z-[100] bg-neutral-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-12 border border-white/10 backdrop-blur-2xl">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Selection</span>
                 <span className="text-xl font-black tracking-tighter">{selectedIds.length} items</span>
               </div>
               <div className="flex gap-4">
                 <button onClick={async () => { if(confirm(`Delete ${selectedIds.length} items?`)) await onBulkDelete?.(selectedIds); setSelectedIds([]); setIsEditMode(false); }} className="bg-red-500 hover:bg-red-600 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 active:scale-95 flex items-center gap-3">Delete Forever</button>
                 <button onClick={() => { setIsEditMode(false); setSelectedIds([]); }} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><X size={24} /></button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside initial={false} animate={{ width: isSidebarOpen ? 320 : 120 }} className="bg-white border-r border-neutral-50 flex flex-col py-14 shrink-0 transition-all duration-500">
           <div className="px-14 mb-20 flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 font-black rotate-6 hover:rotate-0 transition-transform cursor-pointer text-2xl">G</div>
             {isSidebarOpen && <h1 className="font-black text-3xl tracking-tighter italic">Geek</h1>}
           </div>
           
           <nav className="flex-1 px-8 space-y-4">
             {navItems.map(item => (
               <button 
                 key={item.id} 
                 onClick={() => handleNavClick(item.id)} 
                 title={!isSidebarOpen ? item.name : undefined}
                 aria-current={activeView === item.id ? 'page' : undefined}
                 className={`w-full flex items-center ${isSidebarOpen ? 'gap-5 px-6' : 'justify-center'} py-5 rounded-[1.8rem] font-bold text-lg transition-all ${activeView === item.id ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/40 translate-x-1' : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900'}`}
               >
                 <item.icon size={24} strokeWidth={2.5} className={activeView === item.id ? 'text-white' : ''} /> 
                 {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
               </button>
             ))}
           </nav>

           <div className="px-8 space-y-4 mt-auto border-t border-neutral-50 pt-10 pb-10">
             {bottomNavItems.map(item => (
               <button 
                 key={item.id} 
                 onClick={() => item.id === 'logout' ? nextAuthSignOut({ callbackUrl: '/login' }) : (window.location.href = '/settings')} 
                 title={!isSidebarOpen ? item.name : undefined}
                 aria-current={activeView === item.id ? 'page' : undefined}
                 className={`w-full flex items-center ${isSidebarOpen ? 'gap-5 px-6' : 'justify-center'} py-5 rounded-[1.8rem] font-bold text-lg text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 transition-all ${item.id === 'logout' ? 'hover:text-red-400' : ''}`}
               >
                 <item.icon size={24} strokeWidth={2.5} /> 
                 {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
               </button>
             ))}
           </div>
        </motion.aside>

        <main className="flex-1 flex flex-col bg-[#FAFBFF] overflow-hidden relative">
          <header className="h-32 px-12 flex items-center justify-between bg-white/40 backdrop-blur-3xl shrink-0 border-b border-neutral-50 shrink-0 z-50">
            <div className="flex items-center gap-6 flex-1 max-w-2xl">
              <motion.div 
                initial={false}
                whileHover={{ width: 320 }}
                className="relative h-12 w-12 flex items-center bg-[#0F172A] rounded-2xl overflow-hidden cursor-pointer group shadow-sm transition-all duration-300 ease-in-out"
                style={{ width: 48 }}
              >
                <div className="absolute left-0 w-12 h-12 flex items-center justify-center shrink-0">
                  <Search className="text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search comics, heroes, collections..." 
                  value={searchQuery || ''} 
                  onChange={e => onSearchChange?.(e.target.value)} 
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-sm font-bold text-white placeholder:text-slate-400 outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  aria-label="Search comics, heroes, collections"
                />
              </motion.div>
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                aria-label="Toggle filters"
                aria-expanded={showFilters}
                className={`p-5 rounded-[1.5rem] border-2 transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300'}`}
              >
                <Filter size={24} />
              </button>
            </div>

            <div className="flex items-center gap-6 ml-10">
               <button onClick={() => fileInputRef.current?.click()} className="bg-black text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"><UploadCloud size={20} strokeWidth={2.5} /> Upload</button>
               <input ref={fileInputRef} type="file" accept=".cbz,.cbr" className="hidden" onChange={async (e) => { if (e.target.files?.[0]) await onFileSelect?.(e.target.files[0]); }} />
               
               <div className="h-12 w-px bg-neutral-100 mx-2" />

               <button 
                 className="p-5 bg-white border border-neutral-100 text-neutral-300 rounded-2xl hover:text-blue-500 transition-all relative shadow-sm"
                 aria-label="Notifications"
               >
                 <Bell size={24} />
                 <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" aria-hidden="true" />
               </button>

               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-5 bg-white border border-neutral-100 text-neutral-300 rounded-2xl hover:text-neutral-900 transition-all shadow-sm"><AlignRight size={24} /></button>

               <div className="flex items-center gap-4 ml-4">
                 <div className="flex flex-col items-end hidden md:flex">
                   <span className="text-sm font-black tracking-tighter text-neutral-900">{session?.user?.name || 'Melissa Doe'}</span>
                   <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Premium User</span>
                 </div>
                 <Link href="/settings" className="shrink-0 group">
                   {session?.user?.image ? (
                     <img 
                       src={session.user.image} 
                       alt={session?.user?.name || 'User profile'} 
                       className="w-11 h-11 rounded-full object-cover border border-slate-200 group-hover:border-blue-500 transition-colors" 
                     />
                   ) : (
                     <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black text-sm border border-slate-200 group-hover:border-blue-500 transition-colors">
                       {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'M'}
                     </div>
                   )}
                 </Link>
               </div>
            </div>
          </header>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white border-b border-neutral-100 overflow-hidden shrink-0 z-40"
              >
                <div className="px-12 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Sort By */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                      <SortAsc size={12} /> Sort By
                    </label>
                    <div className="relative">
                      <select 
                        value={sortBy || 'recent'} 
                        onChange={(e) => onSortChange?.(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 px-4 text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                      >
                        <option value="recent">Recently Read</option>
                        <option value="added">Recently Added</option>
                        <option value="title_asc">Title (A-Z)</option>
                        <option value="title_desc">Title (Z-A)</option>
                        <option value="year_desc">Year (Newest)</option>
                        <option value="year_asc">Year (Oldest)</option>
                        <option value="pages_desc">Pages (Most)</option>
                        <option value="pages_asc">Pages (Least)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-300 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Read Status */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                      <BookOpen size={12} /> Status
                    </label>
                    <div className="flex bg-neutral-50 p-1 rounded-xl border border-neutral-100">
                      {['all', 'unread', 'reading', 'completed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => onReadStatusChange?.(status)}
                          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${
                            (readStatus || 'all') === status 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-neutral-400 hover:text-neutral-600'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year Range */}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                      <Calendar size={12} /> Release Period
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
                        <input 
                          type="number" 
                          placeholder="From Year" 
                          value={yearStart || ''} 
                          onChange={(e) => onYearStartChange?.(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="w-4 h-px bg-neutral-200" />
                      <div className="relative flex-1">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
                        <input 
                          type="number" 
                          placeholder="To Year" 
                          value={yearEnd || ''} 
                          onChange={(e) => onYearEndChange?.(e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 pl-10 pr-4 text-sm font-bold text-neutral-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          onYearStartChange?.(null);
                          onYearEndChange?.(null);
                          onReadStatusChange?.('all');
                          onSortChange?.('recent');
                          onSearchChange?.('');
                        }}
                        className="p-3 bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 rounded-xl transition-all"
                        title="Reset all filters"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex-1 overflow-y-auto px-12 py-12 scroll-smooth">
            <AnimatePresence mode="wait">
              <motion.div key={activeView} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
