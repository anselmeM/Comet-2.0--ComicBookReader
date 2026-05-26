'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to our structured logger
    logger.error('Application segment crash caught by Error Boundary', {
      digest: error.digest,
    }, error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-[#12121e]/80 border border-neutral-800/50 p-8 rounded-[1.8rem] backdrop-blur-xl shadow-2xl">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-[1.25rem] flex items-center justify-center text-red-500 mx-auto text-3xl font-black">
          ⚠
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight italic">Something went wrong</h2>
          <p className="text-neutral-400 text-sm">
            An unexpected error occurred in this section of the app.
          </p>
        </div>
        
        {process.env.NODE_ENV !== 'production' && (
          <div className="text-left bg-black/40 p-4 rounded-xl font-mono text-xs overflow-auto max-h-40 border border-neutral-900 text-red-400/80">
            {error.message}
            {error.stack && <pre className="mt-2 text-[10px] opacity-60">{error.stack}</pre>}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3 px-5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl font-bold transition-all text-sm"
          >
            Reload Page
          </button>
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-500/20"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
