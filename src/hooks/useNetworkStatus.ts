'use client';

import { useSyncExternalStore } from 'react';

/**
 * Hook to track the user's network connection status using useSyncExternalStore.
 * 
 * @returns {boolean} isOnline - True if the browser has a network connection.
 */
export function useNetworkStatus() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true; // Default to true on server
}
