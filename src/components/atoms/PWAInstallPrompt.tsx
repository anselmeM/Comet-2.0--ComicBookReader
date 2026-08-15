'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default true to avoid flash
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = ua.includes('Safari') && !ua.includes('CriOS') && !ua.includes('FxiOS');

    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      setIsInstallable(true);
    }

    // Chrome/Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || !isInstallable || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-safe sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between gap-4 p-4 bg-comet-surface border border-comet-border rounded-2xl shadow-xl max-w-sm ml-auto"
      >
        <div className="flex-1 flex flex-col gap-1">
          <h3 className="text-sm font-bold text-comet-text">Install Comet App</h3>
          {isIOS ? (
            <p className="text-xs text-comet-muted flex items-center flex-wrap gap-1 leading-relaxed">
              Tap <Share className="w-3 h-3 inline" /> and select{' '}
              <span className="font-semibold text-comet-text whitespace-nowrap">
                &quot;Add to Home Screen&quot;
              </span>{' '}
              for offline reading.
            </p>
          ) : (
            <p className="text-xs text-comet-muted">Install for full-screen offline reading.</p>
          )}
        </div>

        {!isIOS && (
          <button
            onClick={handleInstallClick}
            className="flex-shrink-0 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
          >
            Install
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-2 text-comet-muted hover:text-comet-text bg-comet-surface-2 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
