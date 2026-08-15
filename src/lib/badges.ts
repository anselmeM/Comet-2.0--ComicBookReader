import { db } from './db';

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  condition: (stats: UserStats) => boolean;
}

export interface UserStats {
  comicsCompleted: number;
  totalComicsInLibrary: number;
  readingStreak: number;
  totalTimeReadSeconds: number;
  lastReadHour: number;
}

export const BADGES: BadgeDefinition[] = [
  // MILESTONES
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Read your first comic to completion.',
    icon: 'BookOpenCheck',
    tier: 'BRONZE',
    condition: (stats) => stats.comicsCompleted >= 1,
  },
  {
    id: 'avid_reader',
    name: 'Avid Reader',
    description: 'Read 10 comics to completion.',
    icon: 'LibraryBig',
    tier: 'SILVER',
    condition: (stats) => stats.comicsCompleted >= 10,
  },
  {
    id: 'the_collector',
    name: 'The Collector',
    description: 'Add 50 comics to your library.',
    icon: 'Archive',
    tier: 'SILVER',
    condition: (stats) => stats.totalComicsInLibrary >= 50,
  },

  // STREAKS
  {
    id: 'streak_3',
    name: 'Getting Warm',
    description: 'Read for 3 consecutive days.',
    icon: 'Flame',
    tier: 'BRONZE',
    condition: (stats) => stats.readingStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Unstoppable',
    description: 'Read for a full week straight.',
    icon: 'FlameKindling',
    tier: 'SILVER',
    condition: (stats) => stats.readingStreak >= 7,
  },

  // TIME & HABITS
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Read a comic between midnight and 4 AM.',
    icon: 'Moon',
    tier: 'BRONZE',
    condition: (stats) => stats.lastReadHour >= 0 && stats.lastReadHour < 4,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Read a comic between 5 AM and 8 AM.',
    icon: 'SunMedium',
    tier: 'BRONZE',
    condition: (stats) => stats.lastReadHour >= 5 && stats.lastReadHour < 8,
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    description: 'Read for a total of 24 hours.',
    icon: 'Timer',
    tier: 'GOLD',
    condition: (stats) => stats.totalTimeReadSeconds >= 24 * 60 * 60,
  },
];

export async function evaluateBadges(userId: string): Promise<string[]> {
  // 1. Fetch user's current badges to avoid re-evaluating
  const earnedBadges = await db.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });

  const earnedBadgeIds = new Set(earnedBadges.map((b: { badgeId: string }) => b.badgeId));
  const unearnedBadges = BADGES.filter((b: BadgeDefinition) => !earnedBadgeIds.has(b.id));

  if (unearnedBadges.length === 0) return []; // All badges earned

  // 2. Fetch User Stats
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { readingStreak: true },
  });

  if (!user) return [];

  const libraryCount = await db.comic.count({ where: { userId } });

  const completedComics = await db.readingProgress.count({
    where: { userId, readStatus: 'COMPLETED' },
  });

  const totalTimeResult = await db.readingProgress.aggregate({
    where: { userId },
    _sum: { totalTimeSpent: true },
  });

  const stats: UserStats = {
    comicsCompleted: completedComics,
    totalComicsInLibrary: libraryCount,
    readingStreak: user.readingStreak,
    totalTimeReadSeconds: totalTimeResult._sum.totalTimeSpent || 0,
    lastReadHour: new Date().getHours(),
  };

  // 3. Evaluate unearned badges
  const newlyEarnedIds: string[] = [];

  for (const badge of unearnedBadges) {
    if (badge.condition(stats)) {
      newlyEarnedIds.push(badge.id);
    }
  }

  // 4. Save newly earned badges
  if (newlyEarnedIds.length > 0) {
    await Promise.all(
      newlyEarnedIds.map(
        (badgeId) =>
          db.userBadge
            .create({
              data: { userId, badgeId },
            })
            .catch(() => {}), // Ignore duplicates
      ),
    );
  }

  return newlyEarnedIds;
}
