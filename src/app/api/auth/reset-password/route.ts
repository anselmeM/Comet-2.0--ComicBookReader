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

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3100'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Set up email sending via SMTP if configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
        const nodemailer = await import('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Comet Reader" <noreply@cometreader.com>',
          to: email,
          subject: 'Password Reset - Comet Reader',
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
              <h2>Reset Your Password</h2>
              <p>You requested a password reset for your Comet Reader account.</p>
              <p>Click the button below to set a new password:</p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; font-weight: bold; border-radius: 8px; margin: 24px 0;">Reset Password</a>
              <p style="font-size: 13px; color: #666; width: 100%; border-top: 1px solid #eaeaea; padding-top: 16px;">
                If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('[Password Reset] Failed to send email via SMTP:', emailError);
        // We still return 200 below so we don't leak user existence
      }
    }

    return NextResponse.json({ message: 'If an account exists, a reset link will be sent' }, { status: 200 });
  } catch (error) {
    console.error('[Password Reset] Error:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}