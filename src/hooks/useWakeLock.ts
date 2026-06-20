'use client';

import { useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

export function useWakeLock(isActive: boolean = true) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  useEffect(() => {
    if (!isSupported || !isActive) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const requestWakeLock = async () => {
      try {
        if (wakeLockRef.current) return;
        wakeLockRef.current = await navigator.wakeLock.request('screen');

        wakeLockRef.current.addEventListener('release', () => {
          if (isMounted) {
            // Wake lock was released (e.g. OS action or tab switch)
            wakeLockRef.current = null;
          }
        });
      } catch (err) {
        logger.error('Wake Lock request failed:', {}, err instanceof Error ? err : undefined);
      }
    };

    // Attempt to request initially
    requestWakeLock();

    // Re-acquire when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isActive, isSupported]);

  return { isSupported };
}
