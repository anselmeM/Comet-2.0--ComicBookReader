import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { db } from '@/lib/db';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { logger } from '@/lib/logger';

import { InviteSchema } from '@/types/schemas';

/** Escape a value for safe interpolation into an HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Uniform success body — identical for every invite outcome so the response
 * cannot be used to probe whether an email already has an account.
 */
const INVITE_SENT = { success: true, message: 'Invitation sent successfully' } as const;

/**
 * POST /api/friends/invite — Sends an invitation to a potential friend via email
 */
export const POST = withAuth(async (req: Request, context, session) => {
  try {
    // Rate limiting (Phase 2)
    const ip = getClientIp(req);
    const limiter = await rateLimit(`invite_${session.user.id}`, 5, 60 * 60 * 1000); // 5 per hour

    if (limiter.isLimited) {
      return NextResponse.json(
        { error: 'Too many invitations sent. Please try again in an hour.' },
        { status: 429, headers: limiter.headers },
      );
    }

    const body = await req.json();
    const result = InviteSchema.safeParse(body);
    if (!result.success)
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    const { email } = result.data;
    const targetEmail = email.toLowerCase().trim();

    if (targetEmail === session.user.email) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    // 1. Check if the user is already on the platform. Respond with the same
    // success payload a real invite produces so callers cannot probe which
    // emails have accounts; skip the Invitation row and the email entirely.
    const existingUser = await db.user.findUnique({
      where: { email: targetEmail },
    });

    if (existingUser) {
      return NextResponse.json(INVITE_SENT);
    }

    // 2. Check if an invitation was already sent. Return the same success body
    // without creating a duplicate row or emailing again: a 400 here would let
    // a caller distinguish a real (non-member) invite from the short-circuit
    // above by inviting the same address twice.
    const existingInvite = await db.invitation.findFirst({
      where: {
        senderId: session.user.id,
        email: targetEmail,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      return NextResponse.json(INVITE_SENT);
    }

    // 3. Create the invitation in the DB
    await db.invitation.create({
      data: {
        senderId: session.user.id,
        email: targetEmail,
      },
    });

    // 4. Send the email (mock/simulation for local dev, real SMTP if configured)
    // Only attempt SMTP when it's actually configured — otherwise nodemailer
    // silently falls back to localhost:25 and the invite reports success while
    // no mail was sent (mirrors the reset-password guard).
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?invitedBy=${session.user.id}`;

      // The display name/email are user-controlled: strip CR/LF (header
      // injection) and HTML-escape them before they land in the email.
      const displayName = (session.user.name || 'A friend').replace(/[\r\n]+/g, ' ');
      const safeName = escapeHtml(displayName);
      const safeEmail = escapeHtml(session.user.email ?? '');
      const safeInviteLink = escapeHtml(inviteLink);

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: targetEmail,
          subject: `${displayName} invited you to join Comet!`,
          text: `Hi! ${displayName} wants you to join them on Comet, the Speed of Light Comic Reader. Join here: ${inviteLink}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #2563eb;">You've been invited to Comet!</h2>
              <p><strong>${safeName}</strong> (${safeEmail}) wants you to join their circle of comic readers.</p>
              <p>Comet is the ultimate digital comic library with offline reading and immersive viewing modes.</p>
              <div style="margin: 30px 0;">
                <a href="${safeInviteLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
              </div>
              <p style="color: #666; font-size: 12px;">If you weren't expecting this, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (mailError) {
        logger.error('Failed to send invite email', { targetEmail }, mailError as Error);
        // We still return success because the record was created in the DB
      }
    } else {
      logger.warn('[Invite] SMTP not configured — invite created without email', { targetEmail });
    }

    return NextResponse.json(INVITE_SENT);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    logger.error('Invite POST error', {}, error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
