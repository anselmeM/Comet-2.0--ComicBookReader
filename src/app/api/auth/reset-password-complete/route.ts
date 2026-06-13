import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notifications';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { resetPasswordCompleteSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting (T-AUTH-003)
    const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
    const limiter = await rateLimit(`reset_complete_${ip}`, 5, 60 * 60 * 1000); // 5 per hour

    if (limiter.isLimited) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again in an hour.' },
        { status: 429, headers: limiter.headers },
      );
    }

    const body = await req.json();
    const result = resetPasswordCompleteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, token, newPassword } = result.data;

    // Hash the received token to compare with the one stored in DB
    const hashedResetToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with the hashed reset token
    const user = await db.user.findFirst({
      where: {
        email,
        resetToken: hashedResetToken,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password and clear the reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Create system notification for security
    await createNotification({
      userId: user.id,
      type: 'SYSTEM_ALERT',
      title: 'Password Changed',
      message:
        "Your account password was recently changed. If this wasn't you, please contact support immediately.",
    });

    return NextResponse.json({ message: 'Password has been reset successfully' }, { status: 200 });
  } catch (error) {
    logger.error('[Password Reset Complete] Error', {}, error as Error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
