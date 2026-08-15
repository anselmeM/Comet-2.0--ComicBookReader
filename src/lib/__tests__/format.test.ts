import { describe, expect, it } from 'vitest';
import { formatBytes, formatDuration, formatTimeAgo } from '../format';
import { cn } from '../cn';

describe('formatTimeAgo', () => {
  it('returns just now for < 60s', () => {
    expect(formatTimeAgo(new Date())).toBe('just now');
  });

  it('formats minutes, hours and days', () => {
    const now = Date.now();
    expect(formatTimeAgo(new Date(now - 5 * 60 * 1000))).toBe('5m ago');
    expect(formatTimeAgo(new Date(now - 3 * 60 * 60 * 1000))).toBe('3h ago');
    expect(formatTimeAgo(new Date(now - 2 * 24 * 60 * 60 * 1000))).toBe('2d ago');
  });

  it('falls back to a locale date for older timestamps', () => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(d)).toBe(d.toLocaleDateString());
  });
});

describe('formatDuration', () => {
  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(45)).toBe('45s');
    expect(formatDuration(600)).toBe('10m');
    expect(formatDuration(9000)).toBe('2h 30m');
    expect(formatDuration(7200)).toBe('2h');
  });
});

describe('formatBytes', () => {
  it('formats sizes', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('cn', () => {
  it('merges and dedupes conflicting classes', () => {
    expect(cn('p-3', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', false && 'text-blue-500', 'font-bold')).toBe(
      'text-red-500 font-bold',
    );
  });
});
