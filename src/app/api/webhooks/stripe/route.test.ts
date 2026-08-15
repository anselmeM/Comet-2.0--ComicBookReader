import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  function mockHeaders(signature: string | null) {
    const get = vi.fn((key: string) => {
      if (key === 'Stripe-Signature') return signature;
      return null;
    });
    vi.mocked(headers).mockResolvedValue({ get } as any);
  }

  function buildRequest(body: string, signature: string | null) {
    mockHeaders(signature);
    return new Request('http://localhost:3100/api/webhooks/stripe', {
      method: 'POST',
      body,
    });
  }

  it('should return 400 when stripe-signature header is missing', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const req = buildRequest('{}', null);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should return 400 when signature is invalid', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const req = buildRequest('{"type":"checkout.session.completed"}', 'invalid_signature');
    const res = await POST(req);

    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain('Webhook Error');
  });

  it('should update user plan on checkout.session.completed event', async () => {
    const mockSubscription = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
      items: { data: [{ price: { id: 'price_test_123' } }] },
      current_period_end: Math.floor(Date.now() / 1000) + 3600,
    };

    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          subscription: 'sub_test_123',
          metadata: { userId: 'user-123' },
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as any);

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledWith(
      JSON.stringify(mockEvent),
      'valid_signature',
      'whsec_test_secret',
    );
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123');
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: expect.objectContaining({
        stripeSubscriptionId: 'sub_test_123',
        stripeCustomerId: 'cus_test_123',
        stripePriceId: 'price_test_123',
        plan: 'PREMIUM',
      }),
    });
  });

  it('should return 400 on checkout.session.completed when userId metadata is missing', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_no_user',
          subscription: 'sub_test',
          metadata: {},
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('should update user on invoice.payment_succeeded event', async () => {
    const mockSubscription = {
      id: 'sub_test_456',
      items: { data: [{ price: { id: 'price_updated' } }] },
      current_period_end: Math.floor(Date.now() / 1000) + 7200,
    };

    const mockEvent = {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          subscription: 'sub_test_456',
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as any);

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_test_456' },
      data: expect.objectContaining({
        stripePriceId: 'price_updated',
      }),
    });
  });

  it('should downgrade user to FREE on customer.subscription.deleted event', async () => {
    const mockSubscription = {
      id: 'sub_cancelled',
    };

    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: mockSubscription,
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_cancelled' },
      data: expect.objectContaining({
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
        plan: 'FREE',
      }),
    });
  });

  it('should return 200 for unsupported event types (acknowledged)', async () => {
    const mockEvent = {
      type: 'charge.succeeded',
      data: {
        object: { id: 'ch_123' },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
  });

  it('acknowledges checkout without a subscription (one-off payment)', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_oneoff',
          subscription: null, // one-off payment, no subscription
          metadata: { userId: 'user-123' },
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('returns 500 (retryable) when subscription retrieval fails', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          subscription: 'sub_test_123',
          metadata: { userId: 'user-123' },
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);
    vi.mocked(stripe.subscriptions.retrieve).mockRejectedValue(new Error('stripe down'));

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('returns 500 (retryable) when the subscription has no price items', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          subscription: 'sub_test_123',
          metadata: { userId: 'user-123' },
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      id: 'sub_test_123',
      items: { data: [] }, // no price items → cannot determine plan
      current_period_end: Math.floor(Date.now() / 1000) + 3600,
    } as any);

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('acknowledges invoice.payment_succeeded without a subscription', async () => {
    const mockEvent = {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_oneoff',
          subscription: null, // one-off invoice
        },
      },
    };

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as any);

    const req = buildRequest(JSON.stringify(mockEvent), 'valid_signature');
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(stripe.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(db.user.update).not.toHaveBeenCalled();
  });
});
