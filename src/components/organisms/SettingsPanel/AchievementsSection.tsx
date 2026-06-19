import React from 'react';
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

interface AchievementsSectionProps {
  earnedBadgeIds: string[];
}

export function AchievementsSection({ earnedBadgeIds }: AchievementsSectionProps) {
  const earnedSet = new Set(earnedBadgeIds);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
        <Trophy className="text-comet-muted" />
        Achievements
      </h2>

      <div className="bg-comet-surface border border-comet-border rounded-2xl p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BADGES.map((badge) => {
            const isEarned = earnedSet.has(badge.id);
            const Icon = iconMap[badge.icon] || Trophy;

            return (
              <div
                key={badge.id}
                className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col items-center text-center transition-all ${
                  isEarned
                    ? `bg-gradient-to-br ${tierColors[badge.tier]} bg-opacity-10 shadow-lg shadow-black/20`
                    : 'bg-zinc-900/50 border-zinc-800 opacity-60 grayscale'
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    isEarned ? 'bg-black/20 shadow-inner' : 'bg-zinc-800'
                  }`}
                >
                  {isEarned ? (
                    <Icon className="w-8 h-8 drop-shadow-md" />
                  ) : (
                    <Lock className="w-8 h-8 text-zinc-500" />
                  )}
                </div>

                <h3
                  className={`font-semibold text-lg mb-1 ${isEarned ? 'text-white' : 'text-zinc-400'}`}
                >
                  {badge.name}
                </h3>

                <p className="text-sm text-zinc-500 mb-4">{badge.description}</p>

                <div className="mt-auto">
                  <span
                    className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full ${
                      isEarned ? 'bg-black/30' : 'bg-zinc-800 text-zinc-600'
                    }`}
                  >
                    {badge.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
