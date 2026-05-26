'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logger.error('Critical Global root layout crash caught by Global Error Boundary', {
      digest: error.digest,
    }, error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6">
        <div className="max-w-md w-full text-center space-y-6 bg-[#12121e]/80 border border-neutral-800/50 p-8 rounded-[1.8rem] backdrop-blur-xl shadow-2xl">
          <div className="w-20 h-20 bg-red-600/10 border border-red-600/30 rounded-[1.25rem] flex items-center justify-center text-red-500 mx-auto text-3xl font-black">
            🚨
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight italic">Critical System Error</h2>
            <p className="text-neutral-400 text-sm">
              The application encountered a critical runtime error and could not load the page layout.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 px-5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl font-bold transition-all text-sm"
            >
              Reload Browser
            </button>
            <button
              onClick={() => reset()}
              className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-500/20"
            >
              Recover App
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
