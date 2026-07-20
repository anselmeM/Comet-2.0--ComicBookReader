import { useState, useCallback } from 'react';
import { runComicPipeline, ParseProgress } from '@/lib/comic-pipeline';
import { useAuthCallback } from './useAuthCallback';
import { useCloudSync } from './useCloudSync';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/components/atoms/Toast';

export type { ParseProgress } from '@/lib/comic-pipeline';

/**
 * Hook providing the comic parsing pipeline bound to React auth, cloud sync, and notifications.
 */
export function useComicParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState<ParseProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { handleAuthError } = useAuthCallback();
  const { uploadToCloud } = useCloudSync();
  const { data: session } = useSession();
  const { triggerNotification } = useNotification();

  const parseComic = useCallback(
    async (file: File, options: { skipServerPOST?: boolean; existingComicId?: string } = {}) => {
      setIsParsing(true);
      setError(null);

      try {
        return await runComicPipeline(file, {
          ...options,
          userId: session?.user?.id,
          userPlan: session?.user?.plan,
          onProgress: setProgress,
          onBadgeEarned: (badge) => {
            triggerNotification(`🏆 Badge Unlocked: ${badge.name}!`, 'success', undefined, 5000);
          },
          uploadToCloud,
          handleAuthError,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown parsing error';
        setError(errorMsg);
        throw err;
      } finally {
        setIsParsing(false);
        setProgress(null);
      }
    },
    [handleAuthError, session, uploadToCloud, triggerNotification],
  );

  return { parseComic, isParsing, progress, error };
}
