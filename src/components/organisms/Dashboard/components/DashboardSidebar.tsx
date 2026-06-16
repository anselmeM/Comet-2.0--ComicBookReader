'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Settings } from 'lucide-react';
import { signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import { navItems } from '@/lib/__mocks__/dashboard';
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

export function DashboardSidebar({ isOpen, activeView, onNavClick }: DashboardSidebarProps) {
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
      animate={{ width: isOpen ? 320 : 120 }}
      className="bg-white border-r border-neutral-50 flex flex-col py-14 shrink-0 transition-all duration-500"
    >
      <div className="px-14 mb-20 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 font-black rotate-6 hover:rotate-0 transition-transform cursor-pointer text-2xl">
          G
        </div>
        {isOpen && <h1 className="font-black text-3xl tracking-tighter italic">Geek</h1>}
      </div>

      <nav className="flex-1 px-8 space-y-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            title={!isOpen ? item.name : undefined}
            aria-current={activeView === item.id ? 'page' : undefined}
            className={`w-full flex items-center ${isOpen ? 'gap-5 px-6' : 'justify-center'} py-5 rounded-[1.8rem] font-bold text-lg transition-all ${activeView === item.id ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/40 translate-x-1' : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900'}`}
          >
            <item.icon
              size={24}
              strokeWidth={2.5}
              className={activeView === item.id ? 'text-white' : ''}
            />
            {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
          </button>
        ))}
      </nav>

      <div className="px-8 space-y-4 mt-auto border-t border-neutral-50 pt-10 pb-10">
        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => (item.id === 'logout' ? handleLogout() : onNavClick(item.id))}
            title={!isOpen ? item.name : undefined}
            aria-current={activeView === item.id ? 'page' : undefined}
            className={`w-full flex items-center ${isOpen ? 'gap-5 px-6' : 'justify-center'} py-5 rounded-[1.8rem] font-bold text-lg text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 transition-all ${item.id === 'logout' ? 'hover:text-red-400' : ''}`}
          >
            <item.icon size={24} strokeWidth={2.5} />
            {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
          </button>
        ))}
      </div>
    </motion.aside>
  );
}
