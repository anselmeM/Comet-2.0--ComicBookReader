import { ComicLibrary } from '@/components/organisms/ComicLibrary';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library - Comet',
  description: 'Your comic library',
};

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-black pt-20">
      <ComicLibrary />
    </main>
  );
}
