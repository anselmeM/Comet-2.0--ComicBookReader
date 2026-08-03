import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    invitation: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    friendship: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
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

describe('POST /api/auth/register', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(rateLimit).mockResolvedValue({
      isLimited: false,
      remaining: 4,
      reset: Date.now() + 3600000,
      headers: {},
    });

    vi.mocked(db.invitation.findMany).mockResolvedValue([]);

    vi.mocked(db.user.create).mockResolvedValue({
      id: 'new-user-id',
      email: 'test@example.com',
      name: 'Test User',
    } as any);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function buildRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
    return new Request('http://localhost:3100/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });
  }

  it('should return 201 when valid registration data is provided', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = buildRequest(
      { name: 'Test User', email: 'test@example.com', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.message).toBe('User created successfully');
    expect(data.user).toBeDefined();
    expect(data.user.id).toBe('new-user-id');
  });

  it('should hash password before saving user', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = buildRequest(
      { name: 'Test User', email: 'test@example.com', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    await POST(req);

    expect(bcrypt.hash).toHaveBeenCalledWith('StrongP@ssw0rd!', 14);
    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          password: '$2a$12$hashedpasswordhash',
        }),
      }),
    );
  });

  it('should return 409 when email is already registered', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
    } as any);

    const req = buildRequest(
      { name: 'Test User', email: 'test@example.com', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('User with this email already exists');
    expect(data.code).toBe('USER_EXISTS');
  });

  it('should return 400 when password is too short', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';

    const req = buildRequest(
      { name: 'Test', email: 'test@example.com', password: 'Short1!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('should return 400 when password lacks uppercase', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';

    const req = buildRequest(
      { name: 'Test', email: 'test@example.com', password: 'nouppercase1!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when password lacks lowercase', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';

    const req = buildRequest(
      { name: 'Test', email: 'test@example.com', password: 'NOLOWERCASE1!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when password lacks a digit', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';

    const req = buildRequest(
      { name: 'Test', email: 'test@example.com', password: 'NoDigitsHere!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when password lacks special character', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';

    const req = buildRequest(
      { name: 'Test', email: 'test@example.com', password: 'NoSpecialChar1' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when email is invalid', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';

    const req = buildRequest(
      { name: 'Test', email: 'not-an-email', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when name is missing', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';

    const req = buildRequest(
      { email: 'test@example.com', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 403 when origin does not match allowed origins', async () => {
    process.env.NEXTAUTH_URL = 'https://myapp.com';
    process.env.NODE_ENV = 'production';

    const req = buildRequest(
      { name: 'Test', email: 'test@example.com', password: 'StrongP@ssw0rd!' },
      { origin: 'http://evil.com' },
    );
    const res = await POST(req);

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Invalid request origin');
  });

  it('should return 403 when referer origin does not match allowed origins', async () => {
    process.env.NEXTAUTH_URL = 'https://myapp.com';
    process.env.NODE_ENV = 'production';

    const req = new Request('http://localhost:3100/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        referer: 'http://evil.com/register-page',
      },
      body: JSON.stringify({
        name: 'Test',
        email: 'test@example.com',
        password: 'StrongP@ssw0rd!',
      }),
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('should return 429 when rate limited', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';
    vi.mocked(rateLimit).mockResolvedValue({
      isLimited: true,
      remaining: 0,
      reset: Date.now() + 3600000,
      headers: { 'X-RateLimit-Limit': '5', 'X-RateLimit-Remaining': '0' },
    });

    const req = buildRequest(
      { name: 'Test', email: 'test@example.com', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    const res = await POST(req);

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.message).toContain('Too many registration attempts');
  });

  it('should rate limit by IP address', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3100/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'http://localhost:3100',
        'x-forwarded-for': '10.0.0.1',
      },
      body: JSON.stringify({
        name: 'Test',
        email: 'test@example.com',
        password: 'StrongP@ssw0rd!',
      }),
    });
    await POST(req);

    expect(rateLimit).toHaveBeenCalledWith('reg_10.0.0.1', 5, 3600000);
  });

  it('should default to 127.0.0.1 when x-forwarded-for is absent', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = buildRequest(
      { name: 'Test', email: 'test@example.com', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    await POST(req);

    expect(rateLimit).toHaveBeenCalledWith('reg_127.0.0.1', 5, 3600000);
  });

  it('should lower-case email before saving', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    const req = buildRequest(
      { name: 'Test User', email: 'Test@Example.COM', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    await POST(req);

    expect(db.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
        }),
      }),
    );
  });

  it('should process pending invitations for new user', async () => {
    process.env.NEXTAUTH_URL = 'http://localhost:3100';
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.invitation.findMany).mockResolvedValue([
      { id: 'inv-1', senderId: 'sender-1', email: 'test@example.com', status: 'PENDING' },
      { id: 'inv-2', senderId: 'sender-2', email: 'test@example.com', status: 'PENDING' },
    ] as any);

    const req = buildRequest(
      { name: 'Test User', email: 'test@example.com', password: 'StrongP@ssw0rd!' },
      { origin: 'http://localhost:3100' },
    );
    await POST(req);

    expect(db.$transaction).toHaveBeenCalled();
    expect(db.invitation.updateMany).toHaveBeenCalledWith({
      where: { email: 'test@example.com', status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });
  });
});
