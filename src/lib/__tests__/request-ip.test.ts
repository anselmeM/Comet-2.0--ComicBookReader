import { describe, expect, it } from 'vitest';
import { getClientIp } from '../request-ip';

function req(headers: Record<string, string>): Request {
  return new Request('http://test/api', { headers });
}

describe('getClientIp', () => {
  it('prefers x-real-ip over forwarded headers', () => {
    expect(
      getClientIp(
        req({
          'x-real-ip': '203.0.113.9',
          'x-vercel-forwarded-for': '198.51.100.1',
          'x-forwarded-for': '192.0.2.1, 10.0.0.1',
        }),
      ),
    ).toBe('203.0.113.9');
  });

  it('falls back to the first entry of x-vercel-forwarded-for', () => {
    expect(getClientIp(req({ 'x-vercel-forwarded-for': '198.51.100.1, 10.0.0.1' }))).toBe(
      '198.51.100.1',
    );
  });

  it('falls back to the first entry of x-forwarded-for', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '192.0.2.1, 10.0.0.1' }))).toBe('192.0.2.1');
  });

  it('defaults to loopback when no headers are present', () => {
    expect(getClientIp(req({}))).toBe('127.0.0.1');
  });
});
