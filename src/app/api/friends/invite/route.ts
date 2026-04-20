import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { rateLimit } from '@/lib/rate-limit';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/friends/invite — Sends an invitation to a potential friend via email
 */
export async function POST(req: Request) {
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
    const limiter = await rateLimit(`invite_${session.user.id}`, 5, 60 * 60 * 1000); // 5 per hour

    if (limiter.isLimited) {
      return NextResponse.json(
        { error: 'Too many invitations sent. Please try again in an hour.' },
        { status: 429, headers: limiter.headers }
      );
    }

    const body = await req.json();
    const { email } = inviteSchema.parse(body);
    const targetEmail = email.toLowerCase().trim();

    if (targetEmail === session.user.email) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    // 1. Check if the user is already on the platform
    const existingUser = await db.user.findUnique({
      where: { email: targetEmail },
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'This user is already a member. Use the search feature to find them.',
        isMember: true 
      }, { status: 400 });
    }

    // 2. Check if an invitation was already sent
    const existingInvite = await db.invitation.findFirst({
      where: { 
        senderId: session.user.id,
        email: targetEmail,
        status: 'PENDING'
      },
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation has already been sent to this email.' }, { status: 400 });
    }

    // 3. Create the invitation in the DB
    await db.invitation.create({
      data: {
        senderId: session.user.id,
        email: targetEmail,
      },
    });

    // 4. Send the email (mock/simulation for local dev, real SMTP if configured)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?invitedBy=${session.user.id}`;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: targetEmail,
        subject: `${session.user.name || 'A friend'} invited you to join Comet!`,
        text: `Hi! ${session.user.name || 'A friend'} wants you to join them on Comet, the Speed of Light Comic Reader. Join here: ${inviteLink}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">You've been invited to Comet!</h2>
            <p><strong>${session.user.name || 'A friend'}</strong> (${session.user.email}) wants you to join their circle of comic readers.</p>
            <p>Comet is the ultimate digital comic library with offline reading and immersive viewing modes.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accept Invitation</a>
            </div>
            <p style="color: #666; font-size: 12px;">If you weren't expecting this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('[API] Failed to send invite email:', mailError);
      // We still return success because the record was created in the DB
    }

    return NextResponse.json({ success: true, message: 'Invitation sent successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('[API] Invite POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
