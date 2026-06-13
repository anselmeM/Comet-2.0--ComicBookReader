import { useState, useEffect, useCallback, useRef } from 'react';
import { getCacheTotalSizeBytes, clearAllParsedComics } from '@/lib/idb';
import { logger } from '@/lib/logger';

interface StorageInfo {
  usage: number;
  quota: number;
  idbCustomUsage: number;
  loading: boolean;
}

/**
 * Hook to monitor PWA storage quotas and local IndexedDB usage.
 */
export function useStorage() {
  const [info, setInfo] = useState<StorageInfo>({
    usage: 0,
    quota: 0,
    idbCustomUsage: 0,
    loading: true,
  });

  const isMounted = useRef(false);

  const refresh = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        const idbSize = await getCacheTotalSizeBytes();

        if (isMounted.current) {
          setInfo({
            usage: usage || 0,
            quota: quota || 0,
            idbCustomUsage: idbSize,
            loading: false,
          });
        }
      } catch (err) {
        logger.error('Failed to fetch storage info:', {}, err instanceof Error ? err : undefined);
        if (isMounted.current) {
          setInfo((prev) => ({ ...prev, loading: false }));
        }
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Defer to next tick to avoid "set state in effect" warning if synchronous
    const timeout = setTimeout(() => {
      refresh();
    }, 0);

    return () => {
      isMounted.current = false;
      clearTimeout(timeout);
    };
  }, [refresh]);

  const clearCache = async () => {
    await clearAllParsedComics();
    await refresh();
  };

  return {
    info,
    clearCache,
    refresh,
  };
}
