'use client';

import React, { useEffect, useRef, useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';

import { RefreshCw, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;

  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**

 * Component that detects when a new Service Worker is available

 * and prompts the user to reload.

 */

export function PWAUpdater() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const [showUpdate, setShowUpdate] = useState(false);

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Explicit registration — independent of next-pwa's automatic injection

      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW may be unavailable in some preview environments; fail silently
      });

      // Find the current registration

      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        setRegistration(reg);

        // Check if there is already an update waiting

        if (reg.waiting) {
          setShowUpdate(true);
        }

        // Listen for new updates

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Listen for the controller change (when SKIP_WAITING completes)

      // Guard against multiple queued updates triggering repeated reloads.

      let hasReloaded = false;

      const handleControllerChange = () => {
        if (hasReloaded) return;

        hasReloaded = true;

        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Capture the install prompt (Chrome/Edge); deferred until the user taps "Install App"

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();

        setInstallPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);

        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') setInstallPrompt(null);
  };

  return (
    <AnimatePresence>
      {installPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-[100] p-4 bg-comet-blue/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[280px]"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-white font-bold">Install Comet</span>

              <span className="text-white/70 text-sm">
                Read comics offline, right from your home screen.
              </span>
            </div>

            <button
              onClick={() => setInstallPrompt(null)}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleInstall}
            className="w-full bg-white text-comet-bg py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all"
          >
            Install App
          </button>
        </motion.div>
      )}

      {showUpdate && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-[100] p-4 bg-comet-blue/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[280px]"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-white font-bold">New Update Available</span>

              <span className="text-white/70 text-sm">Refresh to get the latest features.</span>
            </div>

            <button
              onClick={() => setShowUpdate(false)}
              className="text-white/40 hover:text-white transition-colors"
              aria-label="Dismiss update notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleUpdate}
            className="w-full bg-white text-comet-bg py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-white/90 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Reload & Update
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
