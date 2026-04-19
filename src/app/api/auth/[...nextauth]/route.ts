import { handlers } from '@/auth';

/**
 * Auth.js v5 route handler for Next.js App Router.
 * Handles GET and POST for all /api/auth/* paths.
 */
export const { GET, POST } = handlers;

// Force Node.js runtime to ensure Prisma and bcryptjs work correctly
export const runtime = 'nodejs';
