'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout, DashboardComic } from '@/components/organisms/Dashboard/DashboardLayout';
import { UploadCloud, Loader2, Library } from 'lucide-react';
import { useComicParser } from '@/hooks/useComicParser';
import { useLibrary, LibraryComic } from '@/hooks/useLibrary';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LibraryPage() {
  const router = useRouter();
  const { parseComic, isParsing, progress } = useComicParser();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: libraryData, isLoading, error, refetch } = useLibrary({ page: currentPage, limit: 20 });
  const { data: session, status: sessionStatus } = useSession();
  const [isDragging, setIsDragging] = useState(false);

  // Extract comics from paginated response
  const comics = libraryData?.data ?? [];
  const pagination = libraryData?.pagination;

  // Transform real comics from API to DashboardComic format
  const dashboardComics: DashboardComic[] = useMemo(() => {
    if (!comics) return [];
    return comics.map((comic: any) => ({
      id: comic.id,
      title: comic.title,
      author: undefined, // Author is stored in metadata field
      coverUrl: comic.coverUrl || undefined,
      pageCount: comic.pageCount,
      year: comic.year || undefined,
      issue: comic.issue || undefined,
      progress: comic.progress ? {
        lastPage: comic.progress.lastPage,
        totalPages: comic.progress.totalPages,
      } : undefined,
    }));
  }, [comics]);

  // Handle session state safely - redirect only after session is confirmed unauthenticated
  React.useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      await parseComic(file);
      await refetch();
    } catch (e) {
      console.error(e);
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

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    // Reset input
    e.target.value = '';
  };

  // Show loading state while checking session or loading library
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading your library...</p>
        </div>
      </div>
    );
  }

  // Handle error state - log for debugging
  if (error) {
    console.error('[LibraryPage] Error loading library:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Library size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Failed to load library</h2>
          <p className="text-gray-600 text-center">{error.message || 'Could not connect to the server'}</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state for authenticated users with no comics
  if (dashboardComics.length === 0) {
    return (
      <>
        {/* Upload Overlay - shown when dragging */}
        <div
          className={`fixed bottom-8 right-8 z-50 transition-all ${
            isDragging ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
        >
          <div className="bg-blue-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
            <UploadCloud size={24} />
            <span className="font-semibold">Drop comic file here</span>
          </div>
        </div>

        {/* Upload Area - hidden but functional */}
        <div
          className="hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".cbz,.cbr"
            id="comic-upload-input"
            onChange={handleFileInput}
          />
        </div>

        {/* Empty Library State */}
        <div className="min-h-screen bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[1400px] h-[850px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col items-center justify-center">
            <div className="text-center max-w-md p-8">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Library size={48} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Library is Empty</h2>
              <p className="text-gray-600 mb-8">
                Start building your comic collection by uploading your first comic book.
              </p>
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                onClick={() => document.getElementById('comic-upload-input')?.click()}
              >
                <UploadCloud size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Click to upload a comic</p>
                <p className="text-gray-400 text-sm mt-1">Supports .cbz and .cbr files</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept=".cbz,.cbr"
          id="comic-upload-input"
          className="hidden"
          onChange={handleFileInput}
        />
      </>
    );
  }

  // Show authenticated user's library with their real comics
  return (
    <>
      {/* Upload Overlay - shown when dragging */}
      <div
        className={`fixed bottom-8 right-8 z-50 transition-all ${
          isDragging ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}
      >
        <div className="bg-blue-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
          <UploadCloud size={24} />
          <span className="font-semibold">Drop comic file here</span>
        </div>
      </div>

      {/* Upload Area - hidden but functional */}
      <div
        className="hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".cbz,.cbr"
          id="comic-upload-input"
          onChange={handleFileInput}
        />
      </div>

      {/* Parsing Overlay */}
      {isParsing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-neutral-900 p-8 rounded-3xl text-center">
            <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">
              Parsing {progress ? `${progress.page} / ${progress.total}` : 'Comic'}...
            </p>
          </div>
        </div>
      )}

      {/* Dashboard with user's real comics */}
      <DashboardLayout
        comics={dashboardComics}
        onFileSelect={handleFileUpload}
        onComicUpload={async (comic) => {
          // Refetch library after comic is added
          await refetch();
          console.log('Comic added:', comic.id);
        }}
        pagination={pagination ? {
          page: currentPage,
          limit: 20,
          total: pagination.total,
          totalPages: pagination.totalPages
        } : undefined}
        onPageChange={(page) => setCurrentPage(page)}
      >
        <div className="hidden" />
      </DashboardLayout>
    </>
  );
}
