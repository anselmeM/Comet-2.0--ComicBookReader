'use client';

import { motion } from 'framer-motion';
import { LogIn, Rocket, KeyRound, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function LoginContent() {
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
  const [errorMsg, setErrorMsg] = useState(errorUrl ? "There was a problem signing you in. The test account may be unavailable or your credentials didn't match." : '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    // Dynamically import signIn from next-auth/react to avoid client/server component issues if applicable
    const { signIn } = await import('next-auth/react');
    
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErrorMsg('Invalid email or password');
        setLoading(false);
      } else {
        window.location.href = '/library';
      }
    } catch {
      setErrorMsg('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Glass Card */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl shadow-2xl relative z-10">
          
          <motion.div variants={itemVariants} className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-violet-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
              <Rocket className="w-8 h-8 text-white" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 mb-2">
              Welcome back
            </h1>
            <p className="text-zinc-400 text-sm">
              Sign in to your Comet library
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
            <motion.form variants={itemVariants} onSubmit={handleLogin} className="space-y-4">
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
                    <LogIn className="w-5 h-5" />
                    Sign in
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

            {/* Test Account Form */}
            <motion.form variants={itemVariants} action="/api/auth/callback/credentials" method="POST">
               <input type="hidden" name="callbackUrl" value="/library" />
               <input type="hidden" name="email" value="test@example.com" />
               <input type="hidden" name="password" value="password" />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] border border-zinc-700 hover:border-zinc-600"
              >
                <KeyRound className="w-5 h-5 text-zinc-400" />
                Test Account (Demo)
              </button>
            </motion.form>

          </div>

          <motion.div variants={itemVariants} className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Don&apos;t have an account?{` `}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create one now
              </Link>
            </p>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
