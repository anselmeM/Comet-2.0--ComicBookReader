/**
 * @file Prisma Client Singleton
 * 
 * Prevents multiple PrismaClient instances during Next.js hot-reload in development.
 * Must only be imported in Server Components and API routes — never in client code.
 * 
 * @example
 * import { db } from '@/lib/db';
 * const comics = await db.comic.findMany({ where: { userId } });
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
