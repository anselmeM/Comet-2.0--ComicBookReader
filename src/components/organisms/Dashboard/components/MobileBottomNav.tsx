'use client';

import React from 'react';
import { navItems } from '@/lib/__mocks__/dashboard';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  activeView: string;
  onNavClick: (viewId: string) => void;
}

export function MobileBottomNav({ activeView, onNavClick }: MobileBottomNavProps) {
  // Let's filter to just the most critical 4-5 items for the bottom nav
  const bottomNavItems = navItems.filter((item) =>
    ['dashboard', 'collections', 'favourites', 'history'].includes(item.id),
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-neutral-100 z-50 px-6 pb-safe flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {bottomNavItems.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            className="flex flex-col items-center justify-center gap-1 w-16 h-full relative"
          >
            {isActive && (
              <motion.div
                layoutId="mobileNavIndicator"
                className="absolute top-1 w-8 h-1 bg-blue-500 rounded-full"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <item.icon
              size={24}
              strokeWidth={isActive ? 2.5 : 2}
              className={`transition-colors ${isActive ? 'text-blue-500' : 'text-neutral-400'}`}
            />
            <span
              className={`text-[10px] font-bold transition-colors ${
                isActive ? 'text-blue-500' : 'text-neutral-400'
              }`}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
