export async function register() {
  if (process.env.NEXT_RUNTIME === 'client') {
    await import('../sentry.client.config');
  }
}
