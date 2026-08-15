'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { LogOut, Settings } from 'lucide-react';
import { signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import { navItems } from '@/lib/dashboard';
import { deleteUserDB, deleteLegacyDB } from '@/lib/idb';
import { logger } from '@/lib/logger';

interface DashboardSidebarProps {
  isOpen: boolean;
  activeView: string;
  onNavClick: (viewId: string) => void;
  onToggle: () => void;
}

const bottomNavItems = [
  { name: 'Settings', icon: Settings, id: 'settings' },
  { name: 'Log out', icon: LogOut, id: 'logout' },
];

export function DashboardSidebar({
  isOpen,
  activeView,
  onNavClick,
  onToggle,
}: DashboardSidebarProps) {
  const { data: session } = useSession();

  const handleLogout = async () => {
    try {
      const userId = session?.user?.id;
      // Clear user-scoped cache database
      if (userId) {
        await deleteUserDB(userId);
      }
      // Also delete the legacy database to keep client clean
      await deleteLegacyDB();
    } catch (err) {
      logger.error(
        '[DashboardSidebar] Failed to clean cache DBs:',
        {},
        err instanceof Error ? err : undefined,
      );
    }
    nextAuthSignOut({ callbackUrl: '/login' });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 320 : 88 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="hidden md:flex bg-white border-r border-neutral-50 flex-col py-14 shrink-0 overflow-y-auto no-scrollbar"
    >
      <motion.div
        initial={false}
        animate={{ paddingLeft: isOpen ? 24 : 0 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className={cn('mb-20 flex items-center gap-4', !isOpen ? 'justify-center' : '')}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          aria-expanded={isOpen}
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 font-black rotate-6 hover:rotate-0 transition-transform cursor-pointer text-2xl shrink-0"
        >
          C
        </button>
        <motion.h1
          initial={false}
          animate={{
            opacity: isOpen ? 1 : 0,
            width: isOpen ? 'auto' : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="font-black text-3xl tracking-tighter italic whitespace-nowrap overflow-hidden"
        >
          Comet
        </motion.h1>
      </motion.div>

      <nav className={cn('flex-1 space-y-4', isOpen ? 'px-6' : 'px-4')}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            title={!isOpen ? item.name : undefined}
            aria-current={activeView === item.id ? 'page' : undefined}
            className={cn('flex items-center transition-all', isOpen
                ? 'w-full px-6 py-5 rounded-3xl justify-start text-lg font-bold'
                : 'w-12 h-12 rounded-2xl justify-center mx-auto', activeView === item.id
                ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/40'
                : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900')}
          >
            <item.icon
              size={24}
              strokeWidth={2.5}
              className={cn('shrink-0', activeView === item.id ? 'text-white' : '')}
            />
            <motion.span
              initial={false}
              animate={{
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0,
                marginLeft: isOpen ? 20 : 0,
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.name}
            </motion.span>
          </button>
        ))}
      </nav>

      <div
        className={cn('space-y-4 mt-auto border-t border-neutral-50 pt-10 pb-10', isOpen ? 'px-6' : 'px-4')}
      >
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => (item.id === 'logout' ? handleLogout() : onNavClick(item.id))}
            title={!isOpen ? item.name : undefined}
            aria-current={activeView === item.id ? 'page' : undefined}
            className={cn('flex items-center transition-all', isOpen
                ? 'w-full px-6 py-5 rounded-3xl justify-start text-lg font-bold text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                : 'w-12 h-12 rounded-2xl justify-center mx-auto text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900', item.id === 'logout' ? 'hover:text-red-400' : '')}
          >
            <item.icon size={24} strokeWidth={2.5} className="shrink-0" />
            <motion.span
              initial={false}
              animate={{
                opacity: isOpen ? 1 : 0,
                width: isOpen ? 'auto' : 0,
                marginLeft: isOpen ? 20 : 0,
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="whitespace-nowrap overflow-hidden"
            >
              {item.name}
            </motion.span>
          </button>
        ))}
      </div>
    </motion.aside>
  );
}
