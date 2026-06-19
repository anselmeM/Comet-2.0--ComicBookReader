import { SettingsPanel } from '@/components/organisms/SettingsPanel';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Settings - Comet',
  description: 'Manage your reading preferences and local cache',
};

export default async function SettingsPage() {
  const session = await auth();
  let earnedBadgeIds: string[] = [];

  if (session?.user?.id) {
    const earnedBadges = await db.userBadge.findMany({
      where: { userId: session.user.id },
      select: { badgeId: true },
    });
    earnedBadgeIds = earnedBadges.map((b) => b.badgeId);
  }

  return (
    <main className="min-h-screen bg-comet-bg text-comet-text pt-20 transition-colors duration-300">
      <SettingsPanel earnedBadgeIds={earnedBadgeIds} />
    </main>
  );
}
