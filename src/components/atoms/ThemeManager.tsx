'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Client-side component that applies the theme class to the document root
 * based on the user's session data.
 */
export function ThemeManager() {
  const { data: session } = useSession();

  useEffect(() => {
    // Get theme from session
    const theme = session?.user?.theme || 'dark';
    
    // Remove all possible theme classes
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-sepia');
    
    // Add the active theme class
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Update meta theme color for PWA polish
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (theme === 'light') {
        metaThemeColor.setAttribute('content', '#ffffff');
      } else if (theme === 'sepia') {
        metaThemeColor.setAttribute('content', '#f4ecd8');
      } else {
        metaThemeColor.setAttribute('content', '#0a0a0f');
      }
    }
  }, [session]);

  return null; // This component doesn't render anything
}
