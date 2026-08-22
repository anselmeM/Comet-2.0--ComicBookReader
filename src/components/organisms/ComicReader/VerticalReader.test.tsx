import { describe, it, expect } from 'vitest';

describe('Vertical (Webtoon) Mode Virtualization and Dividers', () => {
  it('correctly calculates estimated page sizes based on aspect ratios', () => {
    const pages = [
      { width: 800, height: 1200 }, // aspect ratio 1.5
      { width: 1000, height: 2000 }, // aspect ratio 2.0
      { width: 800, height: 800 }, // aspect ratio 1.0 (square)
    ];

    const containerWidth = 800;

    const estimateSize = (index: number) => {
      const page = pages[index];
      if (page?.width && page?.height) {
        return (page.height / page.width) * containerWidth + 48;
      }
      return 1200;
    };

    expect(estimateSize(0)).toBe(1.5 * 800 + 48); // 1248
    expect(estimateSize(1)).toBe(2.0 * 800 + 48); // 1648
    expect(estimateSize(2)).toBe(1.0 * 800 + 48); // 848
  });

  it('formats page badges accurately for dividers', () => {
    const totalPages = 45;
    const formatBadge = (index: number) => `Page ${index + 1} of ${totalPages}`;

    expect(formatBadge(0)).toBe('Page 1 of 45');
    expect(formatBadge(24)).toBe('Page 25 of 45');
    expect(formatBadge(44)).toBe('Page 45 of 45');
  });
});
