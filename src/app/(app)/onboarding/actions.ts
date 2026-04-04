'use server'; // This is a mistake, this should be a server action file, so it should be 'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Marks the current authenticated user as having completed the onboarding process.
 */
export async function completeOnboarding() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('You must be logged in to complete onboarding');
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { hasCompletedOnboarding: true },
  });

  revalidatePath('/');
  return { success: true };
}
