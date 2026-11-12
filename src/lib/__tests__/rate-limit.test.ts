import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Exercises only the in-memory fallback in `rate-limit.ts` (no Upstash client is
 * configured). The memory store lives at module scope, so every test uses a
 * unique key and re-imports the module to keep state isolated.
 */
describe('rateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    // Empty values are falsy, so the module skips Redis and uses memory.
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('enforces a custom limit instead of a hard-coded default', async () => {
    const { rateLimit } = await import('../rate-limit');
    const key = `custom-limit-${Math.random()}`;

    const first = await rateLimit(key, 2, 60_000);
    const second = await rateLimit(key, 2, 60_000);
    const third = await rateLimit(key, 2, 60_000);

    expect(first.isLimited).toBe(false);
    expect(first.remaining).toBe(1);
    expect(second.isLimited).toBe(false);
    expect(second.remaining).toBe(0);
    expect(third.isLimited).toBe(true);
    expect(third.remaining).toBe(0);
    expect(third.headers['X-RateLimit-Limit']).toBe('2');
  });

  it('resets the budget once the custom window elapses', async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import('../rate-limit');
    const key = `custom-window-${Math.random()}`;

    expect((await rateLimit(key, 1, 1_000)).isLimited).toBe(false);
    expect((await rateLimit(key, 1, 1_000)).isLimited).toBe(true);

    await vi.advanceTimersByTimeAsync(1_001);

    expect((await rateLimit(key, 1, 1_000)).isLimited).toBe(false);
  });
});
