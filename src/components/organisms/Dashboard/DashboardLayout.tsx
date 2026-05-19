'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { useNotification } from '@/components/atoms/Toast';
import { useFavorites } from '@/hooks/useFavorites';
import { ErrorBoundary } from '@/components/atoms/ErrorBoundary';

// Modular Imports
import { DashboardComic } from '@/components/molecules/DashboardComicCard';
import { favouriteHeroes } from '@/lib/__mocks__/dashboard';
import { DashboardView } from './views/DashboardView';
import { CollectionsView } from './views/CollectionsView';
import { HistoryView } from './views/HistoryView';
import { FavouritesView } from './views/FavouritesView';
import { FavouriteHeroesView } from './views/FavouriteHeroesView';
import { FriendsView } from './views/FriendsView';
import { useCollections } from '@/hooks/useCollections';
import { useNotifications } from '@/hooks/useNotifications';
import { useSubscription } from '@/hooks/useSubscription';

// Sub-components
import { DashboardSidebar } from './components/DashboardSidebar';
import { DashboardHeader } from './components/DashboardHeader';
import { SearchFilterBar } from './components/SearchFilterBar';
import { SearchResultsView } from './components/SearchResultsView';

interface DashboardLayoutProps {
  comics: DashboardComic[];
  onComicUpload?: (comic: DashboardComic) => void;
  onFileSelect?: (file: File) => Promise<void>;
  onRestoreFromCloud?: (id: string, title: string) => Promise<void>;
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

export function DashboardLayout(props: DashboardLayoutProps) {
  const { 
    comics, 
    onFileSelect,
    onRestoreFromCloud,
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
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { toggleFavorite } = useFavorites();
  const { collections, addItem } = useCollections();
  const { handleCheckout, handlePortal, isLoading: isSubscriptionLoading } = useSubscription();
  const { data: notificationData } = useNotifications();
  const { triggerNotification } = useNotification();
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const unreadCount = notificationData?.unreadCount || 0;

  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return null;
    // Note: globalSearch import moved to top-level if needed, but it was used in layout.
    // I will add it back to imports.
    return require('@/lib/search').globalSearch(searchQuery, { comics: comics as any, collections: collections as any });
  }, [searchQuery, comics, collections]);

  const topRated = useMemo(() => {
    return [...comics]
      .filter(c => (c.rating || 0) > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6) || comics.slice(0, 6);
  }, [comics]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleNavClick = (viewId: string) => {
    if (viewId === 'pricing') {
      router.push('/pricing');
      return;
    }
    if (viewId === 'settings') {
      router.push('/settings');
      return;
    }
    setActiveView(viewId);
  };

  const handleResetFilters = () => {
    onYearStartChange?.(null);
    onYearEndChange?.(null);
    onReadStatusChange?.('all');
    onSortChange?.('recent');
    onSearchChange?.('');
  };

  const viewProps = {
    comics,
    toggleFavorite,
    onRestoreFromCloud,
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
    topRatedComics: topRated
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView {...viewProps} />;
      case 'collections': return <CollectionsView {...viewProps} />;
      case 'favourites': return <FavouritesView {...viewProps} />;
      case 'history': return <HistoryView comics={comics} setActiveView={setActiveView} />;
      case 'favourite-heroes': return <FavouriteHeroesView favouriteHeroes={favouriteHeroes} setActiveView={setActiveView} />;
      case 'friends': return <FriendsView setActiveView={setActiveView} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-pink-100 flex items-center justify-center p-4 md:p-12 font-sans text-neutral-800 selection:bg-blue-500 selection:text-white">
      <div className="bg-white w-full max-w-[1400px] h-[850px] rounded-[2.5rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.1)] flex overflow-hidden border border-white relative">
        
        <DashboardSidebar 
          isOpen={isSidebarOpen} 
          activeView={activeView} 
          onNavClick={handleNavClick}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 flex flex-col bg-[#FAFBFF] overflow-hidden relative">
          <DashboardHeader 
            searchQuery={searchQuery || ''}
            onSearchChange={onSearchChange || (() => {})}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onUploadClick={() => fileInputRef.current?.click()}
            unreadCount={unreadCount}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            session={session}
            handlePortal={handlePortal}
            handleCheckout={handleCheckout}
            isSubscriptionLoading={isSubscriptionLoading}
          />
          <input ref={fileInputRef} type="file" accept=".cbz,.cbr" className="hidden" onChange={async (e) => { if (e.target.files?.[0]) await onFileSelect?.(e.target.files[0]); }} />

          <AnimatePresence>
            {showFilters && (
              <SearchFilterBar 
                sortBy={sortBy}
                onSortChange={onSortChange || (() => {})}
                readStatus={readStatus}
                onReadStatusChange={onReadStatusChange || (() => {})}
                yearStart={yearStart}
                onYearStartChange={onYearStartChange || (() => {})}
                yearEnd={yearEnd}
                onYearEndChange={onYearEndChange || (() => {})}
                onReset={handleResetFilters}
              />
            )}
          </AnimatePresence>
          
          <div className="flex-1 overflow-y-auto px-12 py-12 scroll-smooth">
            <AnimatePresence mode="wait">
              {searchResults ? (
                <SearchResultsView 
                  results={searchResults}
                  onClearSearch={() => onSearchChange?.('')}
                  onSearchChange={onSearchChange || (() => {})}
                  setActiveView={setActiveView}
                  isEditMode={isEditMode}
                  selectedIds={selectedIds}
                  onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                  onToggleFavorite={toggleFavorite}
                />
              ) : (
                <motion.div key={activeView} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                  <ErrorBoundary key={activeView} name={activeView}>
                    {renderActiveView()}
                  </ErrorBoundary>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
