'use client';

import { useState } from 'react';
import { useNotification } from '@/components/atoms/Toast';
import { logger } from '@/lib/logger';

export function useCloudSync() {
  const { triggerNotification } = useNotification();
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Uploads a comic file to the cloud.
   */
  const uploadToCloud = async (comicId: string, file: File) => {
    try {
      setIsSyncing(true);

      // 1. Get pre-signed URL
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          contentType: file.type || 'application/octet-stream',
          fileName: file.name,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to get upload URL');
      }

      const { url } = await res.json();

      // 2. Upload to S3/R2 directly
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Cloud upload failed');
      }

      // 3. Mark as synced on server
      await fetch('/api/storage/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          status: 'SYNCED',
        }),
      });

      triggerNotification('Comic synced to cloud', 'success');
    } catch (error: any) {
      logger.error('[CLOUD_UPLOAD_ERROR]', {}, error instanceof Error ? error : undefined);
      triggerNotification(`Cloud sync failed: ${error.message}`, 'error');

      // Mark as error on server
      await fetch('/api/storage/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          status: 'ERROR',
        }),
      });
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
    } catch (error: any) {
      logger.error('[CLOUD_DOWNLOAD_ERROR]', {}, error instanceof Error ? error : undefined);
      triggerNotification(`Download failed: ${error.message}`, 'error');
      return null;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    uploadToCloud,
    downloadFromCloud,
    isSyncing,
  };
}
