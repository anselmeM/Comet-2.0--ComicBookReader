/**
 * @file Narrow Prisma error guards shared by server-side modules.
 */
import { Prisma } from '@prisma/client';

/**
 * Returns true when the error is a Prisma unique-constraint violation (P2002).
 *
 * Used to recover from concurrent provisioning races (two requests, or a request
 * and the Clerk webhook, both creating the same `User` row).
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
