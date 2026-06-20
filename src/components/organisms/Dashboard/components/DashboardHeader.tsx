'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, UploadCloud, Bell, AlignRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { NotificationDropdown } from '../../Notifications/NotificationDropdown';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onUploadClick: () => void;
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  onSidebarToggle: () => void;
  session: any;
  handlePortal: () => void;
  handleCheckout: () => void;
  isSubscriptionLoading: boolean;
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
  onSidebarToggle,
  session,
  handlePortal,
  handleCheckout,
  isSubscriptionLoading,
}: DashboardHeaderProps) {
  return (
    <header className="h-16 md:h-32 px-4 md:px-12 flex items-center justify-between bg-white/40 backdrop-blur-3xl shrink-0 border-b border-neutral-50 shrink-0 z-50 transition-all">
      <div className="flex items-center gap-2 md:gap-6 flex-1 max-w-2xl">
        <button
          onClick={onSidebarToggle}
          aria-label="Toggle Sidebar"
          className="p-2.5 md:p-5 rounded-xl md:rounded-[1.5rem] border bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300 transition-all shadow-sm shrink-0"
        >
          <AlignRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <motion.div
          initial={false}
          whileHover={{ width: 320 }}
          className="relative h-10 w-10 md:h-12 md:w-12 flex items-center bg-[#0F172A] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group shadow-sm transition-all duration-300 ease-in-out"
          style={{ width: 48 }}
        >
          <div className="absolute left-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shrink-0">
            <Search className="text-slate-400 group-hover:text-blue-500 transition-colors w-4 h-4 md:w-5 md:h-5" />
          </div>
          <input
            type="text"
            placeholder="Search comics, heroes, collections..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-none py-4 pl-10 md:pl-12 pr-4 md:pr-6 text-sm font-bold text-white placeholder:text-slate-400 outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            aria-label="Search comics, heroes, collections"
          />
        </motion.div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
          aria-expanded={showFilters}
          className={`p-2.5 md:p-5 rounded-xl md:rounded-[1.5rem] border-2 transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-500 shadow-xl' : 'bg-white border-neutral-100 text-neutral-400 hover:border-neutral-300'}`}
        >
          <Filter className="w-5 h-5 md:w-6 md:h-6" />
        </button>
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
