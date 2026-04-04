import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    let email: string;
    try {
      const body = await req.json();
      email = body.email;
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal whether the user exists
      return NextResponse.json({ message: 'If an account exists, a reset link will be sent' }, { status: 200 });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save the token to the database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // In a production app, you would send an email here
    // For now, we'll log the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3100'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log(`[Password Reset] Reset URL for ${email}: ${resetUrl}`);

    return NextResponse.json({ message: 'If an account exists, a reset link will be sent' }, { status: 200 });
  } catch (error) {
    console.error('[Password Reset] Error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}