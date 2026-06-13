import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

import { ProfileUpdateSchema } from '@/types/schemas';

/**
 * PUT /api/user/profile — Updates user profile and preferences.
 */
export const PUT = withAuth(async (req: Request, context, session) => {
  try {
    // Rate limiting (Phase 2)
    const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
    const limiter = await rateLimit(`profile_${session.user.id}`, 10, 60 * 1000); // 10 updates per minute

    if (limiter.isLimited) {
      return NextResponse.json(
        { error: 'Too many profile updates. Please wait a minute.' },
        { status: 429, headers: limiter.headers },
      );
    }

    const body = await req.json();
    const result = ProfileUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Update user profile and preferences
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...result.data,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        defaultReadingMode: true,
        theme: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error('Profile Update Error', {}, error as Error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
});
