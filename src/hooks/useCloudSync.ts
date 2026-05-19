'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/components/atoms/Toast';

export function useCloudSync() {
  const { data: session } = useSession();
  const { triggerNotification } = useNotification();
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Uploads a comic file to the cloud.
   */
  const uploadToCloud = async (comicId: string, file: File) => {
    if (session?.user?.plan !== 'PREMIUM') return;

    try {
      setIsSyncing(true);
      
      // 1. Get pre-signed URL
      const res = await fetch('/api/storage/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          contentType: file.type || 'application/octet-stream',
          fileName: file.name
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
          status: 'SYNCED'
        }),
      });

      triggerNotification('Comic synced to cloud', 'success');
    } catch (error: any) {
      console.error('[CLOUD_UPLOAD_ERROR]', error);
      triggerNotification(`Cloud sync failed: ${error.message}`, 'error');
      
      // Mark as error on server
      await fetch('/api/storage/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicId,
          status: 'ERROR'
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
    if (session?.user?.plan !== 'PREMIUM') return null;

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
      
      // 3. Create a File object
      // We don't necessarily know the original extension here without storing it, 
      // but the parser uses magic bytes anyway.
      return new File([blob], title, { type: blob.type });
    } catch (error: any) {
      console.error('[CLOUD_DOWNLOAD_ERROR]', error);
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
