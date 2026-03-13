import { useState, useCallback } from 'react';
import { setCachedComic } from '@/lib/idb';

interface ParseProgress {
  page: number;
  total: number;
}

async function getFileHash(file: File): Promise<string> {
  // Rather than hashing a massive 100MB file, we create a composite hash 
  // from name, size, lastModified, and maybe the first 1KB of data.
  // This is much faster and practically collision-free for this use case.
  const slice = file.slice(0, 1024);
  const buffer = await slice.arrayBuffer();
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${file.name}-${file.size}-${hex}`;
}

async function compressCoverImage(blob: Blob, maxWidth = 400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(''); // fallback if no canvas context
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Compress to JPEG at 60% quality. This dramatically reduces size.
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      console.warn('[compressCoverImage] Failed to load image for compression');
      resolve(''); 
    };
    
    img.src = url;
  });
}

export function useComicParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseComic = useCallback(async (file: File) => {
    setIsParsing(true);
    setError(null);
    setProgress({ page: 0, total: 100 }); // indeterminate max at first

    return new Promise<string>(async (resolve, reject) => {
      try {
        const filehash = await getFileHash(file);
        // If the user already uploaded this, they will have essentially 
        // a new comic ID per upload locally but deduped on the server.
        // Wait, the API upserts via filehash. So our comicId can be the filehash locally!
        const localComicId = filehash; 

        const worker = new Worker(new URL('../workers/comicParser.worker.ts', import.meta.url), { type: 'module' });
        
        worker.onmessage = async (e) => {
          const { type, page, total, pages, error: workerErr } = e.data;
          
          if (type === 'PROGRESS') {
            setProgress({ page, total });
          } else if (type === 'DONE') {
            setIsParsing(false);
            setProgress(null);
            worker.terminate();

            // Setup cover image (compressed)
            let coverUrl: string | null = null;
            if (pages.length > 0) {
              const firstPage = pages[0];
              coverUrl = await compressCoverImage(firstPage.blob, 400);
              if (!coverUrl) coverUrl = null;
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

            // Inform server
            // 5. Add to server-side library (Postgres)
            const payload = {
              title: file.name.replace(/\.(cbz|cbr)$/i, ''),
              filehash,
              pageCount: pages.length,
              coverUrl,
            };

            const payloadSize = JSON.stringify(payload).length;
            console.log(`[useComicParser] Sending payload to /api/library (${(payloadSize / 1024).toFixed(2)} KB)`);

            const response = await fetch('/api/library', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              let errorMsg = 'Failed to save to library';
              let errorData: unknown = null;
              
              try {
                const text = await response.text();
                try {
                  const parsed = JSON.parse(text) as { error?: string, message?: string, details?: string };
                  errorData = parsed;
                  errorMsg = parsed.error || parsed.message || errorMsg;
                  if (parsed.details) {
                    errorMsg += `: ${parsed.details}`;
                  }
                } catch {
                  errorMsg = `Server returned ${response.status}: ${text || response.statusText}`;
                }
                
                console.error('[useComicParser] Server error detailed:', {
                  status: response.status,
                  statusText: response.statusText,
                  errorData: errorData as Record<string, unknown>,
                  rawText: text.substring(0, 1000) // Log first 1KB of raw response
                });
              } catch (e) {
                console.error('[useComicParser] Critical error reading response:', e);
              }
              
              reject(new Error(errorMsg));
              return;
            }

            const data = await response.json();
            console.log('[useComicParser] Successfully saved to library:', data.id);
            resolve(localComicId); // return the generated ID
          } else if (type === 'ERROR') {
            setIsParsing(false);
            setError(workerErr);
            worker.terminate();
            reject(new Error(workerErr));
          }
        };

        worker.postMessage({ type: 'PARSE', file, comicId: localComicId });

      } catch (err: unknown) {
        setIsParsing(false);
        setError(err instanceof Error ? err.message : 'Unknown parsing error');
        reject(err);
      }
    });
  }, []);

  return { parseComic, isParsing, progress, error };
}
