'use client';

import { useEffect } from 'react';
import { initSyncManager } from '@/lib/sync';

/**
 * Client-only component that initializes the Sync Manager.
 * Separated to keep the root layout as a Server Component.
 */
export function SyncManagerInit() {
  useEffect(() => {
    initSyncManager();
  }, []);
  
  return null;
}
