import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');

    // Surface missing critical env at startup — loudly, but don't crash the
    // server: valid configurations exist without these (e.g. CI Lighthouse
    // serves the public landing page with no auth keys), and the features
    // that need them already fail with clear errors when used (Clerk throws,
    // prisma reports the datasource).
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
      const required = ['CLERK_SECRET_KEY', 'DATABASE_URL'];
      const missing = required.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        console.error(
          `[env] Missing critical environment variables in production: ${missing.join(', ')}`,
        );
      }
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
