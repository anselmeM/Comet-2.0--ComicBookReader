import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');

    // Fail fast with a clear message when critical env is missing at runtime.
    // Skipped during `next build` (NEXT_PHASE=phase-production-build) so the
    // CI build isn't blocked — only the running server validates.
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      const required = ['AUTH_SECRET', 'DATABASE_URL'];
      const missing = required.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(
          `Missing required environment variables in production: ${missing.join(', ')}`,
        );
      }
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
