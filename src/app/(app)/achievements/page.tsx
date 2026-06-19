import { Metadata } from 'next';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { BADGES } from '@/lib/badges';
import { redirect } from 'next/navigation';
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
  ArrowLeft,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Achievements - Comet',
  description: 'View your reading badges and milestones.',
};

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

const tierColors = {
  BRONZE: 'from-amber-700 to-amber-900 border-amber-800 text-amber-500',
  SILVER: 'from-slate-400 to-slate-600 border-slate-500 text-slate-300',
  GOLD: 'from-yellow-400 to-yellow-600 border-yellow-500 text-yellow-300',
  PLATINUM: 'from-cyan-300 to-blue-500 border-cyan-400 text-cyan-200',
};

import Link from 'next/link';

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const earnedBadges = await db.userBadge.findMany({
    where: { userId: session.user.id },
    orderBy: { earnedAt: 'desc' },
  });

  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.badgeId));

  return (
    <div className="container max-w-4xl py-12 px-4 md:px-8">
      <div className="mb-6">
        <Link
          href="/library"
          className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Link>
      </div>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <Trophy className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Achievements</h1>
          <p className="text-zinc-400">Unlock badges by reaching reading milestones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BADGES.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
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
              {/* Icon Container */}
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
  );
}
