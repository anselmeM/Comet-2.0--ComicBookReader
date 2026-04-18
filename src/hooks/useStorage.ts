import { useState, useEffect, useCallback } from 'react';
import { getCacheTotalSizeBytes, clearAllParsedComics } from '@/lib/idb';

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

  const fetchStorageInfo = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const { usage, quota } = await navigator.storage.estimate();
        const idbSize = await getCacheTotalSizeBytes();
        
        setInfo({
          usage: usage || 0,
          quota: quota || 0,
          idbCustomUsage: idbSize,
          loading: false,
        });
      } catch (err) {
        console.error('Failed to fetch storage info:', err);
        setInfo(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  useEffect(() => {
    fetchStorageInfo();
  }, [fetchStorageInfo]);

  const clearCache = async () => {
    await clearAllParsedComics();
    await fetchStorageInfo();
  };

  return {
    info,
    clearCache,
    refresh: fetchStorageInfo,
  };
}
