'use client';

import { motion } from 'framer-motion';
import {
  UserPlus,
  Sparkles,
  KeyRound,
  Mail,
  AlertCircle,
  ArrowLeft,
  Check,
  X,
  User,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

// Password requirement item component (defined outside to avoid "component during render" error)
function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center ${met ? 'bg-green-500' : 'bg-zinc-700'}`}
      >
        {met ? <Check size={10} className="text-white" /> : null}
      </div>
      <span className={met ? 'text-green-400' : 'text-zinc-500'}>{text}</span>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const errorParam = searchParams.get('error');

  // Initialize error message from URL parameter (if present)
  const initialErrorMsg =
    errorParam === 'email_exists'
      ? 'An account with this email already exists. Please sign in instead.'
      : errorParam
        ? 'Registration failed. Please try again.'
        : '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialErrorMsg);

  const nameRef = useRef<HTMLInputElement>(null);

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

  // Redirect if already authenticated (router.push is an external system call, so this is allowed)
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/library');
    }
  }, [status, router]);

  // Focus the first input field on load
  useEffect(() => {
    if (status !== 'loading') {
      nameRef.current?.focus();
    }
  }, [status]);

  // Compute password validation using useMemo instead of useEffect
  const passwordValidation = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password],
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Validate inputs
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      setLoading(false);
      return;
    }

    if (!password) {
      setErrorMsg('Please enter a password.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please try again.');
      setLoading(false);
      return;
    }

    // Check password strength
    const isValidPassword = Object.values(passwordValidation).every(Boolean);
    if (!isValidPassword) {
      setErrorMsg('Please ensure your password meets all requirements.');
      setLoading(false);
      return;
    }

    try {
      // 1. Register the user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json();
        if (data.message?.includes('already exists') || data.code === 'P2002') {
          setErrorMsg('An account with this email already exists. Please sign in instead.');
        } else {
          setErrorMsg(data.message || 'Registration failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      // 2. Log them in automatically
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setErrorMsg('Account created, but automatic login failed. Please sign in manually.');
        setLoading(false);
      } else if (result?.ok) {
        router.push('/onboarding');
      }
    } catch (err) {
      logger.error(
        '[RegisterForm] Registration error:',
        {},
        err instanceof Error ? err : undefined,
      );
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Preparing registration...</p>
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
      {/* Glass Card */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl shadow-2xl relative z-10">
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            {name && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 font-black text-lg border-2 border-indigo-600 shadow-xl"
              >
                {name.charAt(0).toUpperCase()}
              </motion.div>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-1">
              {name ? `Hi, ${name}!` : 'Create your account'}
            </h1>
            <p className="text-zinc-400 text-sm">
              {name
                ? 'Ready to build your ultimate library?'
                : 'Start building your ultimate digital comic library'}
            </p>
          </div>
        </motion.div>

        {errorMsg && (
          <motion.div
            variants={itemVariants}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{errorMsg}</p>
          </motion.div>
        )}

        <div className="space-y-6">
          <motion.form variants={itemVariants} onSubmit={handleRegister} className="space-y-4">
            {/* Name Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
                className="block w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                required
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="block w-full pl-11 pr-12 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                required
                minLength={8}
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

            {/* Password Requirements */}
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-zinc-950/30 rounded-xl p-4 space-y-2"
              >
                <p className="text-xs text-zinc-500 mb-2 font-medium">Password must contain:</p>
                <div className="grid grid-cols-2 gap-2">
                  <RequirementItem met={passwordValidation.length} text="8+ characters" />
                  <RequirementItem met={passwordValidation.uppercase} text="Uppercase letter" />
                  <RequirementItem met={passwordValidation.lowercase} text="Lowercase letter" />
                  <RequirementItem met={passwordValidation.number} text="Number" />
                  <RequirementItem met={passwordValidation.special} text="Special character" />
                </div>
              </motion.div>
            )}

            {/* Confirm Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`block w-full pl-11 pr-20 py-3 bg-zinc-950/50 border rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:border-transparent transition-all duration-200 outline-none ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : confirmPassword && password === confirmPassword
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-zinc-800 focus:ring-blue-500'
                }`}
                required
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirmation password'
                      : 'Show confirmation password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                {confirmPassword && (
                  <div>
                    {password === confirmPassword ? (
                      <Check size={18} className="text-green-500" />
                    ) : (
                      <X size={18} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                (password.length > 0 && !Object.values(passwordValidation).every(Boolean))
              }
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create account
                </>
              )}
            </button>
          </motion.form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-zinc-800/80"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-3 text-zinc-500 rounded-full border border-zinc-800/30">
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
              className="flex items-center justify-center py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 hover:bg-zinc-900/60 transition-all text-zinc-300 hover:text-white disabled:opacity-50 shadow-sm cursor-pointer"
              title="Sign up with Google"
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
              className="flex items-center justify-center py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 hover:bg-zinc-900/60 transition-all text-zinc-300 hover:text-white disabled:opacity-50 shadow-sm cursor-pointer"
              title="Sign up with GitHub"
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
              className="flex items-center justify-center py-2.5 border border-zinc-800 rounded-xl bg-zinc-950/40 hover:bg-zinc-900/60 transition-all text-zinc-300 hover:text-white disabled:opacity-50 shadow-sm cursor-pointer"
              title="Sign up with Discord"
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
          <p className="text-zinc-500 text-sm">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Back to Home Link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm">Back to home</span>
      </Link>

      <Suspense
        fallback={
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl shadow-2xl relative z-10 w-full max-w-md flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-zinc-400 text-sm">Preparing registration...</p>
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
