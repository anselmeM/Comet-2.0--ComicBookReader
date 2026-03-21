'use client';

import { motion } from 'framer-motion';
import { UserPlus, Sparkles, KeyRound, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function RegisterForm() {
  const searchParams = useSearchParams();
  const errorUrl = searchParams.get('error');
  const [email, setEmail] = useState('');

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.1,
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
  };

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(errorUrl ? 'There was a problem signing you up. Please try again.' : '');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Register the user
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json();
        setErrorMsg(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      // 2. Log them in automatically
      const { signIn } = await import('next-auth/react');
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setErrorMsg('Registered successfully, but login failed.');
        setLoading(false);
      } else {
        window.location.href = '/onboarding';
      }
    } catch {
      setErrorMsg('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="w-full max-w-md"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Glass Card */}
      <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl shadow-2xl relative z-10">
        
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-2">
            Create an account
          </h1>
          <p className="text-zinc-400 text-sm">
            Start building your ultimate digital library
          </p>
        </motion.div>

        {errorMsg && (
            <motion.div variants={itemVariants} className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">
                {errorMsg}
              </p>
            </motion.div>
        )}

        <div className="space-y-6">
          <motion.form variants={itemVariants} onSubmit={handleRegister} className="space-y-4">
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
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-900/20 border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Sign up with Email
                </>
              )}
            </button>
          </motion.form>

          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-zinc-500 backdrop-blur-xl">Or continue with</span>
            </div>
          </motion.div>

          {/* Demo Account Button */}
          <motion.div variants={itemVariants}>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setErrorMsg('');
                const { signIn } = await import('next-auth/react');
                try {
                  const res = await signIn('credentials', {
                    email: 'test@example.com',
                    password: 'password',
                    redirect: false,
                  });
                  if (res?.error) {
                    setErrorMsg('Demo account is unavailable');
                    setLoading(false);
                  } else {
                    window.location.href = '/library';
                  }
                } catch {
                  setErrorMsg('An unexpected error occurred');
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] border border-zinc-700 hover:border-zinc-600 disabled:opacity-50"
            >
              <KeyRound className="w-5 h-5 text-zinc-400" />
              Demo Account
            </button>
          </motion.div>

        </div>

        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Log in
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

      <Suspense fallback={
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl shadow-2xl relative z-10 w-full max-w-md flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm">Preparing registration...</p>
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
