import React from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { BADGES } from '@/lib/badges';

interface AchievementsSectionProps {
  earnedBadgeIds: string[];
}

export function AchievementsSection({ earnedBadgeIds }: AchievementsSectionProps) {
  const earnedCount = earnedBadgeIds.length;
  const totalCount = BADGES.length;

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
        <Trophy className="text-comet-muted" />
        Achievements
      </h2>

      <div className="bg-comet-surface border border-comet-border rounded-2xl p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-lg font-bold text-comet-text mb-1 flex items-center gap-2">
            Badges Earned:{' '}
            <span className="text-comet-accent">
              {earnedCount} / {totalCount}
            </span>
          </h3>
          <p className="text-comet-muted text-sm">
            {earnedCount === 0
              ? 'Start reading to unlock badges and milestones.'
              : 'Keep reading to unlock more badges and reach new milestones.'}
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href="/settings/achievements"
            className="flex items-center gap-2 bg-comet-surface-2 border border-comet-border text-comet-text px-6 py-3 rounded-xl hover:bg-comet-surface transition-all"
          >
            <Trophy size={18} />
            <span>View All Badges</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
