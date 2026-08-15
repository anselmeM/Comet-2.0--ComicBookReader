/**
 * Shared helpers for API route tests.
 *
 * Routes are exercised directly: `@/lib/api-middleware`'s `withAuth` is mocked
 * to identity in each spec, so handlers receive a fake session; `@/lib/db` is
 * mocked to a per-test `createMockDb()` whose instances are wired through
 * `vi.hoisted` + `Object.assign` so tests can set return values.
 */
import { vi } from 'vitest';

export const fakeSession = {
  user: {
    id: 'user-1',
    plan: 'FREE',
    hasCompletedOnboarding: true,
    name: 'Test User',
    email: 'test@example.com',
  },
};

/** Build a JSON request (used by POST/PUT handlers). */
export function jsonRequest(url: string, body?: unknown, init: RequestInit = {}): Request {
  return new Request(url, {
    method: init.method ?? 'POST',
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    body: body === undefined ? (init.body as BodyInit | undefined) : JSON.stringify(body),
    ...init,
  });
}

/** Build a GET request. */
export function getRequest(url: string, init: RequestInit = {}): Request {
  return new Request(url, { method: 'GET', ...init });
}

/**
 * A prisma-like mock covering every model the tested routes touch. The
 * interactive `$transaction(fn)` runs `fn(mockDb)` so the callback receives
 * the same mocked models; array transactions resolve in parallel.
 */
export function createMockDb() {
  const db: Record<string, any> = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    comic: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    readingProgress: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    readingSession: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    invitation: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    friendship: {
      create: vi.fn(),
    },
    userBadge: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  };

  db.$transaction = vi.fn(async (arg: unknown) => {
    if (typeof arg === 'function') return arg(db);
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg;
  });

  return db;
}
