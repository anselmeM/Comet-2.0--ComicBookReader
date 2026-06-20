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
  BRONZE: 'from-amber-900/40 to-amber-950/40 border-amber-700/50 text-amber-500',
  SILVER: 'from-slate-700/40 to-slate-800/40 border-slate-500/50 text-slate-300',
  GOLD: 'from-yellow-900/40 to-yellow-950/40 border-yellow-600/50 text-yellow-400',
  PLATINUM: 'from-cyan-900/40 to-blue-900/40 border-cyan-500/50 text-cyan-300',
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
      <div className="bg-comet-surface/40 border border-comet-border rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-comet-text mb-1">Overall Progress</h2>
            <p className="text-comet-muted text-sm font-medium">
              You have unlocked <span className="text-indigo-400">{earnedCount}</span> out of{' '}
              {totalCount} badges.
            </p>
          </div>
          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 drop-shadow-sm">
            {progressPercent}%
          </div>
        </div>

        <div className="w-full bg-comet-surface-2 rounded-full h-3 overflow-hidden">
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
            <h2 className="text-2xl font-bold tracking-tight text-comet-text capitalize">
              {tier.toLowerCase()} Tier
            </h2>
            <div className="h-px bg-comet-border flex-1" />
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
                      ? `bg-gradient-to-br ${tierColors[badge.tier]} shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] cursor-pointer`
                      : 'bg-comet-surface/30 border-comet-border/50 backdrop-blur-sm grayscale-[0.7] opacity-60 hover:opacity-100 hover:grayscale-[0.3]'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      isEarned ? 'bg-black/30 shadow-inner' : 'bg-comet-surface-2'
                    }`}
                  >
                    {isEarned ? (
                      <Icon className="w-8 h-8 drop-shadow-md" />
                    ) : (
                      <Lock className="w-8 h-8 text-comet-muted" />
                    )}
                  </div>

                  <h3
                    className={`font-bold text-lg mb-2 tracking-tight ${isEarned ? 'text-white drop-shadow-sm' : 'text-comet-muted'}`}
                  >
                    {badge.name}
                  </h3>

                  <p className="text-sm text-comet-muted mb-6 flex-1">{badge.description}</p>

                  <div className="mt-auto w-full flex justify-between items-center border-t border-comet-border pt-4">
                    <span
                      className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md shadow-sm ${
                        isEarned
                          ? 'bg-black/40 text-white border border-white/10'
                          : 'bg-comet-surface-2 text-comet-muted'
                      }`}
                    >
                      {badge.tier}
                    </span>
                    {earnedAt && (
                      <span className="text-[11px] text-comet-muted font-medium">
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
