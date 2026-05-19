/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// Claim clients immediately
clientsClaim();

// Cleanup old caches
cleanupOutdatedCaches();

// Precache and route based on manifest
precacheAndRoute(self.__WB_MANIFEST);

// --- Custom Sync Logic ---

/**
 * Processes the sync queue from IndexedDB.
 * This can be called from the 'sync' event or regular main-thread logic.
 */
async function processSyncQueue() {
  // We'll dynamic import to avoid issues with SSR/bundling if needed,
  // but in a SW context we can just import.
  const { processSyncQueue: processQueue } = await import('./lib/sync');
  await processQueue();
}

self.addEventListener('sync', (event: any) => {
  if (event.tag === 'comet-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// --- Runtime Caching ---

// Offline Page
registerRoute(
  /\/offline\.html$/i,
  new CacheFirst({
    cacheName: 'offline-page',
  })
);

// Google Fonts
registerRoute(
  /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 4,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// Static Assets
registerRoute(
  /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
  new StaleWhileRevalidate({
    cacheName: 'static-font-assets',
    plugins: [new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 })],
  })
);

registerRoute(
  /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
  new StaleWhileRevalidate({
    cacheName: 'static-image-assets',
    plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 })],
  })
);

// Next.js Images
registerRoute(
  /\/_next\/image\?url=.+/i,
  new StaleWhileRevalidate({
    cacheName: 'next-image',
    plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 })],
  })
);

// API Routes
registerRoute(
  /\/api\/auth\/.*$/i,
  new NetworkOnly()
);

registerRoute(
  /\/api\/.*$/i,
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 24 * 60 * 60 }),
    ],
    networkTimeoutSeconds: 10,
  })
);

// Default NetworkFirst for other requests
registerRoute(
  /.*/i,
  new NetworkFirst({
    cacheName: 'others',
    plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 })],
    networkTimeoutSeconds: 10,
  })
);

// Handle SKIP_WAITING
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
