'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { BADGES } from '@/lib/badges';
import {
  Trophy,
  Flame,
  Moon,
  BookOpenCheck,
  Archive,
  SunMedium,
  Timer,
  LibraryBig,
  Lock,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Trophy,
  Flame,
  FlameKindling: Flame, // fallback
  Moon,
  BookOpenCheck,
  Archive,
  SunMedium,
  Timer,
  LibraryBig,
};

const tierColors: Record<string, string> = {
  BRONZE: 'from-amber-700 to-amber-900 border-amber-800 text-amber-500',
  SILVER: 'from-slate-400 to-slate-600 border-slate-500 text-slate-300',
  GOLD: 'from-yellow-400 to-yellow-600 border-yellow-500 text-yellow-300',
  PLATINUM: 'from-cyan-300 to-blue-500 border-cyan-400 text-cyan-200',
};

// Sort tiers conceptually:
const tierOrder: Record<string, number> = {
  PLATINUM: 0,
  GOLD: 1,
  SILVER: 2,
  BRONZE: 3,
};

interface AchievementsListProps {
  earnedBadges: { badgeId: string; earnedAt: Date }[];
}

export function AchievementsList({ earnedBadges }: AchievementsListProps) {
  const earnedBadgeMap = new Map<string, Date>(
    earnedBadges.map((b) => [b.badgeId, new Date(b.earnedAt)]),
  );

  const earnedCount = earnedBadges.length;
  const totalCount = BADGES.length;
  const progressPercent = Math.round((earnedCount / totalCount) * 100);

  // Group badges by Tier
  const groupedBadges = BADGES.reduce(
    (acc, badge) => {
      if (!acc[badge.tier]) acc[badge.tier] = [];
      acc[badge.tier].push(badge);
      return acc;
    },
    {} as Record<string, typeof BADGES>,
  );

  const sortedTiers = Object.keys(groupedBadges).sort((a, b) => tierOrder[a] - tierOrder[b]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-12">
      {/* Progress Header */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Overall Progress</h2>
            <p className="text-zinc-400 text-sm">
              You have unlocked {earnedCount} out of {totalCount} badges.
            </p>
          </div>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            {progressPercent}%
          </div>
        </div>

        <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          />
        </div>
      </div>

      {/* Tiers */}
      {sortedTiers.map((tier) => (
        <div key={tier} className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-white capitalize">
              {tier.toLowerCase()} Tier
            </h2>
            <div className="h-px bg-zinc-800 flex-1" />
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {groupedBadges[tier].map((badge) => {
              const earnedAt = earnedBadgeMap.get(badge.id);
              const isEarned = !!earnedAt;
              const Icon = iconMap[badge.icon] || Trophy;

              return (
                <motion.div
                  variants={itemVariants}
                  whileHover={isEarned ? { scale: 1.02, translateY: -4 } : {}}
                  key={badge.id}
                  className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col items-center text-center transition-all duration-300 ${
                    isEarned
                      ? `bg-gradient-to-br ${tierColors[badge.tier]} bg-opacity-10 shadow-lg cursor-pointer`
                      : 'bg-zinc-900/30 border-zinc-800 backdrop-blur-sm grayscale-[0.8]'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      isEarned ? 'bg-black/20 shadow-inner' : 'bg-zinc-800/50'
                    }`}
                  >
                    {isEarned ? (
                      <Icon className="w-8 h-8 drop-shadow-md" />
                    ) : (
                      <Lock className="w-8 h-8 text-zinc-600" />
                    )}
                  </div>

                  <h3
                    className={`font-semibold text-lg mb-2 ${isEarned ? 'text-white' : 'text-zinc-500'}`}
                  >
                    {badge.name}
                  </h3>

                  <p className="text-sm text-zinc-400/80 mb-6 flex-1">{badge.description}</p>

                  <div className="mt-auto w-full flex justify-between items-center border-t border-white/5 pt-4">
                    <span
                      className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md ${
                        isEarned ? 'bg-black/30' : 'bg-zinc-800/80 text-zinc-600'
                      }`}
                    >
                      {badge.tier}
                    </span>
                    {earnedAt && (
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(earnedAt)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
