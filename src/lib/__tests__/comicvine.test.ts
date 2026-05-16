import { describe, it, expect } from 'vitest';
import { cleanTitle } from '../comicvine';

describe('cleanTitle', () => {
  it('removes file extensions', () => {
    expect(cleanTitle('Batman.cbz')).toBe('Batman');
    expect(cleanTitle('Saga.cbr')).toBe('Saga');
    expect(cleanTitle('Watchmen.zip')).toBe('Watchmen');
  });

  it('removes year in parentheses', () => {
    expect(cleanTitle('Spiderman (2022)')).toBe('Spiderman');
    expect(cleanTitle('X-Men (1963) #1')).toBe('X-Men #1');
  });

  it('removes brackets', () => {
    expect(cleanTitle('Batman [v1]')).toBe('Batman');
    expect(cleanTitle('Action Comics #1 [Digital]')).toBe('Action Comics #1');
  });

  it('handles multiple cleanups', () => {
    expect(cleanTitle('Justice League (2018) #01 [v2].cbz')).toBe('Justice League #01');
  });

  it('trims whitespace', () => {
    expect(cleanTitle('  Watchmen  ')).toBe('Watchmen');
  });
});
