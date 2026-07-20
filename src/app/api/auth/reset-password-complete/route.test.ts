import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notifications';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$hashedpasswordhash'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe('POST /api/auth/reset-password-complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(rateLimit).mockResolvedValue({
      isLimited: false,
      remaining: 4,
      reset: Date.now() + 3600000,
      headers: {},
    });
  });

  function buildRequest(body: unknown) {
    return new Request('http://localhost:3100/api/auth/reset-password-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('should return 200 when valid token, email and password are provided', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as any);

    const req = buildRequest({
      email: 'user@example.com',
      token: 'valid-reset-token-abc123',
      newPassword: 'NewStr0ngP@ss!',
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('Password has been reset successfully');
  });

  it('should hash new password and update user record', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as any);

    const req = buildRequest({
      email: 'user@example.com',
      token: 'valid-reset-token',
      newPassword: 'NewStr0ngP@ss!',
    });
    await POST(req);

    expect(bcrypt.hash).toHaveBeenCalledWith('NewStr0ngP@ss!', 12);
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          password: '$2a$12$hashedpasswordhash',
          resetToken: null,
          resetTokenExpiry: null,
        }),
      }),
    );
  });

  it('should create a security notification after password change', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as any);

    const req = buildRequest({
      email: 'user@example.com',
      token: 'valid-reset-token',
      newPassword: 'NewStr0ngP@ss!',
    });
    await POST(req);

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'SYSTEM_ALERT',
        title: 'Password Changed',
      }),
    );
  });

  it('should return 400 when token is invalid or expired', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue(null);

    const req = buildRequest({
      email: 'user@example.com',
      token: 'expired-or-invalid-token',
      newPassword: 'NewStr0ngP@ss!',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid or expired reset token');
  });

  it('should return 400 when password is too weak (short)', async () => {
    const req = buildRequest({
      email: 'user@example.com',
      token: 'valid-token',
      newPassword: 'short',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('should return 400 when password is too weak (no uppercase)', async () => {
    const req = buildRequest({
      email: 'user@example.com',
      token: 'valid-token',
      newPassword: 'alllowercase1!',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when password is too weak (no special char)', async () => {
    const req = buildRequest({
      email: 'user@example.com',
      token: 'valid-token',
      newPassword: 'NoSpecialChar1',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when email is missing', async () => {
    const req = buildRequest({
      token: 'valid-token',
      newPassword: 'NewStr0ngP@ss!',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when token is missing', async () => {
    const req = buildRequest({
      email: 'user@example.com',
      newPassword: 'NewStr0ngP@ss!',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when newPassword is missing', async () => {
    const req = buildRequest({
      email: 'user@example.com',
      token: 'valid-token',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when body is empty object', async () => {
    const req = buildRequest({});
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      isLimited: true,
      remaining: 0,
      reset: Date.now() + 3600000,
      headers: { 'X-RateLimit-Limit': '5', 'X-RateLimit-Remaining': '0' },
    });

    const req = buildRequest({
      email: 'user@example.com',
      token: 'valid-token',
      newPassword: 'NewStr0ngP@ss!',
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain('Too many reset attempts');
  });

  it('should rate limit by IP address', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as any);

    const req = new Request('http://localhost:3100/api/auth/reset-password-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.100',
      },
      body: JSON.stringify({
        email: 'user@example.com',
        token: 'valid-token',
        newPassword: 'NewStr0ngP@ss!',
      }),
    });
    await POST(req);

    expect(rateLimit).toHaveBeenCalledWith('reset_complete_192.168.1.100', 5, 3600000);
  });

  it('should query for user with hashed token and non-expired expiry', async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
    } as any);

    const req = buildRequest({
      email: 'user@example.com',
      token: 'my-reset-token',
      newPassword: 'NewStr0ngP@ss!',
    });
    await POST(req);

    expect(db.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: 'user@example.com',
          resetToken: expect.any(String),
          resetTokenExpiry: {
            gt: expect.any(Date),
          },
        }),
      }),
    );
  });
});
