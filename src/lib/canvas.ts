/**
 * @file Singleton Canvas Pool
 * Provides a shared canvas instance to prevent memory leaks and garbage collection thrashing
 * caused by creating multiple HTMLCanvasElements across the application.
 */

let sharedCanvas: HTMLCanvasElement | null = null;

/**
 * Gets or creates a singleton canvas element.
 * MUST be called from the browser environment (client-side only).
 *
 * @param width Optional target width
 * @param height Optional target height
 * @returns A shared HTMLCanvasElement
 */
export function getSharedCanvas(width?: number, height?: number): HTMLCanvasElement {
  if (typeof window === 'undefined') {
    throw new Error('Canvas can only be instantiated in the browser environment.');
  }

  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
  }

  if (width !== undefined) sharedCanvas.width = width;
  if (height !== undefined) sharedCanvas.height = height;

  return sharedCanvas;
}
