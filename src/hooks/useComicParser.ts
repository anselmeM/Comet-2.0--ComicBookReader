import { useState, useCallback } from 'react';
import { setCachedComic, getCachedComic, evictCachedComic } from '@/lib/idb';
import { computeFileHash } from '@/lib/hash';
import { generateThumbnail } from '@/lib/thumbnail';
import { runLRUEviction } from '@/lib/lru';
import { useAuthCallback } from './useAuthCallback';

interface ParseProgress {
  phase: 'hashing' | 'parsing';
  page: number;
  total: number;
}

// Load the WASM binary once at module initialization
let wasmBinaryPromise: Promise<ArrayBuffer> | null = null;

function getWasmBinary(): Promise<ArrayBuffer> {
  if (!wasmBinaryPromise) {
    wasmBinaryPromise = fetch('/unrar.wasm').then(response => {
      if (!response.ok) {
        throw new Error('Failed to load unrar.wasm');
      }
      return response.arrayBuffer();
    });
  }
  return wasmBinaryPromise;
}

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_EXTENSIONS = ['.cbz', '.cbr', '.zip'];

export function useComicParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { handleAuthError } = useAuthCallback();

  const parseComic = useCallback(async (file: File) => {
    setIsParsing(true);
    setError(null);

    try {
      // 1. File size validation
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File exceeds the maximum limit of 1GB.`);
      }

      // 2. Extension validation
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        throw new Error(`Invalid file type. Allowed types: .cbz, .cbr, .zip`);
      }

      // 3. Magic bytes validation
      const headerSlice = file.slice(0, 4);
      const headerBuffer = await headerSlice.arrayBuffer();
      const headerView = new Uint8Array(headerBuffer);
      
      const isZip = headerView[0] === 0x50 && headerView[1] === 0x4b && headerView[2] === 0x03 && headerView[3] === 0x04;
      const isRar = headerView[0] === 0x52 && headerView[1] === 0x61 && headerView[2] === 0x72 && headerView[3] === 0x21;

      if (!isZip && !isRar) {
        throw new Error(`File is corrupt or not a valid comic archive.`);
      }

      // 4. Compute full file hash (T-LIB-002)
      setProgress({ phase: 'hashing', page: 0, total: 100 });
      const filehash = await computeFileHash(file, (p) => {
        setProgress({ phase: 'hashing', page: Math.round(p * 100), total: 100 });
      });

      const localComicId = filehash;

      // 5. Start Worker for parsing (T-LIB-003 extraction phase)
      setProgress({ phase: 'parsing', page: 0, total: 100 });
      
      return new Promise<string>(async (resolve, reject) => {
        try {
          const worker = new Worker(new URL('../workers/comicParser.worker.ts', import.meta.url), { type: 'module' });
          
          worker.onmessage = async (e) => {
            const { type, page, total, pages, error: workerErr } = e.data;
            
            if (type === 'PROGRESS') {
              setProgress({ phase: 'parsing', page, total });
            } else if (type === 'DONE') {
              worker.terminate();

              try {
                // Setup cover image (compressed) - (T-LIB-003)
                let coverUrl: string | null = null;
                if (pages.length > 0) {
                  // Try extracting first page, fallback to next pages if corrupt
                  for (let i = 0; i < Math.min(5, pages.length); i++) {
                    try {
                      coverUrl = await generateThumbnail(pages[i].blob, 400, 0.8);
                      if (coverUrl) break;
                    } catch (thumbErr) {
                      console.warn(`[useComicParser] Failed to generate thumbnail for page ${i}, trying next...`, thumbErr);
                    }
                  }
                }

                // Save to IDB
                await setCachedComic({
                  comicId: localComicId,
                  pages,
                  coverUrl: pages.length > 0 ? URL.createObjectURL(pages[0].blob) : '',
                  cachedAt: Date.now(),
                  sizeBytes: pages.reduce((acc: number, p: { blob: Blob }) => acc + p.blob.size, 0),
                  lastAccessedAt: Date.now()
                });

                // Run LRU eviction to ensure we stay within storage budget
                await runLRUEviction();

                // Inform server
                const payload = {
                  title: file.name.replace(/\.(cbz|cbr|zip)$/i, ''),
                  filehash,
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
                  if (wasAuthError) return;
                  
                  throw new Error(`Server returned ${response.status}`);
                }

                const data = await response.json();
                const serverComicId: string = data.id;

                // Re-key IDB entry
                const localEntry = await getCachedComic(localComicId);
                if (localEntry) {
                  await setCachedComic({ ...localEntry, comicId: serverComicId });
                  await evictCachedComic(localComicId);
                }

                setIsParsing(false);
                setProgress(null);
                resolve(serverComicId);
              } catch (doneErr) {
                setIsParsing(false);
                setProgress(null);
                reject(doneErr);
              }
            } else if (type === 'ERROR') {
              worker.terminate();
              setIsParsing(false);
              setProgress(null);
              setError(workerErr);
              reject(new Error(workerErr));
            }
          };

          const wasmBinary = await getWasmBinary();
          worker.postMessage({ type: 'PARSE', file, comicId: localComicId, wasmBinary });
        } catch (workerSetupErr) {
          reject(workerSetupErr);
        }
      });

    } catch (err: unknown) {
      setIsParsing(false);
      setProgress(null);
      const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error';
      setError(errorMsg);
      throw err;
    }
  }, []);

  return { parseComic, isParsing, progress, error };
}
