'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { LogIn, Rocket, KeyRound, Mail, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { getErrorMessage } from '@/lib/errors';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';

import { logger } from '@/lib/logger';
import { getSafeRedirect } from '@/lib/url';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const shouldReduceMotion = useReducedMotion();
  const isReduced = !!shouldReduceMotion;

  // Get callback URL from query params (set by middleware)
  const rawCallbackUrl = searchParams.get('callbackUrl');
  const callbackUrl = getSafeRedirect(rawCallbackUrl, '/library');
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const emailRef = useRef<HTMLInputElement>(null);

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  // Focus the first input field on load
  useEffect(() => {
    if (status !== 'loading') {
      emailRef.current?.focus();
    }
  }, [status]);

  // Initialize error message from URL parameter (if present)
  useEffect(() => {
    if (errorParam === 'SessionExpired') {
      setErrorMsg('Your session has expired. Please sign in again to continue.');
    } else if (errorParam === 'CredentialsSignin') {
      setErrorMsg('Invalid email or password.');
    } else if (errorParam) {
      setErrorMsg('An error occurred during sign in. Please try again.');
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        // NextAuth returns specific error codes or strings.
        if (result.error === 'CredentialsSignin' || result.error.includes('CallbackRouteError')) {
          setErrorMsg('Invalid email or password.');
        } else if (result.error.includes('Account locked')) {
          setErrorMsg(result.error);
        } else {
          setErrorMsg(`Login Failed: ${result.error}`);
        }
        setLoading(false);
      } else if (result?.ok) {
        // Force a hard refresh to the callback URL so session state is fully initialized
        window.location.href = callbackUrl;
      }
    } catch (err) {
      logger.error('[LoginForm] Client sign in error:', {}, err instanceof Error ? err : undefined);
      setErrorMsg(`Crash: ${getErrorMessage(err)}`);
      setLoading(false);
    }
  };

  // Render the form
  if (status === 'loading') {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#ff5a00]/20 border-t-[#ff5a00] rounded-full animate-spin" />
        <p className="text-neutral-400 text-sm font-semibold">Checking session...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-md"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Neo-brutalist Panel */}
      <div className="bg-neutral-950 border-3 border-neutral-950 rounded-[2rem] shadow-[8px_8px_0px_0px_#ff5a00] p-8 md:p-10 relative z-10">
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="relative">
            <div className="bg-[#ff5a00] border-2 border-neutral-950 shadow-[3px_3px_0px_0px_#000] p-4 rounded-2xl">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            {email && email.includes('@') && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-2 -right-2 w-10 h-10 bg-[#a3e635] text-neutral-950 rounded-full flex items-center justify-center font-heading font-black text-lg border-2 border-neutral-950 shadow-[2px_2px_0px_0px_#000]"
              >
                {email.split('@')[0].charAt(0).toUpperCase()}
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-3xl font-heading font-black uppercase italic text-white mb-2">
            {email && email.includes('@') ? `Hi, ${email.split('@')[0]}!` : 'Welcome back'}
          </h1>
          <p className="text-neutral-400 text-sm font-medium">
            {email && email.includes('@')
              ? 'Great to see you again.'
              : 'Sign in to access your Comet library'}
          </p>
        </motion.div>

        {errorMsg && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 font-semibold">{errorMsg}</p>
          </motion.div>
        )}

        <div className="space-y-6">
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full pl-11 pr-4 py-3 bg-neutral-900/50 border-2 border-neutral-850 hover:border-[#ff5a00]/40 focus:border-[#ff5a00] rounded-xl text-white placeholder-neutral-500 transition-all outline-none font-medium focus:ring-2 focus:ring-[#ff5a00]/10"
                required
                disabled={loading}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="block w-full pl-11 pr-12 py-3 bg-neutral-900/50 border-2 border-neutral-850 hover:border-[#ff5a00]/40 focus:border-[#ff5a00] rounded-xl text-white placeholder-neutral-500 transition-all outline-none font-medium focus:ring-2 focus:ring-[#ff5a00]/10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className={`text-xs font-heading font-black uppercase tracking-wider text-[#ff5a00] hover:text-[#ff7830] transition-colors ${loading ? 'pointer-events-none opacity-50' : ''}`}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#ff5a00] hover:bg-[#e65100] disabled:bg-[#ff5a00]/50 disabled:cursor-not-allowed text-white font-heading font-black uppercase tracking-wider py-3.5 px-4 border-2 border-neutral-950 rounded-xl transition-all active:scale-[0.98] shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </motion.form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-neutral-850"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-neutral-950 px-3 text-neutral-500 rounded-full border-2 border-neutral-850">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-3 gap-3">
            {/* Google Button */}
            <button
              type="button"
              onClick={() => signIn('google')}
              disabled={loading}
              className="flex items-center justify-center py-2.5 border-2 border-neutral-950 rounded-xl bg-neutral-900 hover:bg-neutral-850 transition-all text-neutral-300 hover:text-white disabled:opacity-50 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#ff5a00] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
              title="Sign in with Google"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.47-.46-.83-.99-1.09-1.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            </button>

            {/* GitHub Button */}
            <button
              type="button"
              onClick={() => signIn('github')}
              disabled={loading}
              className="flex items-center justify-center py-2.5 border-2 border-neutral-950 rounded-xl bg-neutral-900 hover:bg-neutral-850 transition-all text-neutral-300 hover:text-white disabled:opacity-50 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#ff5a00] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
              title="Sign in with GitHub"
            >
              <svg
                className="w-5 h-5 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
            </button>

            {/* Discord Button */}
            <button
              type="button"
              onClick={() => signIn('discord')}
              disabled={loading}
              className="flex items-center justify-center py-2.5 border-2 border-neutral-950 rounded-xl bg-neutral-900 hover:bg-neutral-850 transition-all text-neutral-300 hover:text-white disabled:opacity-50 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#ff5a00] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none cursor-pointer"
              title="Sign in with Discord"
            >
              <svg
                className="w-5 h-5 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
              </svg>
            </button>
          </div>
        </div>

        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-neutral-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-[#ff5a00] hover:text-[#ff7830] font-heading font-black uppercase tracking-wider text-xs transition-colors"
            >
              Create one now
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  const shouldReduceMotion = useReducedMotion();
  const isReduced = !!shouldReduceMotion;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-[#e8e8f0] p-4 relative overflow-hidden bg-halftone">
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
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#ff5a00]/5 rounded-full blur-[140px]"
        />
      </div>

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-xl border-2 border-neutral-850 bg-neutral-950/40 px-4 py-2 text-xs font-heading font-black uppercase text-neutral-300 hover:text-white hover:border-[#ff5a00] transition-all z-50 cursor-pointer"
      >
        <ArrowLeft size={14} />
        <span>Back to home</span>
      </Link>

      <Suspense
        fallback={
          <div className="bg-neutral-950 border-3 border-neutral-950 p-8 rounded-[2rem] shadow-[8px_8px_0px_0px_#ff5a00] relative z-10 w-full max-w-md flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#ff5a00]/20 border-t-[#ff5a00] rounded-full animate-spin" />
            <p className="text-neutral-400 text-sm font-semibold">Loading login...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
