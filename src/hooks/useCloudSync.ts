'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/errors';
import { useNotification } from '@/components/atoms/Toast';
import { logger } from '@/lib/logger';
import { getCachedComic } from '@/lib/idb';

export function useCloudSync() {
  const { triggerNotification } = useNotification();
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  /**
   * Uploads a part to the cloud with retry.
   * R2 intermittently resets large HTTP/2 PUTs, so each part (10 MB) is
   * retried with exponential backoff until it succeeds.
   */
  const uploadPartWithRetry = async (url: string, blob: Blob, maxRetries = 5): Promise<string> => {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'application/octet-stream' },
        });
        if (res.ok) {
          const etag = res.headers.get('ETag') || '"mock-etag"';
          return etag;
        } else {
          lastError = new Error(`Part upload failed: HTTP ${res.status}`);
        }
      } catch (e) {
        lastError = e instanceof Error ? e : new Error('Part upload failed');
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(1000 * 2 ** (attempt - 1), 8000)),
        );
      }
    }
    throw lastError || new Error('Part upload failed');
  };

  /**
   * Uploads a comic file to the cloud using a multipart upload.
   * Small parts keep each request well under R2's HTTP/2 reset threshold.
   */
  const uploadToCloud = async (comicId: string, file: File) => {
    let uploadId: string | undefined;
    try {
      setIsSyncing(true);

      // 1. Init multipart upload, get presigned URL per part
      const initRes = await fetch('/api/storage/multipart/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          contentType: file.type || 'application/octet-stream',
          fileName: file.name,
          fileSize: file.size,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json();
        throw new Error(err.error || 'Failed to init upload');
      }

      const { uploadId: initUploadId, partUrls, partSize } = await initRes.json();
      uploadId = initUploadId;

      // 2. Upload each part, retrying on failure
      const etags: { PartNumber: number; ETag: string }[] = [];
      for (let i = 0; i < partUrls.length; i++) {
        const start = i * partSize;
        const blob = file.slice(start, Math.min(start + partSize, file.size));
        const etag = await uploadPartWithRetry(partUrls[i], blob);
        etags.push({ PartNumber: i + 1, ETag: etag });
      }

      // 3. Complete the multipart upload
      const completeRes = await fetch('/api/storage/multipart/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicId, uploadId, parts: etags }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || 'Failed to complete upload');
      }

      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['comic-metadata', comicId] });
      triggerNotification('Comic synced to cloud', 'success');
    } catch (error) {
      logger.error('[CLOUD_UPLOAD_ERROR]', {}, error instanceof Error ? error : undefined);
      triggerNotification(`Cloud sync failed: ${getErrorMessage(error)}`, 'error');

      // Abort the multipart upload and mark as error on server
      if (uploadId) {
        try {
          await fetch('/api/storage/multipart/abort', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comicId, uploadId }),
          });
        } catch (abortError) {
          logger.error('[CLOUD_UPLOAD_ABORT_ERROR]', {}, abortError as Error);
        }
      }

      await fetch('/api/storage/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          status: 'ERROR',
        }),
      });

      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['comic-metadata', comicId] });
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Syncs a locally cached comic from IndexedDB to the cloud.
   */
  const syncLocalComicToCloud = async (comicId: string, userId?: string) => {
    try {
      setIsSyncing(true);
      triggerNotification('Preparing comic for cloud sync...', 'info');

      const cached = await getCachedComic(comicId, userId);
      if (!cached || !cached.pages || cached.pages.length === 0) {
        throw new Error('Comic pages not found in local cache');
      }

      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      cached.pages.forEach((page, index) => {
        const ext = page.blob.type.includes('png')
          ? 'png'
          : page.blob.type.includes('webp')
            ? 'webp'
            : 'jpg';
        const filename = `page_${String(index + 1).padStart(4, '0')}.${ext}`;
        zip.file(filename, page.blob);
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.comicbook+zip',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const fileName = `${cached.title || 'comic'}.cbz`;
      const file = new File([zipBlob], fileName, { type: 'application/vnd.comicbook+zip' });

      await uploadToCloud(comicId, file);
    } catch (error) {
      logger.error(
        '[SYNC_LOCAL_COMIC_ERROR]',
        { comicId },
        error instanceof Error ? error : undefined,
      );
      triggerNotification(`Failed to sync to cloud: ${getErrorMessage(error)}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Downloads a comic from the cloud.
   * Returns a File object that can be passed to the parser.
   */
  const downloadFromCloud = async (comicId: string, title: string): Promise<File | null> => {
    try {
      setIsSyncing(true);

      // 1. Get pre-signed download URL
      const res = await fetch(`/api/storage/download?comicId=${comicId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get download URL');
      }

      const { url } = await res.json();

      // 2. Fetch the file
      const downloadRes = await fetch(url);
      if (!downloadRes.ok) {
        throw new Error('Failed to download comic from cloud');
      }

      const blob = await downloadRes.blob();

      // Determine appropriate file extension based on magic bytes or existing title
      let finalTitle = title;
      const hasValidExtension = ['.cbz', '.cbr', '.zip'].some((ext) =>
        title.toLowerCase().endsWith(ext),
      );
      if (!hasValidExtension) {
        const headerSlice = blob.slice(0, 4);
        const headerBuffer = await headerSlice.arrayBuffer();
        const headerView = new Uint8Array(headerBuffer);

        const isZip =
          headerView[0] === 0x50 &&
          headerView[1] === 0x4b &&
          headerView[2] === 0x03 &&
          headerView[3] === 0x04;
        const isRar =
          headerView[0] === 0x52 &&
          headerView[1] === 0x61 &&
          headerView[2] === 0x72 &&
          headerView[3] === 0x21;

        if (isRar) {
          finalTitle = `${title}.cbr`;
        } else {
          finalTitle = `${title}.cbz`; // Default fallback to .cbz (ZIP)
        }
      }

      // 3. Create a File object
      return new File([blob], finalTitle, { type: blob.type });
    } catch (error) {
      logger.error('[CLOUD_DOWNLOAD_ERROR]', {}, error instanceof Error ? error : undefined);
      triggerNotification(`Download failed: ${getErrorMessage(error)}`, 'error');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    uploadToCloud,
    syncLocalComicToCloud,
    downloadFromCloud,
    isSyncing,
  };
}
