'use server';

import { requireAuth } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Marks the current authenticated user as having completed the onboarding process,
 * optionally saving their initial reading mode and theme preferences.
 */
export async function completeOnboarding(preferences?: {
  defaultReadingMode?: 'single-page' | 'single-vertical' | 'dual-spread' | 'manga-rtl';
  theme?: 'dark' | 'light' | 'sepia';
}) {
  const session = await requireAuth();

  const updateData: {
    hasCompletedOnboarding: boolean;
    defaultReadingMode?: 'single-page' | 'single-vertical' | 'dual-spread' | 'manga-rtl';
    theme?: 'dark' | 'light' | 'sepia';
  } = {
    hasCompletedOnboarding: true,
  };

  if (preferences?.defaultReadingMode) {
    updateData.defaultReadingMode = preferences.defaultReadingMode;
  }
  if (preferences?.theme) {
    updateData.theme = preferences.theme;
  }

  await db.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  revalidatePath('/');
  return { success: true };
}
