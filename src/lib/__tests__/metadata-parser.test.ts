import { describe, it, expect } from 'vitest';
import {
  parseComicFilename,
  parseStoredMetadata,
  serializeStoredMetadata,
} from '../metadata-parser';

describe('parseComicFilename', () => {
  it('should parse standard format with hash and year', () => {
    const res = parseComicFilename('Amazing Spider-Man #129 (1974).cbz');
    expect(res.series).toBe('Amazing Spider-Man');
    expect(res.issue).toBe(129);
    expect(res.year).toBe(1974);
  });

  it('should parse format with no hash but issue and year', () => {
    const res = parseComicFilename('The Sandman 01 (1989).cbr');
    expect(res.series).toBe('The Sandman');
    expect(res.issue).toBe(1);
    expect(res.year).toBe(1989);
  });

  it('should parse format with version tag', () => {
    const res = parseComicFilename('Batman v1 004.cbz');
    expect(res.series).toBe('Batman v1');
    expect(res.issue).toBe(4);
    expect(res.year).toBeNull();
  });

  it('should parse format with dash separator', () => {
    const res = parseComicFilename('X-Men - 023.zip');
    expect(res.series).toBe('X-Men');
    expect(res.issue).toBe(23);
    expect(res.year).toBeNull();
  });

  it('should parse format with naked year at the end', () => {
    const res = parseComicFilename('Ultimate Spider-Man 2002.cbz');
    expect(res.series).toBe('Ultimate Spider-Man');
    expect(res.issue).toBeNull();
    expect(res.year).toBe(2002);
  });

  it('should handle clean titles with no year or issue', () => {
    const res = parseComicFilename('Watchmen.cbz');
    expect(res.series).toBe('Watchmen');
    expect(res.issue).toBeNull();
    expect(res.year).toBeNull();
  });
});

describe('serializeStoredMetadata', () => {
  it('returns undefined for null/undefined so Prisma omits the Json field', () => {
    expect(serializeStoredMetadata(null)).toBeUndefined();
    expect(serializeStoredMetadata(undefined)).toBeUndefined();
  });

  it('passes through already-serialized strings', () => {
    expect(serializeStoredMetadata('{"series":"Watchmen"}')).toBe('{"series":"Watchmen"}');
  });

  it('JSON-stringifies objects', () => {
    expect(serializeStoredMetadata({ series: 'Watchmen', issue: 1 })).toBe(
      '{"series":"Watchmen","issue":1}',
    );
  });

  it('round-trips through parseStoredMetadata', () => {
    const original = { series: 'Sandman', issue: 22, year: 1989 };
    expect(parseStoredMetadata(serializeStoredMetadata(original))).toEqual(original);
  });
});
