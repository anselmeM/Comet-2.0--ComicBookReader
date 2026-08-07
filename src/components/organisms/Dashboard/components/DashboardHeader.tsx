'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, UploadCloud, Bell, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { NotificationDropdown } from '../../Notifications/NotificationDropdown';
import { SearchFilterBar } from './SearchFilterBar';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onUploadClick: () => void;
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  session: any;
  handlePortal: () => void;
  handleCheckout: () => void;
  isSubscriptionLoading: boolean;

  // Filter state props
  sortBy: string | undefined;
  onSortChange: (sort: string) => void;
  readStatus: string | undefined;
  onReadStatusChange: (status: string) => void;
  yearStart: number | null | undefined;
  onYearStartChange: (year: number | null) => void;
  yearEnd: number | null | undefined;
  onYearEndChange: (year: number | null) => void;
  isOfflineOnly?: boolean;
  onOfflineOnlyChange?: (val: boolean) => void;
  onResetFilters: () => void;
}

export function DashboardHeader({
  searchQuery,
  onSearchChange,
  showFilters,
  setShowFilters,
  onUploadClick,
  unreadCount,
  showNotifications,
  setShowNotifications,
  session,
  handlePortal,
  handleCheckout,
  isSubscriptionLoading,
  sortBy,
  onSortChange,
  readStatus,
  onReadStatusChange,
  yearStart,
  onYearStartChange,
  yearEnd,
  onYearEndChange,
  isOfflineOnly,
  onOfflineOnlyChange,
  onResetFilters,
}: DashboardHeaderProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showFilters && popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters, setShowFilters]);

  const activeBadges = useMemo(() => {
    const badges = [];

    if (sortBy && sortBy !== 'recent') {
      const sortLabels: Record<string, string> = {
        added: 'Added',
        title_asc: 'A-Z',
        title_desc: 'Z-A',
        year_desc: 'Year (New)',
        year_asc: 'Year (Old)',
        pages_desc: 'Pages (Most)',
        pages_asc: 'Pages (Least)',
        rating_desc: 'Rating (High)',
        rating_asc: 'Rating (Low)',
      };
      badges.push({
        id: 'sort',
        label: `Sort: ${sortLabels[sortBy] || sortBy}`,
        onClear: () => onSortChange('recent'),
      });
    }

    if (readStatus && readStatus !== 'all') {
      const statusLabels: Record<string, string> = {
        unread: 'Unread',
        reading: 'Reading',
        completed: 'Completed',
      };
      badges.push({
        id: 'status',
        label: `Status: ${statusLabels[readStatus] || readStatus}`,
        onClear: () => onReadStatusChange('all'),
      });
    }

    if (yearStart || yearEnd) {
      let label = 'Years';
      if (yearStart && yearEnd) {
        label = `Years: ${yearStart}-${yearEnd}`;
      } else if (yearStart) {
        label = `Years: ≥${yearStart}`;
      } else if (yearEnd) {
        label = `Years: ≤${yearEnd}`;
      }
      badges.push({
        id: 'years',
        label,
        onClear: () => {
          onYearStartChange(null);
          onYearEndChange(null);
        },
      });
    }

    if (isOfflineOnly) {
      badges.push({
        id: 'offline',
        label: 'Offline Only',
        onClear: () => onOfflineOnlyChange?.(false),
      });
    }

    return badges;
  }, [
    sortBy,
    readStatus,
    yearStart,
    yearEnd,
    isOfflineOnly,
    onSortChange,
    onReadStatusChange,
    onYearStartChange,
    onYearEndChange,
    onOfflineOnlyChange,
  ]);

  return (
    <header className="min-h-16 md:min-h-32 py-3 md:py-0 px-4 md:px-12 flex items-center justify-between bg-white/40 backdrop-blur-3xl shrink-0 border-b border-neutral-50 z-50 transition-all">
      <div
        className="flex flex-col gap-3 flex-1 max-w-2xl justify-center relative"
        ref={popoverRef}
      >
        <div className="flex items-center gap-2 md:gap-4 w-full">
          {/* Persistent Search Input */}
          <div className="relative h-10 md:h-12 flex-1 max-w-[260px] md:max-w-[360px] flex items-center bg-neutral-50 hover:bg-neutral-100/80 hover:border-neutral-200 focus-within:bg-white focus-within:border-neutral-300 rounded-xl md:rounded-[1.5rem] border border-neutral-100 transition-all duration-300 shadow-sm">
            <div className="absolute left-0 w-10 md:w-12 h-10 md:h-12 flex items-center justify-center shrink-0">
              <Search className="text-neutral-400 w-4 h-4 md:w-5 md:h-5" />
            </div>
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-transparent border-none py-2 pl-10 md:pl-12 pr-10 text-xs md:text-sm font-bold text-neutral-800 placeholder:text-neutral-400 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none"
              aria-label="Search library"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 p-1 rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 transition-all"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 md:w-4 h-4" />
              </button>
            )}
          </div>

          {/* Floating Filter Popover Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
            className={`p-2.5 md:p-4 rounded-xl md:rounded-[1.5rem] border transition-all ${
              showFilters
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300 shadow-sm'
            }`}
          >
            <Filter className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Floating Filter Popover Content */}
        <AnimatePresence>
          {showFilters && (
            <SearchFilterBar
              sortBy={sortBy}
              onSortChange={onSortChange}
              readStatus={readStatus}
              onReadStatusChange={onReadStatusChange}
              yearStart={yearStart}
              onYearStartChange={onYearStartChange}
              yearEnd={yearEnd}
              onYearEndChange={onYearEndChange}
              isOfflineOnly={isOfflineOnly}
              onOfflineOnlyChange={onOfflineOnlyChange}
              onReset={onResetFilters}
              className="absolute top-full left-0 mt-4 z-50 w-[calc(100vw-2rem)] sm:w-[520px]"
            />
          )}
        </AnimatePresence>

        {/* Active Filter Badges */}
        <AnimatePresence>
          {activeBadges.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-wrap items-center gap-2"
            >
              {activeBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-50/80 text-blue-600 text-[10px] md:text-xs font-black uppercase tracking-wider rounded-full border border-blue-100 shadow-sm"
                >
                  <span>{badge.label}</span>
                  <button
                    onClick={badge.onClear}
                    className="p-0.5 rounded-full hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors"
                    aria-label={`Remove ${badge.label} filter`}
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </motion.div>
              ))}
              <button
                onClick={onResetFilters}
                className="text-[10px] md:text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-600 transition-colors pl-1"
              >
                Clear All
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 md:gap-6 ml-4 md:ml-10">
        <button
          onClick={onUploadClick}
          className="bg-black text-white px-4 md:px-10 py-2.5 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-2 md:gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
        >
          <UploadCloud className="w-5 h-5 md:w-5 md:h-5" strokeWidth={2.5} />
          <span className="hidden md:inline">Upload</span>
        </button>

        <div className="h-8 md:h-12 w-px bg-neutral-100 mx-1 md:mx-2 hidden md:block" />

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 md:p-5 border rounded-xl md:rounded-2xl transition-all relative shadow-sm ${
              showNotifications
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-white border-neutral-100 text-neutral-300 hover:text-blue-500'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            {unreadCount > 0 && (
              <span
                className="absolute top-2 right-2 md:top-4 md:right-4 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[9px] md:text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black"
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4 md:ml-4">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-sm font-black tracking-tighter text-neutral-900">
              {session?.user?.name || session?.user?.email?.split('@')[0] || 'Reader'}
            </span>
            <button
              onClick={session?.user?.plan === 'PREMIUM' ? handlePortal : handleCheckout}
              disabled={isSubscriptionLoading}
              className="text-[10px] font-bold text-comet-accent uppercase tracking-widest hover:underline disabled:opacity-50"
            >
              {isSubscriptionLoading
                ? 'Processing...'
                : session?.user?.plan === 'PREMIUM'
                  ? 'Premium User'
                  : 'Upgrade to Premium'}
            </button>
          </div>
          <Link href="/settings" className="shrink-0 group">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session?.user?.name || 'User profile'}
                width={44}
                height={44}
                className="rounded-full object-cover border border-slate-200 group-hover:border-blue-500 transition-colors w-9 h-9 md:w-11 md:h-11"
              />
            ) : (
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs md:text-sm border border-slate-200 group-hover:border-blue-500 transition-colors">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'M'}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
