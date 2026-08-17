'use client';

import { motion, type Variants } from 'framer-motion';
import { Sparkles, Zap, BookOpen, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  variants: Variants;
  custom: number;
  onNext: () => void;
}

/** Onboarding step 1 — the welcome screen. */
export const WelcomeStep = ({ variants, custom, onNext }: WelcomeStepProps) => {
  return (
    <motion.div
      key="step1"
      custom={custom}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-8"
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/20">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic mb-4">
          Welcome to Comet.
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
          Your personal comic universe is ready. Let&apos;s get you set up with the speed of light
          reading experience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Offline First</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Your comics are stored locally on your device. Read anywhere, anytime, even when the
            internet drops out.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Immersive Reading</h3>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Custom reading modes, slick page turns, and high-res art appreciation built for any
            screen size.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          className="group flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wider"
        >
          Configure Settings
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
};
