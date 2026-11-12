import { describe, it, expect } from 'vitest';
import { isKeylessAuthMode, shouldUseKeylessAuth } from './auth-mode';

describe('shouldUseKeylessAuth', () => {
  it('uses real Clerk auth whenever a publishable key is configured', () => {
    expect(
      shouldUseKeylessAuth({
        hasPublishableKey: true,
        isProduction: false,
        allowKeylessAuth: false,
      }),
    ).toBe(false);
    expect(
      shouldUseKeylessAuth({
        hasPublishableKey: true,
        isProduction: true,
        allowKeylessAuth: false,
      }),
    ).toBe(false);
  });

  it('is keyless outside production when no key is configured (dev, tests, Playwright)', () => {
    expect(
      shouldUseKeylessAuth({
        hasPublishableKey: false,
        isProduction: false,
        allowKeylessAuth: false,
      }),
    ).toBe(true);
  });

  it('fails closed in production without an explicit opt-in', () => {
    expect(
      shouldUseKeylessAuth({
        hasPublishableKey: false,
        isProduction: true,
        allowKeylessAuth: false,
      }),
    ).toBe(false);
  });

  it('allows keyless production only with ALLOW_KEYLESS_AUTH (Lighthouse CI)', () => {
    expect(
      shouldUseKeylessAuth({
        hasPublishableKey: false,
        isProduction: true,
        allowKeylessAuth: true,
      }),
    ).toBe(true);
  });
});

describe('isKeylessAuthMode', () => {
  it('reads the current environment at call time', () => {
    const original = { ...process.env };
    try {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
      process.env.NODE_ENV = 'development';
      delete process.env.ALLOW_KEYLESS_AUTH;
      expect(isKeylessAuthMode()).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(isKeylessAuthMode()).toBe(false);

      process.env.ALLOW_KEYLESS_AUTH = 'true';
      expect(isKeylessAuthMode()).toBe(true);

      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_configured';
      expect(isKeylessAuthMode()).toBe(false);
    } finally {
      process.env = original;
    }
  });
});
