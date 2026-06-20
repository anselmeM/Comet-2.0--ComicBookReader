import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import { resetPasswordRequestSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  let email: string | undefined;
  try {
    const body = await req.json();
    const result = resetPasswordRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email: rawEmail } = result.data;
    email = rawEmail.toLowerCase().trim();

    // Rate limiting (T-AUTH-003) - Dual-layer protection
    const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];

    // 1. IP-based limit (protect against wide brute force / DoS)
    const ipLimiter = await rateLimit(`reset_ip_${ip}`, 5, 60 * 60 * 1000); // 5 per hour
    if (ipLimiter.isLimited) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again in an hour.' },
        { status: 429, headers: ipLimiter.headers },
      );
    }

    // 2. Email-based limit (protect against targeted brute force)
    const emailLimiter = await rateLimit(`reset_email_${email}`, 10, 60 * 60 * 1000); // 10 per hour
    if (emailLimiter.isLimited) {
      return NextResponse.json(
        { error: 'Too many reset attempts for this email. Please try again in an hour.' },
        { status: 429, headers: emailLimiter.headers },
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal whether the user exists
      return NextResponse.json(
        { message: 'If an account exists, a reset link will be sent' },
        { status: 200 },
      );
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save the hashed token to the database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedResetToken,
        resetTokenExpiry,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3100'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    logger.info('[Password Reset] Reset token generated for user', { email });

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
        logger.error(
          '[Password Reset] Failed to send email via SMTP',
          { email },
          emailError as Error,
        );
        // We still return 200 below so we don't leak user existence
      }
    }

    return NextResponse.json(
      { message: 'If an account exists, a reset link will be sent' },
      { status: 200 },
    );
  } catch (error) {
    logger.error('[Password Reset] Error', { email }, error as Error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
