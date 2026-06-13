'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

// Extended Document type to include vendor-prefixed fullscreen APIs
interface ExtendedDocument extends Document {
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;

  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;

  webkitExitFullscreen?: () => Promise<void>;
  mozCancelFullScreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface ExtendedElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
  mozRequestFullScreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

interface UseFullscreenOptions {
  elementRef: React.RefObject<HTMLElement | null>;
  onEnter?: () => void;
  onExit?: () => void;
}

interface UseFullscreenReturn {
  isFullscreen: boolean;
  isSupported: boolean;
  error: string | null;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

export function useFullscreen({
  elementRef,
  onEnter,
  onExit,
}: UseFullscreenOptions): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doc = document as ExtendedDocument;

  // Check if fullscreen API is supported
  const isSupported =
    typeof document !== 'undefined' &&
    !!(
      doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      doc.mozFullScreenEnabled ||
      doc.msFullscreenEnabled
    );

  // Update fullscreen state
  const updateFullscreenState = useCallback(() => {
    const fullscreenElement =
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement;

    setIsFullscreen(!!fullscreenElement);
  }, [doc]);

  // Set up event listeners
  useEffect(() => {
    if (!isSupported) return;

    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState);
      document.removeEventListener('webkitfullscreenchange', updateFullscreenState);
      document.removeEventListener('mozfullscreenchange', updateFullscreenState);
      document.removeEventListener('MSFullscreenChange', updateFullscreenState);
    };
  }, [isSupported, updateFullscreenState]);

  // Request fullscreen
  const requestFullscreen = useCallback(
    async (element: HTMLElement): Promise<void> => {
      if (!isSupported) {
        throw new Error('Fullscreen is not supported in this browser');
      }

      const extElement = element as ExtendedElement;

      // Try standard API first
      if (element.requestFullscreen) {
        return element.requestFullscreen();
      }
      // WebKit (Safari, Chrome)
      else if (extElement.webkitRequestFullscreen) {
        return extElement.webkitRequestFullscreen();
      }
      // Firefox
      else if (extElement.mozRequestFullScreen) {
        return extElement.mozRequestFullScreen();
      }
      // IE/Edge
      else if (extElement.msRequestFullscreen) {
        return extElement.msRequestFullscreen();
      }

      throw new Error('No fullscreen method available for this element');
    },
    [isSupported],
  );

  // Exit fullscreen
  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (!isSupported) return;

    if (doc.exitFullscreen) {
      return doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      return doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      return doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      return doc.msExitFullscreen();
    }
  }, [isSupported, doc]);

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    setError(null);

    const element = elementRef.current;
    if (!element) {
      setError('No element reference available');
      return;
    }

    try {
      await requestFullscreen(element);
      onEnter?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enter fullscreen';
      setError(errorMessage);
      logger.error('Fullscreen error:', {}, err instanceof Error ? err : undefined);
    }
  }, [elementRef, requestFullscreen, onEnter]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
      onExit?.();
    } else {
      await enterFullscreen();
    }
  }, [isFullscreen, exitFullscreen, enterFullscreen, onExit]);

  return {
    isFullscreen,
    isSupported,
    error,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}

// Hook for managing fullscreen state without element ref (uses document.body)
export function useDocumentFullscreen() {
  return useFullscreen({
    elementRef: {
      current: typeof document !== 'undefined' ? document.body : null,
    } as React.RefObject<HTMLElement>,
    onEnter: () => {},
    onExit: () => {},
  });
}
