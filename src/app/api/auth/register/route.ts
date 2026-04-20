import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notifications';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  try {
    // 1. Rate limiting (T-AUTH-003)
    const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
    const limiter = await rateLimit(`reg_${ip}`, 5, 60 * 60 * 1000); // 5 per hour

    if (limiter.isLimited) {
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again in an hour.' },
        { status: 429, headers: limiter.headers }
      );
    }

    const body = await req.json();
    const { name, email: rawEmail, password } = registerSchema.parse(body);
    const email = rawEmail.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists', code: 'USER_EXISTS' },
        { status: 409 }
      );
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        hasCompletedOnboarding: true, // Default to true to avoid redirection issues
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Handle invitations
    try {
      const pendingInvites = await db.invitation.findMany({
        where: { email: user.email, status: 'PENDING' },
      });

      if (pendingInvites.length > 0) {
        // Create friendships with all inviters
        await db.$transaction(
          pendingInvites.map((invite) =>
            db.friendship.create({
              data: {
                userId: invite.senderId,
                friendId: user.id,
              },
            })
          )
        );

        // Update invitation status
        await db.invitation.updateMany({
          where: { email: user.email, status: 'PENDING' },
          data: { status: 'ACCEPTED' },
        });

        // Notify all inviters
        await Promise.all(
          pendingInvites.map((invite) =>
            createNotification({
              userId: invite.senderId,
              type: 'FRIEND_REQUEST_ACCEPTED',
              title: 'Friend Joined Comet!',
              message: `${user.name || 'A friend you invited'} has joined Comet and is now your friend!`,
              link: '/friends',
            })
          )
        );
      }
    } catch (inviteError) {
      console.error('[API] Invitation processing error:', inviteError);
    }

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
