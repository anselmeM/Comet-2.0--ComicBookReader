import { useState, useCallback } from 'react';
import { setCachedComic, getCachedComic, evictCachedComic } from '@/lib/idb';
import { computeFileHash } from '@/lib/hash';
import { extractCoverUrl } from '@/lib/thumbnail';
import { runLRUEviction } from '@/lib/lru';
import { validateComicArchive } from '@/lib/comic-validation';
import { executeParserWorker } from '@/lib/comic-worker-client';
import { useAuthCallback } from './useAuthCallback';
import { useCloudSync } from './useCloudSync';
import { useSession } from 'next-auth/react';

interface ParseProgress {
  phase: 'hashing' | 'parsing';
  page: number;
  total: number;
}

export function useComicParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { handleAuthError } = useAuthCallback();
  const { uploadToCloud } = useCloudSync();
  const { data: session } = useSession();

  const parseComic = useCallback(
    async (file: File, options: { skipServerPOST?: boolean; existingComicId?: string } = {}) => {
      setIsParsing(true);
      setError(null);

      try {
        // 1. Validation (T-LIB-001)
        await validateComicArchive(file);

        // 2. Compute full file hash (T-LIB-002)
        setProgress({ phase: 'hashing', page: 0, total: 100 });
        const filehash = await computeFileHash(file, (p) => {
          setProgress({ phase: 'hashing', page: Math.round(p * 100), total: 100 });
        });

        const localComicId = filehash;

        // 3. Parse via Web Worker (T-LIB-003 extraction phase)
        setProgress({ phase: 'parsing', page: 0, total: 100 });
        const pages = await executeParserWorker(file, filehash, (page, total) => {
          setProgress({ phase: 'parsing', page, total });
        });

        // 4. Generate Thumbnail (T-LIB-003)
        const coverUrl = await extractCoverUrl(pages);

        // 5. Cache locally in IndexedDB
        await setCachedComic(
          {
            comicId: localComicId,
            title: file.name.replace(/\.(cbz|cbr|zip)$/i, ''),
            pages,
            coverUrl: pages.length > 0 ? URL.createObjectURL(pages[0].blob) : '',
            cachedAt: Date.now(),
            sizeBytes: pages.reduce((acc, p) => acc + p.blob.size, 0),
            lastAccessedAt: Date.now(),
          },
          session?.user?.id,
        );

        // 6. Enforce local cache limits
        await runLRUEviction(session?.user?.id);

        // 7. Sync with Server (unless restoring from cloud)
        let serverComicId = options.existingComicId;
        const sizeBytes = pages.reduce((acc, p) => acc + p.blob.size, 0);

        if (!options.skipServerPOST) {
          const payload = {
            title: file.name.replace(/\.(cbz|cbr|zip)$/i, ''),
            filehash,
            sizeBytes,
            pageCount: pages.length,
            coverUrl,
          };

          const response = await fetch('/api/library', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const wasAuthError = await handleAuthError(response);
            if (wasAuthError) throw new Error('Authentication error');
            throw new Error(`Server returned ${response.status}`);
          }

          const data = await response.json();
          serverComicId = data.id;
        }

        if (!serverComicId) throw new Error('No comic ID available');

        // 8. Re-key local IndexedDB entry to match the official server ID
        const localEntry = await getCachedComic(localComicId, session?.user?.id);
        if (localEntry) {
          await setCachedComic({ ...localEntry, comicId: serverComicId }, session?.user?.id);
          await evictCachedComic(localComicId, session?.user?.id);
        }

        // 9. Upload to Cloud Sync if user has Premium
        if (!options.skipServerPOST && session?.user?.plan === 'PREMIUM') {
          uploadToCloud(serverComicId, file);
        }

        setIsParsing(false);
        setProgress(null);
        return serverComicId;
      } catch (err: unknown) {
        setIsParsing(false);
        setProgress(null);
        const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error';
        setError(errorMsg);
        throw err;
      }
    },
    [handleAuthError, session?.user?.id, session?.user?.plan, uploadToCloud],
  );

  return { parseComic, isParsing, progress, error };
}
