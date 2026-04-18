'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout, DashboardComic } from '@/components/organisms/Dashboard/DashboardLayout';
import { UploadCloud, Loader2, Library } from 'lucide-react';
import { useComicParser } from '@/hooks/useComicParser';
import { useLibrary, type LibraryComic, useDeleteComic } from '@/hooks/useLibrary';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LibraryPage() {
  const router = useRouter();
  const { parseComic, isParsing, progress } = useComicParser();
  
  // State for pagination, search and sort
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  
  // State for advanced filters
  const [yearStart, setYearStart] = useState<number | null>(null);
  const [yearEnd, setYearEnd] = useState<number | null>(null);
  const [readStatus, setReadStatus] = useState('all');
  
  const { data: libraryData, isLoading, error, refetch } = useLibrary({ 
    page: currentPage, 
    limit: 20,
    search: searchQuery,
    sortBy: sortBy,
    yearStart,
    yearEnd,
    readStatus
  });

  const deleteMutation = useDeleteComic();
  
  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
      await refetch();
    } catch (e) {
      console.error('Bulk delete error:', e);
      throw e;
    }
  };
  
  const { status: sessionStatus } = useSession();
  const [isDragging, setIsDragging] = useState(false);

  // Transform real comics from API to DashboardComic format
  const dashboardComics: DashboardComic[] = useMemo(() => {
    const comics = libraryData?.data ?? [];
    return comics.map((comic: LibraryComic) => ({
      id: comic.id,
      title: comic.title,
      author: (comic as any).series || undefined,
      coverUrl: comic.coverUrl || undefined,
      pageCount: comic.pageCount,
      year: comic.year || undefined,
      issue: comic.issue || undefined,
      progress: comic.progress ? {
        lastPage: comic.progress.lastPage,
        totalPages: comic.progress.totalPages,
      } : undefined,
    }));
  }, [libraryData?.data]);

  // Handle session state
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

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  if (sessionStatus === 'loading' || (isLoading && !libraryData)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading your library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 flex items-center justify-center text-comet-text">
        <div className="bg-comet-surface p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 max-w-md text-center border border-comet-border">
          <Library size={32} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Failed to load library</h2>
          <p className="text-comet-muted">{(error as any).message || 'Could not connect to the server'}</p>
          <button onClick={() => refetch()} className="bg-comet-accent text-white px-6 py-2 rounded-full font-medium">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`fixed bottom-8 right-8 z-50 transition-all ${isDragging ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        <div className="bg-blue-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
          <UploadCloud size={24} />
          <span className="font-semibold">Drop comic file here</span>
        </div>
      </div>

      <div className="hidden" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        <input type="file" accept=".cbz,.cbr" id="comic-upload-input" onChange={handleFileInput} />
      </div>

      {isParsing && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center">
          <div className="bg-neutral-900 p-8 rounded-3xl text-center border border-neutral-800">
            <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">Parsing {progress ? `${progress.page} / ${progress.total}` : 'Comic'}...</p>
          </div>
        </div>
      )}

      <DashboardLayout 
        comics={dashboardComics}
        onFileSelect={handleFileUpload}
        onComicUpload={() => refetch()}
        pagination={libraryData?.pagination}
        onPageChange={setCurrentPage}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onBulkDelete={handleBulkDelete}
        yearStart={yearStart}
        onYearStartChange={setYearStart}
        yearEnd={yearEnd}
        onYearEndChange={setYearEnd}
        readStatus={readStatus}
        onReadStatusChange={setReadStatus}
      />
    </>
  );
}
