import { describe, it, expect } from 'vitest';

describe('Resume Banner and Jump to Page Calculations', () => {
  it('calculates resume progress percentage accurately', () => {
    const calcResume = (initialPage: number, totalPages: number) => ({
      page: initialPage,
      total: totalPages,
      percent: Math.round(((initialPage + 1) / totalPages) * 100),
    });

    const info1 = calcResume(11, 24);
    expect(info1.page).toBe(11);
    expect(info1.total).toBe(24);
    expect(info1.percent).toBe(50);

    const info2 = calcResume(17, 36);
    expect(info2.percent).toBe(50);

    const info3 = calcResume(35, 36);
    expect(info3.percent).toBe(100);
  });

  it('validates jump page boundary inputs and clamping', () => {
    const totalPages = 32;

    const validateAndClamp = (inputStr: string) => {
      const parsed = parseInt(inputStr, 10);
      if (isNaN(parsed)) return null;
      if (parsed < 1 || parsed > totalPages) return null;
      return parsed - 1; // 0-indexed page
    };

    expect(validateAndClamp('1')).toBe(0);
    expect(validateAndClamp('15')).toBe(14);
    expect(validateAndClamp('32')).toBe(31);
    expect(validateAndClamp('0')).toBeNull();
    expect(validateAndClamp('33')).toBeNull();
    expect(validateAndClamp('abc')).toBeNull();
  });
});
