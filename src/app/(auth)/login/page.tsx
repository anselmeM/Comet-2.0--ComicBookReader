'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { getSafeRedirect } from '@/lib/url';
import { HAS_CLERK_KEY } from '@/lib/clerk-env';

function LoginForm() {
  const searchParams = useSearchParams();

  // Clerk's middleware protect() sends ?redirect_url=<original>; older links
  // may still carry ?callbackUrl=. Honor either, defaulting to the library.
  const rawCallbackUrl = searchParams.get('redirect_url') || searchParams.get('callbackUrl');
  const callbackUrl = getSafeRedirect(rawCallbackUrl, '/library');

  // Keyless environments (local dev without auth, e2e): Clerk components
  // require a publishable key, so render a placeholder instead of crashing.
  if (!HAS_CLERK_KEY) {
    return (
      <div className="bg-neutral-950 border-2 border-neutral-800 rounded-2xl p-8 max-w-md text-center space-y-4">
        <h1 className="text-2xl font-black uppercase italic text-white">Sign in</h1>
        <p className="text-neutral-400 text-sm">
          Authentication is not configured in this environment (missing
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).
        </p>
        <Link
          href="/register"
          className="inline-block text-comet-orange hover:text-comet-orange-light font-black uppercase tracking-wider text-xs"
        >
          Create one now
        </Link>
      </div>
    );
  }

  return (
    <SignIn
      fallbackRedirectUrl={callbackUrl}
      signUpUrl="/register"
      appearance={{
        theme: dark,
        variables: { colorPrimary: '#ff5c1a' },
      }}
    />
  );
}

export default function LoginPage() {
  const shouldReduceMotion = useReducedMotion();
  const isReduced = !!shouldReduceMotion;

  return (
    <div className="min-h-screen flex items-center justify-center bg-comet-ink text-[#e8e8f0] p-4 relative overflow-hidden bg-halftone">
      {/* Background Gradients (Warm Sunset Nebula) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={
            isReduced
              ? {}
              : {
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, 0],
                }
          }
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-lime-500/5 rounded-full blur-[140px]"
        />
        <motion.div
          animate={
            isReduced
              ? {}
              : {
                  scale: [1, 1.15, 1],
                  rotate: [0, -8, 0],
                }
          }
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-comet-orange/5 rounded-full blur-[140px]"
        />
      </div>

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-xl border-2 border-neutral-850 bg-neutral-950/40 px-4 py-2 text-xs font-heading font-black uppercase text-neutral-300 hover:text-white hover:border-comet-orange transition-all z-50 cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to home</span>
      </Link>

      <Suspense
        fallback={
          <div className="bg-neutral-950 border-3 border-neutral-950 p-8 rounded-[2rem] shadow-[8px_8px_0px_0px_var(--color-comet-orange)] relative z-10 w-full max-w-md flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-comet-orange/20 border-t-comet-orange rounded-full animate-spin" />
            <p className="text-neutral-400 text-sm font-semibold">Loading login...</p>
          </div>
        }
      >
        <div className="relative z-10">
          <LoginForm />
        </div>
      </Suspense>
    </div>
  );
}
