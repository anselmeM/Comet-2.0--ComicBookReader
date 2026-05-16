'use client';

import React from 'react';

export function ComicCardSkeleton() {
  return (
    <div className="bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 shadow-lg animate-pulse">
      <div className="aspect-[2/3] bg-neutral-800 flex items-center justify-center">
        {/* Empty area for cover image */}
      </div>
      <div className="p-4 space-y-2">
        <div className="h-4 bg-neutral-800 rounded-md w-3/4" />
        <div className="flex justify-between items-center">
          <div className="h-3 bg-neutral-800 rounded-md w-1/3" />
          <div className="h-3 bg-neutral-800 rounded-md w-1/4" />
        </div>
      </div>
    </div>
  );
}
