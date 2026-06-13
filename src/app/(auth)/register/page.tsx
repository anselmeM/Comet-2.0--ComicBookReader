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
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, useMemo } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialErrorMsg);

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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="block w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                required
                minLength={8}
                disabled={loading}
              />
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
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className={`block w-full pl-11 pr-4 py-3 bg-zinc-950/50 border rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:border-transparent transition-all duration-200 outline-none ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : confirmPassword && password === confirmPassword
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-zinc-800 focus:ring-blue-500'
                }`}
                required
                disabled={loading}
              />
              {confirmPassword && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  {password === confirmPassword ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <X size={18} className="text-red-500" />
                  )}
                </div>
              )}
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
