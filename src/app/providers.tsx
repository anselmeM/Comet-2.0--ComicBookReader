/**
 * @file TanStack Query + Session Provider wrapper
 *
 * Client-side providers that must wrap the entire app.
 * Kept here so the root layout can remain a Server Component.
 */
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { useState, type ReactNode } from 'react';
import { NotificationProvider } from '@/components/atoms/Toast';
import { FavoritesProvider } from '@/hooks/useFavorites';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create a stable QueryClient that lives for the tab's lifetime
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
