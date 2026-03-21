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

/**
 * Detects comic panels in an image using Recursive Gutter Splitting.
 * 
 * @param image - The ImageBitmap or HTMLImageElement to analyze.
 * @param options - Detection sensitivity options.
 * @returns An array of detected Panels.
 */
export async function detectPanels(
  image: ImageBitmap | HTMLImageElement,
  options = { threshold: 15, minPanelSize: 50, gutterWidth: 5 }
): Promise<Panel[]> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) throw new Error('Could not create detection canvas context');

  // 1. Preprocessing: Scale down for performance
  const MAX_DIM = 600;
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
      // Faster grayscale: (R + G*2 + B) >> 2
      const val = (data[px] + data[px + 1] * 2 + data[px + 2]) >> 2;
      sum += val;
      sumSq += val * val;
      count++;
    }

    const avg = sum / count;
    const variance = (sumSq / count) - (avg * avg);
    return variance;
  };

  const panels: BBox[] = [];

  /**
   * Recursive function to split a region into panels.
   */
  const splitRegion = (x: number, y: number, w: number, h: number, depth: number) => {
    if (depth > 5 || w < options.minPanelSize || h < options.minPanelSize) {
      panels.push({ x, y, width: w, height: h });
      return;
    }

    // Try Horizontal Split first
    let bestHGapStart = -1;
    let maxHGapSize = 0;
    let currentGapSize = 0;

    for (let i = 1; i < h - 1; i++) {
      const v = getVariance(true, y + i, x, x + w);
      if (v < options.threshold) {
        currentGapSize++;
      } else {
        if (currentGapSize > maxHGapSize) {
          maxHGapSize = currentGapSize;
          bestHGapStart = y + i - currentGapSize;
        }
        currentGapSize = 0;
      }
    }

    if (maxHGapSize >= options.gutterWidth) {
      const splitY = bestHGapStart + Math.floor(maxHGapSize / 2);
      splitRegion(x, y, w, splitY - y, depth + 1);
      splitRegion(x, splitY, w, y + h - splitY, depth + 1);
      return;
    }

    // Try Vertical Split
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

    if (maxVGapSize >= options.gutterWidth) {
      const splitX = bestVGapStart + Math.floor(maxVGapSize / 2);
      splitRegion(x, y, splitX - x, h, depth + 1);
      splitRegion(splitX, y, x + w - splitX, h, depth + 1);
      return;
    }

    // No splits found, it's a panel
    panels.push({ x, y, width: w, height: h });
  };

  splitRegion(0, 0, width, height, 0);

  // Map back to original image coordinates
  return panels.map(p => ({
    x: Math.round(p.x / scale),
    y: Math.round(p.y / scale),
    width: Math.round(p.width / scale),
    height: Math.round(p.height / scale)
  }));
}
