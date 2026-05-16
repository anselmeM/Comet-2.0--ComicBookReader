import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/atoms/Toast';
import { signOut } from 'next-auth/react';

/**
 * Hook to provide a centralized authentication error handler.
 * Used to catch 401 (Unauthorized) or 403 (Forbidden) responses from the API
 * and redirect the user to the login page with a helpful message.
 */
export function useAuthCallback() {
  const router = useRouter();
  const { triggerNotification } = useNotification();

  /**
   * Handles authentication errors by showing a notification and redirecting to login.
   * 
   * @param response - Optional Fetch Response object to check status
   * @param error - Optional error object that might contain a status property
   * @returns {Promise<boolean>} True if an auth error was handled, false otherwise.
   */
  const handleAuthError = useCallback(async (response?: Response | null, error?: any, force = false) => {
    const status = response?.status || error?.status;
    const isUnauthorized = status === 401;
    const isForbidden = status === 403;

    if (isUnauthorized || isForbidden || force) {
      // Clear client-side session state safely
      try {
        await signOut({ redirect: false });
      } catch (e) {
        console.error('[useAuthCallback] Failed to clear session:', e);
      }
      
      triggerNotification(
        isForbidden 
          ? 'You do not have permission to perform this action.' 
          : 'Your session has expired. Please log in again.', 
        'error'
      );
      
      // Capture current path to return after re-login
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
      
      const loginUrl = new URL('/login', typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3100');
      
      loginUrl.searchParams.set('error', isForbidden ? 'AccessDenied' : 'SessionExpired');
      if (currentPath && !currentPath.includes('/login') && !currentPath.includes('/register')) {
        loginUrl.searchParams.set('callbackUrl', currentPath);
      }
      
      router.push(loginUrl.pathname + loginUrl.search);
      return true;
    }
    
    return false;
  }, [router, triggerNotification]);

  return { handleAuthError };
}
