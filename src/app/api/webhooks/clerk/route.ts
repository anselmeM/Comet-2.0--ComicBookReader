import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { isUniqueConstraintError } from '@/lib/prisma-errors';

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserPayload {
  id: string;
  primary_email_address_id?: string | null;
  email_addresses?: ClerkEmailAddress[];
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string | null;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserPayload;
}

function primaryEmail(user: ClerkUserPayload): string | null {
  return (
    user.email_addresses?.find((e) => e.id === user.primary_email_address_id)?.email_address ??
    user.email_addresses?.[0]?.email_address ??
    null
  );
}

function displayName(user: ClerkUserPayload): string | null {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || null;
}

/**
 * POST /api/webhooks/clerk — Clerk user lifecycle sync.
 *
 * Subscribe in the Clerk Dashboard (Webhooks → this URL) to:
 * user.created, user.updated, user.deleted
 *
 * Requires CLERK_WEBHOOK_SECRET (svix signing secret).
 */
export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  let evt: ClerkWebhookEvent;
  try {
    // svix signs the exact bytes it sent: verify the raw body, never a
    // parse/stringify round-trip (which can change escaping/formatting).
    const rawBody = await req.text();
    const wh = new Webhook(secret);
    evt = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as unknown as ClerkWebhookEvent;
  } catch (err) {
    logger.error('[Clerk Webhook] Signature verification failed', {}, err as Error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const clerkUser = evt.data;
      const email = primaryEmail(clerkUser);

      const existing = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
      if (existing) {
        try {
          await db.user.update({
            where: { id: existing.id },
            data: {
              email: email ?? existing.email,
              name: displayName(clerkUser) ?? existing.name,
              image: clerkUser.image_url ?? existing.image,
            },
          });
        } catch (err) {
          // The new email already belongs to another row. Keep the account usable
          // (name/image sync) instead of returning 500 forever on a poison event.
          if (!isUniqueConstraintError(err)) throw err;
          logger.warn('[Clerk Webhook] Email conflict while updating user — keeping stored email', {
            clerkId: clerkUser.id,
          });
          await db.user.update({
            where: { id: existing.id },
            data: {
              name: displayName(clerkUser) ?? existing.name,
              image: clerkUser.image_url ?? existing.image,
            },
          });
        }
      } else if (email) {
        // Link a pre-Clerk account by email so libraries survive the migration.
        const legacy = await db.user.findFirst({ where: { email, clerkId: null } });
        if (legacy) {
          await db.user.update({
            where: { id: legacy.id },
            data: {
              clerkId: clerkUser.id,
              name: legacy.name ?? displayName(clerkUser),
              image: legacy.image ?? clerkUser.image_url ?? null,
            },
          });
          logger.info(`[Clerk Webhook] Linked legacy user ${legacy.id} to ${clerkUser.id}`);
        } else {
          try {
            await db.user.create({
              data: {
                clerkId: clerkUser.id,
                email,
                name: displayName(clerkUser),
                image: clerkUser.image_url ?? null,
              },
            });
            logger.info(`[Clerk Webhook] Provisioned user for ${clerkUser.id}`);
          } catch (err) {
            if (!isUniqueConstraintError(err)) throw err;
            // Lost a provisioning race (concurrent request or duplicate delivery).
            const raced = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
            if (raced) {
              logger.info(`[Clerk Webhook] User ${raced.id} already provisioned — skipping create`);
            } else {
              const byEmail = await db.user.findUnique({ where: { email } });
              if (byEmail?.clerkId === null) {
                // Legacy (pre-Clerk) row owns this email: claim it so libraries survive.
                await db.user.update({
                  where: { id: byEmail.id },
                  data: {
                    clerkId: clerkUser.id,
                    name: byEmail.name ?? displayName(clerkUser),
                    image: byEmail.image ?? clerkUser.image_url ?? null,
                  },
                });
                logger.info(`[Clerk Webhook] Linked legacy user ${byEmail.id} to ${clerkUser.id}`);
              } else {
                throw err;
              }
            }
          }
        }
      }
    } else if (evt.type === 'user.deleted') {
      await db.user.deleteMany({ where: { clerkId: evt.data.id } });
      logger.info(`[Clerk Webhook] Removed user for deleted Clerk ID ${evt.data.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error('[Clerk Webhook] Sync failed', {}, err as Error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
