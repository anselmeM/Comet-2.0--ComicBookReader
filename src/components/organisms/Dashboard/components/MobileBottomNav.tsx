'use client';

import React from 'react';

import { cn } from '@/lib/cn';

import { navItems } from '@/lib/dashboard';

import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  activeView: string;

  onNavClick: (viewId: string) => void;
}

export function MobileBottomNav({ activeView, onNavClick }: MobileBottomNavProps) {
  // Combine existing nav items

  const bottomNavItems = [
    ...navItems.filter((item) =>
      ['dashboard', 'collections', 'favourites', 'history', 'friends'].includes(item.id),
    ),
  ];

  return (
    <nav className="md:hidden fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 h-20 bg-white/90 backdrop-blur-xl border border-neutral-100 rounded-2xl z-50 px-2 flex items-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-x-auto no-scrollbar">
      <div className="flex items-center min-w-max w-full justify-between gap-2 px-2">
        {bottomNavItems.map((item) => {
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavClick(item.id)}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full py-2 relative shrink-0"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute top-1 w-8 h-1 bg-comet-accent/100 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-comet-accent' : 'text-neutral-500',
                )}
              />

              <span
                className={cn(
                  'text-[10px] font-bold transition-colors text-center leading-tight',
                  isActive ? 'text-comet-accent' : 'text-neutral-500',
                )}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
