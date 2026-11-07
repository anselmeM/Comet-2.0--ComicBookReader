'use client';

import React, { useState, useMemo } from 'react';
import { getErrorMessage } from '@/lib/errors';
import { DashboardLayout } from '@/components/organisms/Dashboard/DashboardLayout';
import { DashboardComic, DashboardComicCard } from '@/components/molecules/DashboardComicCard';
import { UploadCloud, Loader2, BookOpen, WifiOff } from 'lucide-react';
import { useComicParser } from '@/hooks/useComicParser';
import { useLibrary, useDeleteComic } from '@/hooks/useLibrary';
import { useCloudSync } from '@/hooks/useCloudSync';
import { getAllCachedComicsMetadata } from '@/lib/idb';
import { useAppSession as useSession } from '@/hooks/useAppSession';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useRouter } from 'next/navigation';
import { CachedComic, ComicDTO } from '@/types';
import { useNotification } from '@/components/atoms/Toast';
import { logger } from '@/lib/logger';
import { useDebounce } from '@/hooks/useDebounce';

/** Metadata-only view of a locally cached comic (page blobs stripped). */
type CachedComicMetadata = Omit<CachedComic, 'pages'>;

export default function LibraryPage() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const { parseComic, isParsing, progress } = useComicParser();
  const {
    downloadFromCloud,
    syncLocalComicToCloud,
    isSyncing: isCloudDownloading,
  } = useCloudSync();

  // State for pagination, search and sort
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  const [sortBy, setSortBy] = useState('recent');

  // State for advanced filters
  const [yearStart, setYearStart] = useState<number | null>(null);
  const [yearEnd, setYearEnd] = useState<number | null>(null);
  const [readStatus, setReadStatus] = useState('all');
  const [isOfflineOnly, setIsOfflineOnly] = useState(false);
  const [localComicIds, setLocalComicIds] = useState<Set<string>>(new Set());
  const [localComics, setLocalComics] = useState<CachedComicMetadata[]>([]);

  const {
    data: libraryData,
    isLoading,
    error,
    refetch,
  } = useLibrary({
    page: currentPage,
    limit: 20,
    search: debouncedSearchQuery,
    sortBy: sortBy,
    yearStart,
    yearEnd,
    readStatus,
    includeIds: isOfflineOnly ? Array.from(localComicIds) : undefined,
  });

  const deleteMutation = useDeleteComic();

  const handleBulkDelete = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id)));
      await refetch();
    } catch (e) {
      logger.error('Bulk delete error', {}, e as Error);
      throw e;
    }
  };

  const { status: sessionStatus, data: session } = useSession();
  const [isDragging, setIsDragging] = useState(false);

  // Check local storage availability
  React.useEffect(() => {
    const checkLocal = async () => {
      const cached = await getAllCachedComicsMetadata(session?.user?.id);
      setLocalComicIds(new Set(cached.map((c) => c.comicId)));
      setLocalComics(cached);
    };
    checkLocal();
  }, [libraryData, session?.user?.id]);

  // Transform real comics from API to DashboardComic format
  const dashboardComics: DashboardComic[] = useMemo(() => {
    const comics: ComicDTO[] = libraryData?.data ?? [];
    return comics.map((comic) => ({
      id: comic.id,
      title: comic.title,
      author: comic.series || undefined,
      coverUrl: comic.coverUrl || undefined,
      pageCount: comic.pageCount,
      year: comic.year || undefined,
      issue: comic.issue || undefined,
      rating: comic.rating || undefined,
      isFavorite: comic.isFavorite,
      syncStatus: comic.syncStatus,
      isLocallyAvailable: localComicIds.has(comic.id),
      progress: comic.progress
        ? {
            lastPage: comic.progress.lastPage,
            totalPages: comic.progress.totalPages,
            totalTimeSpent: comic.progress.totalTimeSpent,
            lastReadAt: comic.progress.lastReadAt,
          }
        : undefined,
    }));
  }, [libraryData?.data, localComicIds]);

  // Downloaded-only comics shown when the full library can't be fetched
  // (offline, or the library request failed). Metadata comes from IndexedDB.
  const offlineComics: DashboardComic[] = useMemo(
    () =>
      localComics.map((comic) => ({
        id: comic.comicId,
        title: comic.title || 'Untitled Comic',
        coverUrl: comic.coverUrl || undefined,
        pageCount: 0,
        isPinned: comic.isPinned,
        isLocallyAvailable: true,
      })),
    [localComics],
  );

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      await parseComic(file);
      await refetch();
    } catch (e) {
      logger.error('File upload failed', {}, e as Error);
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

  const { triggerNotification } = useNotification();

  const handleRestoreFromCloud = async (comicId: string, title: string) => {
    try {
      const file = await downloadFromCloud(comicId, title);
      if (file) {
        await parseComic(file, { skipServerPOST: true, existingComicId: comicId });
        // Refresh local availability
        const cached = await getAllCachedComicsMetadata(session?.user?.id);
        setLocalComicIds(new Set(cached.map((c) => c.comicId)));
        triggerNotification('Comic restored from cloud', 'success');
      }
    } catch (e) {
      logger.error('Restore failed', {}, e instanceof Error ? e : undefined);
      triggerNotification(
        `Restore failed: ${getErrorMessage(e) || 'Corrupted archive file'}`,
        'error',
      );
    }
  };

  const handleSyncToCloud = async (comicId: string) => {
    try {
      await syncLocalComicToCloud(comicId, session?.user?.id);
      await refetch();
    } catch (e) {
      logger.error('Manual sync to cloud failed', {}, e instanceof Error ? e : undefined);
    }
  };

  // The full library can't be shown when we're offline or the request failed;
  // fall back to the downloaded-only grid instead of a dead-end error page.
  const isDegraded = !isOnline || Boolean(error);

  if (sessionStatus === 'loading' || (!isDegraded && isLoading && !libraryData)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <p className="text-gray-600 font-medium">Loading your library...</p>
        </div>
      </div>
    );
  }

  if (isDegraded) {
    const offlineReason = error
      ? getErrorMessage(error)
      : 'You are offline. Downloaded comics remain available to read.';

    return (
      <div className="min-h-screen bg-comet-bg text-comet-text">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-12">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <WifiOff size={24} className="text-comet-accent" />
                Downloaded comics
              </h1>
              <p className="mt-1 text-sm text-comet-muted">
                Showing downloaded comics — reconnect to load your full library
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="rounded-full border border-comet-border bg-comet-surface px-4 py-2 text-sm font-medium text-comet-text transition-colors hover:border-comet-accent"
            >
              Try Again
            </button>
          </div>

          {offlineComics.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-comet-border bg-comet-surface p-12 text-center">
              <BookOpen size={48} className="text-comet-muted opacity-50" />
              <p className="text-comet-muted">
                No downloaded comics are available on this device yet.
              </p>
              <p className="text-sm text-comet-muted">{offlineReason}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {offlineComics.map((comic) => (
                <DashboardComicCard
                  key={comic.id}
                  comic={comic}
                  variant="standard"
                  showPageCount={false}
                  showYear={false}
                  showProgress={false}
                  onNotification={triggerNotification}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`fixed bottom-8 right-8 z-50 transition-all ${isDragging ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
      >
        <div className="bg-blue-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
          <UploadCloud size={24} />
          <span className="font-semibold">Drop comic file here</span>
        </div>
      </div>

      <div
        className="hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input type="file" accept=".cbz,.cbr" id="comic-upload-input" onChange={handleFileInput} />
      </div>

      {isParsing && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center">
          <div className="bg-neutral-900 p-8 rounded-3xl text-center border border-neutral-800">
            <Loader2 size={48} className="text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-white font-medium">
              {isCloudDownloading
                ? 'Downloading from Cloud...'
                : `Parsing ${progress ? `${progress.page} / ${progress.total}` : 'Comic'}...`}
            </p>
          </div>
        </div>
      )}

      <DashboardLayout
        comics={dashboardComics}
        onFileSelect={handleFileUpload}
        onRestoreFromCloud={handleRestoreFromCloud}
        onSyncToCloud={handleSyncToCloud}
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
        isOfflineOnly={isOfflineOnly}
        onOfflineOnlyChange={setIsOfflineOnly}
      />
    </>
  );
}
