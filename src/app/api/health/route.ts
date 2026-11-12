/**
 * @file GET /api/health — App status and health monitoring
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Check database connection
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: 'UP',
        timestamp: new Date().toISOString(),
        services: {
          database: 'UP',
        },
        uptime: process.uptime(),
      },
      { status: 200 },
    );
  } catch (error) {
    // Log the real cause server-side; never expose DB/driver details (which can
    // include host/port/credentials) to an unauthenticated caller.
    logger.error(
      'Healthcheck failed',
      {},
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json(
      {
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        services: {
          database: 'DOWN',
        },
      },
      { status: 500 },
    );
  }
}
