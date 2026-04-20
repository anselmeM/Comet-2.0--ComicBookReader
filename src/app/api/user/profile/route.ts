import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  image: z.string().url('Invalid image URL').or(z.literal('')).optional(),
  defaultReadingMode: z.enum(['single-page', 'single-vertical', 'dual-spread', 'manga-rtl']).optional(),
  theme: z.enum(['dark', 'light', 'sepia']).optional(),
});

/**
 * PUT /api/user/profile — Updates user profile and preferences.
 */
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_EXPIRED' },
        { status: 401 }
      );
    }

    // Rate limiting (Phase 2)
    const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
    const limiter = await rateLimit(`profile_${session.user.id}`, 10, 60 * 1000); // 10 updates per minute

    if (limiter.isLimited) {
      return NextResponse.json(
        { error: 'Too many profile updates. Please wait a minute.' },
        { status: 429, headers: limiter.headers }
      );
    }

    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Update user profile and preferences
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        ...parsed.data,
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
    console.error('[API] Profile Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
