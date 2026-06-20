'use client';

import React from 'react';
import { navItems } from '@/lib/__mocks__/dashboard';
import { motion } from 'framer-motion';
import { Settings, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface MobileBottomNavProps {
  activeView: string;
  onNavClick: (viewId: string) => void;
}

export function MobileBottomNav({ activeView, onNavClick }: MobileBottomNavProps) {
  // Combine existing nav items with Settings and Log Out
  const bottomNavItems = [
    ...navItems.filter((item) =>
      ['dashboard', 'collections', 'favourites', 'history', 'friends'].includes(item.id),
    ),
    { name: 'Settings', icon: Settings, id: 'settings' },
    { name: 'Log Out', icon: LogOut, id: 'logout' },
  ];

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 h-20 bg-white/90 backdrop-blur-xl border border-neutral-100 rounded-2xl z-50 px-2 flex items-center shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-x-auto no-scrollbar">
      <div className="flex items-center min-w-max w-full justify-between gap-2 px-2">
        {bottomNavItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'logout') {
                  signOut();
                } else {
                  onNavClick(item.id);
                }
              }}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full py-2 relative shrink-0"
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute top-1 w-8 h-1 bg-blue-500 rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-colors ${
                  item.id === 'logout'
                    ? 'text-red-500'
                    : isActive
                      ? 'text-blue-500'
                      : 'text-neutral-400'
                }`}
              />
              <span
                className={`text-[10px] font-bold transition-colors text-center leading-tight ${
                  item.id === 'logout'
                    ? 'text-red-500'
                    : isActive
                      ? 'text-blue-500'
                      : 'text-neutral-400'
                }`}
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
