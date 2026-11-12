/**
 * @file TanStack Query + Session Provider wrapper
 *
 * Client-side providers that must wrap the entire app.
 * Kept here so the root layout can remain a Server Component.
 */
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import { MotionConfig } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import { NotificationProvider } from '@/components/atoms/Toast';
import { HAS_CLERK_KEY } from '@/lib/clerk-env';

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
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  const content = (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryClientProvider>
    </MotionConfig>
  );

  // Without a publishable key (local dev without auth, e2e) Clerk would throw —
  // render unprotected and let the middleware/test bypass own the session.
  if (!HAS_CLERK_KEY) return content;

  return (
    <ClerkProvider
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/login'}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/register'}
      signInFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || '/library'
      }
      signUpFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || '/onboarding'
      }
    >
      {content}
    </ClerkProvider>
  );
}
