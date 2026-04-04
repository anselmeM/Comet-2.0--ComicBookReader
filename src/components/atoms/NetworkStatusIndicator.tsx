'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Global indicator that alerts the user when they go offline or come back online.
 */
export function NetworkStatusIndicator() {
  const isOnline = useNetworkStatus();
  const [showIndicator, setShowIndicator] = useState(false);
  const wasOffline = React.useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowIndicator(true);
    } else {
      if (wasOffline.current) {
        wasOffline.current = false;
        const timer = setTimeout(() => {
          setShowIndicator(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline]);

  const displayType = isOnline ? 'online' : 'offline';

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full border shadow-2xl backdrop-blur-xl flex items-center gap-3 ${
            displayType === 'offline'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-green-500/10 border-green-500/20 text-green-400'
          }`}
        >
          {displayType === 'offline' ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-semibold">You are offline (Reading Cached Only)</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-semibold">Back online! Sync resumed.</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
