import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(rateLimit).mockResolvedValue({
      isLimited: false,
      remaining: 2,
      reset: Date.now() + 3600000,
      headers: {},
    });
  });

  function buildRequest(body: unknown) {
    return new Request('http://localhost:3100/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it("should return 200 with generic message when email is valid (don't reveal user existence)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as any);

    const req = buildRequest({ email: 'user@example.com' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('If an account exists, a reset link will be sent');
  });

  it("should return 200 when user does not exist (don't reveal user existence)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = buildRequest({ email: 'nonexistent@example.com' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('If an account exists, a reset link will be sent');
  });

  it('should return 400 when email format is invalid', async () => {
    const req = buildRequest({ email: 'not-an-email' });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('should return 500 when body is missing', async () => {
    const req = new Request('http://localhost:3100/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
  });

  it('should return 400 when body is empty object', async () => {
    const req = buildRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 429 after rate limit is exceeded', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      isLimited: true,
      remaining: 0,
      reset: Date.now() + 3600000,
      headers: { 'X-RateLimit-Limit': '3', 'X-RateLimit-Remaining': '0' },
    });

    const req = buildRequest({ email: 'user@example.com' });
    const res = await POST(req);

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain('Too many reset attempts');
  });

  it('should pass lowercased email through rate limiter', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    } as any);

    const req = buildRequest({ email: 'Test@Example.COM' });
    await POST(req);

    expect(rateLimit).toHaveBeenCalledWith('reset_test@example.com', 3, 3600000);
  });

  it('should save hashed reset token to database when user exists', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    } as any);

    const req = buildRequest({ email: 'test@example.com' });
    await POST(req);

    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        }),
      }),
    );
  });
});
