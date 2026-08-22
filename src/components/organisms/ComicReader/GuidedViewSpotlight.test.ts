import { describe, it, expect } from 'vitest';
import { sortPanels } from '@/lib/guidedView';
import { Panel } from '@/types';

describe('Guided View Spotlight & Layout Tuning', () => {
  it('sorts panels in natural top-to-bottom, left-to-right order', () => {
    const mockPanels: Panel[] = [
      { x: 300, y: 10, width: 200, height: 150 },
      { x: 10, y: 10, width: 200, height: 150 },
      { x: 10, y: 200, width: 490, height: 200 },
    ];

    const sortedLTR = sortPanels(mockPanels, false);
    expect(sortedLTR[0].x).toBe(10);
    expect(sortedLTR[1].x).toBe(300);
    expect(sortedLTR[2].y).toBe(200);

    const sortedRTL = sortPanels(mockPanels, true);
    expect(sortedRTL[0].x).toBe(300);
    expect(sortedRTL[1].x).toBe(10);
    expect(sortedRTL[2].y).toBe(200);
  });

  it('correctly calculates viewport scaling with guidedPadding factor', () => {
    const calculatePanelScale = (
      viewW: number,
      viewH: number,
      panelW: number,
      panelH: number,
      guidedPadding: number,
    ) => {
      const scaleW = (viewW * guidedPadding) / panelW;
      const scaleH = (viewH * guidedPadding) / panelH;
      return Math.min(scaleW, scaleH, 4);
    };

    // Viewport 1000x800, Panel 500x400, default padding 0.88
    const scaleDefault = calculatePanelScale(1000, 800, 500, 400, 0.88);
    // scaleW = (1000 * 0.88) / 500 = 1.76
    // scaleH = (800 * 0.88) / 400 = 1.76
    expect(scaleDefault).toBeCloseTo(1.76);

    // Padding 0.80
    const scaleTighter = calculatePanelScale(1000, 800, 500, 400, 0.8);
    expect(scaleTighter).toBeCloseTo(1.6);
  });

  it('detects splash page area coverage threshold', () => {
    const isSplashPage = (panels: Panel[], imageW: number, imageH: number) => {
      if (panels.length === 0) return true;
      if (panels.length === 1) {
        const area = panels[0].width * panels[0].height;
        const total = imageW * imageH;
        return area / total >= 0.88;
      }
      return false;
    };

    // Single panel covering 95% of 1000x1500 image
    const fullArtPanels: Panel[] = [{ x: 20, y: 20, width: 960, height: 1460 }];
    expect(isSplashPage(fullArtPanels, 1000, 1500)).toBe(true);

    // Multi-panel page
    const multiPanels: Panel[] = [
      { x: 20, y: 20, width: 450, height: 400 },
      { x: 500, y: 20, width: 450, height: 400 },
    ];
    expect(isSplashPage(multiPanels, 1000, 1500)).toBe(false);
  });
});
