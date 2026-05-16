/**
 * @file Low-level utilities for comic processing.
 */

/**
 * Computes a fast, collision-resistant hash for a comic file.
 * Uses a combination of metadata and the first 1KB of content.
 */
export async function computeFileHash(file: File): Promise<string> {
  const slice = file.slice(0, 1024);
  const buffer = await slice.arrayBuffer();

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return `${file.name}-${file.size}-${hex}`;
}

import { COMIC_CONFIG } from './constants';

/**
 * Compresses a comic page for use as a cover image.
 */
export async function generateCoverDataUrl(
  blob: Blob,
  maxDim = COMIC_CONFIG.MAX_COVER_DIMENSION,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');

      const { width, height } = calculateDimensions(img.width, img.height, maxDim);
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      ctx.drawImage(img, 0, 0, width, height);

      // Initial compress
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);

      // Aggressive fallback if still too large
      if (dataUrl.length > 70000) {
        resolve(canvas.toDataURL('image/jpeg', 0.3));
      } else {
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };

    img.src = url;
  });
}

/**
 * Calculates new dimensions while maintaining aspect ratio.
 */
function calculateDimensions(width: number, height: number, maxDim: number) {
  if (width <= maxDim && height <= maxDim) return { width, height };

  if (width > height) {
    return {
      width: maxDim,
      height: Math.round((height * maxDim) / width),
    };
  }

  return {
    width: Math.round((width * maxDim) / height),
    height: maxDim,
  };
}
