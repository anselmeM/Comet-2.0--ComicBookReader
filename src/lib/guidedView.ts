/**
 * @file Guided View Panel Detection Algorithm
 * Uses Recursive Gutter Splitting (RGS) to identify panel boundaries.
 */

import { Panel } from '@/types';

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

import { getSharedCanvas } from './canvas';

/**
 * Detects comic panels in an image using Recursive Gutter Splitting.
 *
 * @param image - The ImageBitmap or HTMLImageElement to analyze.
 * @param options - Detection sensitivity options.
 * @returns An array of detected Panels.
 */
export async function detectPanels(
  image: ImageBitmap | HTMLImageElement,
  options = { threshold: 22, minPanelSize: 60, gutterWidth: 6, maxDepth: 12 },
): Promise<Panel[]> {
  const canvas = getSharedCanvas();
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) throw new Error('Could not create detection canvas context');

  // 1. Preprocessing: Scale down for performance
  const MAX_DIM = 800; // Increased for better accuracy
  const scale = Math.min(MAX_DIM / image.width, MAX_DIM / image.height, 1);
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  // Helper: Get grayscale variance for a line or column
  const getVariance = (isRow: boolean, index: number, start: number, end: number) => {
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    for (let i = start; i < end; i++) {
      const px = isRow ? (index * width + i) * 4 : (i * width + index) * 4;
      const r = data[px];
      const g = data[px + 1];
      const b = data[px + 2];
      // Grayscale value
      const val = r * 0.299 + g * 0.587 + b * 0.114;
      sum += val;
      sumSq += val * val;
      count++;
    }

    const avg = sum / count;
    const variance = sumSq / count - avg * avg;
    return variance;
  };

  const panels: BBox[] = [];

  /**
   * Trims whitespace from the edges of a detected panel.
   */
  const trimPanel = (p: BBox): BBox => {
    let { x, y, width: w, height: h } = p;

    // Trim from top
    while (h > options.minPanelSize && getVariance(true, y, x, x + w) < options.threshold) {
      y++;
      h--;
    }
    // Trim from bottom
    while (
      h > options.minPanelSize &&
      getVariance(true, Math.max(0, y + h - 1), x, x + w) < options.threshold
    ) {
      h--;
    }
    // Trim from left
    while (w > options.minPanelSize && getVariance(false, x, y, y + h) < options.threshold) {
      x++;
      w--;
    }
    // Trim from right
    while (
      w > options.minPanelSize &&
      getVariance(false, Math.max(0, x + w - 1), y, y + h) < options.threshold
    ) {
      w--;
    }

    return { x, y, width: w, height: h };
  };

  /**
   * Recursive function to split a region into panels.
   */
  const splitRegion = (x: number, y: number, w: number, h: number, depth: number) => {
    if (depth > options.maxDepth || w < options.minPanelSize || h < options.minPanelSize) {
      panels.push(trimPanel({ x, y, width: w, height: h }));
      return;
    }

    // Look for the best split (either H or V)
    let bestHGapStart = -1;
    let maxHGapSize = 0;
    let currentHGapSize = 0;

    for (let i = 1; i < h - 1; i++) {
      const v = getVariance(true, y + i, x, x + w);
      if (v < options.threshold) {
        currentHGapSize++;
      } else {
        if (currentHGapSize > maxHGapSize) {
          maxHGapSize = currentHGapSize;
          bestHGapStart = y + i - currentHGapSize;
        }
        currentHGapSize = 0;
      }
    }

    let bestVGapStart = -1;
    let maxVGapSize = 0;
    let currentVGapSize = 0;

    for (let i = 1; i < w - 1; i++) {
      const v = getVariance(false, x + i, y, y + h);
      if (v < options.threshold) {
        currentVGapSize++;
      } else {
        if (currentVGapSize > maxVGapSize) {
          maxVGapSize = currentVGapSize;
          bestVGapStart = x + i - currentVGapSize;
        }
        currentVGapSize = 0;
      }
    }

    // Decide which direction to split based on the largest gutter
    if (maxHGapSize >= options.gutterWidth && maxHGapSize >= maxVGapSize) {
      const splitY = bestHGapStart + Math.floor(maxHGapSize / 2);
      splitRegion(x, y, w, splitY - y, depth + 1);
      splitRegion(x, splitY, w, y + h - splitY, depth + 1);
    } else if (maxVGapSize >= options.gutterWidth) {
      const splitX = bestVGapStart + Math.floor(maxVGapSize / 2);
      splitRegion(x, y, splitX - x, h, depth + 1);
      splitRegion(splitX, y, x + w - splitX, h, depth + 1);
    } else {
      // No splits found, it's a panel
      panels.push(trimPanel({ x, y, width: w, height: h }));
    }
  };

  splitRegion(0, 0, width, height, 0);

  const rawPanels = panels
    .filter((p) => {
      if (p.width < options.minPanelSize || p.height < options.minPanelSize) return false;
      // Filter extreme thin strips that are gutter/dialogue slice artifacts
      const aspectRatio = p.width / p.height;
      if ((aspectRatio > 8 || aspectRatio < 0.125) && (p.width < 100 || p.height < 100)) {
        return false;
      }
      return true;
    })
    .map((p) => {
      const px = Math.round(p.x / scale);
      const py = Math.round(p.y / scale);
      const pw = Math.round(p.width / scale);
      const ph = Math.round(p.height / scale);

      const clampedX = Math.max(0, Math.min(image.width - 10, px));
      const clampedY = Math.max(0, Math.min(image.height - 10, py));
      const clampedW = Math.max(options.minPanelSize, Math.min(image.width - clampedX, pw));
      const clampedH = Math.max(options.minPanelSize, Math.min(image.height - clampedY, ph));

      return {
        x: clampedX,
        y: clampedY,
        width: clampedW,
        height: clampedH,
      };
    });

  // Splash page detection: if no panels found or single panel covers >90% area
  const totalImageArea = image.width * image.height;
  if (rawPanels.length === 0) {
    return [{ x: 0, y: 0, width: image.width, height: image.height }];
  }

  if (rawPanels.length === 1) {
    const singlePanelArea = rawPanels[0].width * rawPanels[0].height;
    if (singlePanelArea / totalImageArea >= 0.88) {
      return [{ x: 0, y: 0, width: image.width, height: image.height }];
    }
  }

  return sortPanels(rawPanels);
}

/**
 * Sorts panels in reading order (Top-to-Bottom, Left-to-Right).
 */
export function sortPanels(panels: Panel[], rtl = false): Panel[] {
  return [...panels].sort((a, b) => {
    // 1. Group by rows (if Y difference is small, they are in the same row)
    const rowThreshold = 50;
    const yDiff = a.y - b.y;

    if (Math.abs(yDiff) > rowThreshold) {
      return yDiff;
    }

    // 2. Sort by X within the row
    return rtl ? b.x - a.x : a.x - b.x;
  });
}
