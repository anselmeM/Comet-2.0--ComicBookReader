'use client';

import React, { useRef, useState } from 'react';
import { useLibrary, useDeleteComic } from '@/hooks/useLibrary';
import { useComicParser } from '@/hooks/useComicParser';
import { DashboardComicCard, ComicCardSkeleton } from '@/components/molecules/DashboardComicCard';
import { UploadCloud, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { logger } from '@/lib/logger';

export function ComicLibrary() {
  const { data: libraryData, isLoading, error: fetchError, refetch } = useLibrary();
  const comics = libraryData?.data ?? [];
  const { mutate: deleteComic, isPending: isDeleting } = useDeleteComic();
  const { parseComic, isParsing, progress, error: parseError } = useComicParser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      await parseComic(file);
      await refetch();
    } catch (e) {
      logger.error(String(e), {}, e instanceof Error ? e : undefined);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 py-8">
      {/* Upload Area */}
      <section
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".cbz,.cbr"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            if (fileInputRef.current) fileInputRef.current.value = ''; // reset
          }}
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-3 text-blue-400">
            <Loader2 size={32} className="animate-spin" />
            <p className="font-medium animate-pulse">
              Parsing {progress ? `${progress.page} / ${progress.total}` : 'Comic'}...
            </p>
          </div>
        ) : (
          <>
            <div
              className="p-4 bg-neutral-800 rounded-full text-blue-400 mb-4 cursor-pointer hover:bg-neutral-700 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={32} />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Drag & Drop Comic</h2>
            <p className="text-neutral-400 text-sm text-center max-w-md">
              Drop your .cbz or .cbr file here, or click to browse. Files are processed locally on
              your device.
            </p>
            {parseError && (
              <div className="mt-4 p-3 bg-red-900/30 text-red-400 rounded-lg flex items-center gap-2 text-sm border border-red-800">
                <AlertCircle size={16} /> {parseError}
              </div>
            )}
          </>
        )}
      </section>

      {/* Library Grid */}
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Your Library
          <span className="text-sm font-normal text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
            {comics?.length || 0}
          </span>
        </h2>

        {fetchError && <div className="text-red-400">Failed to load library.</div>}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <ComicCardSkeleton key={i} variant="standard" />
            ))}
          </div>
        ) : comics && comics.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {comics.map((comic) => (
              <DashboardComicCard key={comic.id} comic={comic} variant="standard" />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-neutral-900 rounded-3xl border border-neutral-800 text-neutral-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p>Your library is empty. Upload a comic to get started.</p>
          </div>
        )}
      </section>
    </div>
  );
}
