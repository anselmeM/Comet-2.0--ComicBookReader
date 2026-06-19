import { Metadata } from 'next';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AchievementsList } from './AchievementsList';

export const metadata: Metadata = {
  title: 'Achievements - Comet',
  description: 'View your reading badges and milestones.',
};

export default async function SettingsAchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const earnedBadges = await db.userBadge.findMany({
    where: { userId: session.user.id },
    orderBy: { earnedAt: 'desc' },
  });

  return (
    <div className="container max-w-4xl py-12 px-4 md:px-8 mx-auto">
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center text-sm text-comet-muted hover:text-comet-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Link>
      </div>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
          <Trophy className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-comet-text tracking-tight">Achievements</h1>
          <p className="text-comet-muted">Unlock badges by reaching reading milestones.</p>
        </div>
      </div>

      <AchievementsList earnedBadges={earnedBadges} />
    </div>
  );
}
