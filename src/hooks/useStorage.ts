import { useState, useEffect } from 'react';
import { getStoredComicsSize, clearAllParsedComics } from '@/lib/idb';

interface StorageInfo {
  usage: number;
  quota: number;
  idbCustomUsage: number;
  loading: boolean;
  error: string | null;
}

export function useStorage() {
  const [info, setInfo] = useState<StorageInfo>({
    usage: 0,
    quota: 0,
    idbCustomUsage: 0,
    loading: true,
    error: null,
  });

  const fetchStorage = async () => {
    setInfo(prev => ({ ...prev, loading: true, error: null }));
    try {
      let usage = 0;
      let quota = 0;

      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        usage = estimate.usage || 0;
        quota = estimate.quota || 0;
      }

      // We might have a separate DB measure for exactly what's taking up space,
      // but 'usage' gives us the browser's view. We'll grab IDB custom usage anyway.
      const idbCustomUsage = await getStoredComicsSize();

      setInfo({ usage, quota, idbCustomUsage, loading: false, error: null });
    } catch (e: unknown) {
      setInfo(prev => ({ ...prev, loading: false, error: e instanceof Error ? e.message : 'Storage error' }));
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const clearCache = async () => {
    try {
      await clearAllParsedComics();
      await fetchStorage();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return { info, clearCache, refresh: fetchStorage };
}
