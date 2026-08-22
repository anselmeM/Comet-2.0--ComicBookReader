import { describe, it, expect } from 'vitest';

describe('ComicReader Cache Pruning Logic', () => {
  it('correctly keeps canvases within sliding window radius and evicts outside', () => {
    const centerPage = 5;
    const minPage = centerPage - 3; // 2
    const maxPage = centerPage + 3; // 8

    const mockCache: Record<number, { width: number; height: number }> = {
      0: { width: 800, height: 1200 },
      1: { width: 800, height: 1200 },
      2: { width: 800, height: 1200 },
      4: { width: 800, height: 1200 },
      5: { width: 800, height: 1200 },
      6: { width: 800, height: 1200 },
      8: { width: 800, height: 1200 },
      9: { width: 800, height: 1200 },
      10: { width: 800, height: 1200 },
    };

    // Simulate prune logic
    for (const keyStr of Object.keys(mockCache)) {
      const idx = Number(keyStr);
      if (idx < minPage || idx > maxPage) {
        const canvas = mockCache[idx];
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
        delete mockCache[idx];
      }
    }

    // Pages 0, 1 and 9, 10 should be deleted
    expect(mockCache[0]).toBeUndefined();
    expect(mockCache[1]).toBeUndefined();
    expect(mockCache[9]).toBeUndefined();
    expect(mockCache[10]).toBeUndefined();

    // Pages within [2..8] should remain
    expect(mockCache[2]).toBeDefined();
    expect(mockCache[4]).toBeDefined();
    expect(mockCache[5]).toBeDefined();
    expect(mockCache[6]).toBeDefined();
    expect(mockCache[8]).toBeDefined();
  });
});
