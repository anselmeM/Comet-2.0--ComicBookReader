'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from './actions';
import { logger } from '@/lib/logger';

export default function OnboardingClient() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await completeOnboarding();
      await update();
      router.push('/library');
    } catch (error) {
      logger.error(
        'Failed to complete onboarding:',
        {},
        error instanceof Error ? error : undefined,
      );
      setIsCompleting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="w-full max-w-2xl relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="text-center mb-12">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/30"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 mb-4"
          >
            Welcome to Comet,{' '}
            {session?.user?.name || session?.user?.email?.split('@')[0] || 'Reader'}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto"
          >
            Your personal comic universe is ready. Let&apos;s get you set up with the speed of light
            reading experience.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-3xl transition-transform hover:scale-105"
          >
            <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Offline First</h3>
            <p className="text-zinc-400 text-sm">
              Your comics are stored locally on your device. Read anywhere, anytime, even when the
              internet drops out.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-6 rounded-3xl transition-transform hover:scale-105"
          >
            <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Immersive Reading</h3>
            <p className="text-zinc-400 text-sm">
              Custom reading modes, slick page turns, and high-res art appreciation built for any
              screen size.
            </p>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="flex justify-center">
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="group flex items-center gap-3 bg-white hover:bg-zinc-100 disabled:bg-zinc-400 text-zinc-950 font-bold text-lg py-4 px-8 rounded-2xl transition-all shadow-[0_10px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:-translate-y-1 active:scale-95 min-w-[240px] justify-center"
          >
            {isCompleting ? (
              <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Enter Your Library
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
