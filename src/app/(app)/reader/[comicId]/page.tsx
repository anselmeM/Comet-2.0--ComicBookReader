'use client';

import { useParams } from 'next/navigation';
import { ComicReader } from '@/components/organisms/ComicReader';
import { ReaderControls } from '@/components/organisms/ReaderControls'; // I will create this next
import { useReaderStore } from '@/stores/readerStore';

export default function ReaderPage() {
  const params = useParams();
  const comicId = params.comicId as string;
  const isMenuVisible = useReaderStore((state) => state.isMenuVisible);

  if (!comicId) return null;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* The main reading engine */}
      <ComicReader comicId={comicId} />

      {/* The UI Overlay (toolbar, scrubber, settings) */}
      {isMenuVisible && (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-4">
          <ReaderControls type="top" />
          <ReaderControls type="bottom" />
        </div>
      )}
    </div>
  );
}
