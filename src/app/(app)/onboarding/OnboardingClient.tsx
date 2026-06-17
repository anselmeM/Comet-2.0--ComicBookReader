'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Check,
  AlertCircle,
  Loader2,
  Columns,
  BookOpenCheck,
  Eye,
  AlignLeft,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { completeOnboarding } from './actions';
import { useComicParser } from '@/hooks/useComicParser';
import { logger } from '@/lib/logger';

type ReadingModeType = 'single-page' | 'single-vertical' | 'dual-spread' | 'manga-rtl';
type ThemeType = 'dark' | 'light' | 'sepia';

export default function OnboardingClient() {
  const { data: session, update } = useSession();
  const router = useRouter();

  // Onboarding Step State (1: Welcome, 2: Preferences, 3: Optional Upload)
  const [step, setStep] = useState<number>(1);

  // Preference States
  const [readingMode, setReadingMode] = useState<ReadingModeType>('single-page');
  const [theme, setTheme] = useState<ThemeType>('dark');

  // Upload States
  const { parseComic, isParsing, progress: parseProgress, error: parseError } = useComicParser();
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Save preferences and mark onboarding complete
      await completeOnboarding({
        defaultReadingMode: readingMode,
        theme: theme,
      });
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

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploadedFileName(file.name);
      await parseComic(file);
    } catch (e) {
      logger.error('Onboarding file upload failed:', {}, e instanceof Error ? e : undefined);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const stepVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 100 : -100,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -100 : 100,
      transition: { ease: 'easeIn' as const, duration: 0.2 },
    }),
  };

  const [direction, setDirection] = useState(1);

  const nextStep = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4 relative overflow-hidden text-white">
      {/* Background Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10 bg-zinc-900/30 backdrop-blur-2xl border border-zinc-800/80 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden">
        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800/50">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Step {step} of 3
          </span>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-indigo-500' : 'w-2 bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={stepVariants}
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
                  Your personal comic universe is ready. Let&apos;s get you set up with the speed of
                  light reading experience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                  <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Offline First</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Your comics are stored locally on your device. Read anywhere, anytime, even when
                    the internet drops out.
                  </p>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                  <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Immersive Reading</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Custom reading modes, slick page turns, and high-res art appreciation built for
                    any screen size.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={nextStep}
                  className="group flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wider"
                >
                  Configure Settings
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter italic mb-2">
                  Configure Your Preferences
                </h2>
                <p className="text-zinc-400 text-xs md:text-sm">
                  Choose your default viewing parameters. These can be adjusted anytime in settings.
                </p>
              </div>

              {/* Reading Mode Selection */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
                  Default Reading Mode
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ModeOption
                    active={readingMode === 'single-page'}
                    onClick={() => setReadingMode('single-page')}
                    icon={<Eye className="w-5 h-5" />}
                    title="Single Page"
                  />
                  <ModeOption
                    active={readingMode === 'single-vertical'}
                    onClick={() => setReadingMode('single-vertical')}
                    icon={<AlignLeft className="w-5 h-5" />}
                    title="Vertical Scroll"
                  />
                  <ModeOption
                    active={readingMode === 'dual-spread'}
                    onClick={() => setReadingMode('dual-spread')}
                    icon={<Columns className="w-5 h-5" />}
                    title="Dual Spread"
                  />
                  <ModeOption
                    active={readingMode === 'manga-rtl'}
                    onClick={() => setReadingMode('manga-rtl')}
                    icon={<BookOpenCheck className="w-5 h-5" />}
                    title="Manga RTL"
                  />
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
                  Default Color Theme
                </span>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-indigo-500 bg-zinc-950 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'border-zinc-850 bg-zinc-950/40 text-zinc-400 hover:border-zinc-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700" />
                    <span className="text-xs font-bold">Midnight Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-indigo-500 bg-white text-zinc-900 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'border-zinc-850 bg-zinc-100/10 text-zinc-400 hover:border-zinc-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-white border border-zinc-350" />
                    <span className="text-xs font-bold">Paper Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('sepia')}
                    className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                      theme === 'sepia'
                        ? 'border-indigo-500 bg-[#f4ecd8] text-[#5b4636] shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'border-zinc-850 bg-[#f4ecd8]/40 text-[#a39485] hover:border-zinc-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#f4ecd8] border border-[#d8ccb8]" />
                    <span className="text-xs font-bold">Warm Sepia</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 border border-zinc-800 hover:bg-zinc-850 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-wider"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={nextStep}
                  className="group flex items-center gap-2 bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wider"
                >
                  Upload Comics
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter italic mb-2">
                  Populate Your Library
                </h2>
                <p className="text-zinc-400 text-xs md:text-sm">
                  Optional: Upload a comic archive (.cbz or .cbr) to get started immediately.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  !isParsing && document.getElementById('onboarding-upload-input')?.click()
                }
                className={`border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center min-h-[220px] ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
                    : 'border-zinc-800 bg-zinc-950/20 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                } ${isParsing ? 'cursor-not-allowed' : ''}`}
              >
                <input
                  id="onboarding-upload-input"
                  type="file"
                  accept=".cbz,.cbr"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={isParsing}
                />

                {isParsing ? (
                  <div className="space-y-4 w-full px-4" aria-live="polite">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-white font-bold text-xs uppercase tracking-wider">
                        {parseProgress?.phase === 'hashing'
                          ? 'Analyzing magic bytes...'
                          : 'Decompressing comic pages...'}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {parseProgress ? `${parseProgress.page} / ${parseProgress.total}` : ''}
                      </p>
                    </div>
                    {/* Progress bar */}
                    {parseProgress && (
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-200"
                          style={{
                            width: `${(parseProgress.page / parseProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : uploadedFileName && !parseError ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto text-green-400">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Upload complete!</p>
                      <p className="text-xs text-zinc-400 mt-1 max-w-[300px] truncate mx-auto">
                        {uploadedFileName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFileName(null);
                      }}
                      className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors"
                    >
                      Upload another
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 mb-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <p className="font-bold text-white text-sm mb-1">
                      Drag & drop your .cbz or .cbr file
                    </p>
                    <p className="text-xs text-zinc-500">Or click to browse from your device.</p>
                  </>
                )}
              </div>

              {parseError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200">{parseError}</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={prevStep}
                  disabled={isParsing || isCompleting}
                  className="flex items-center gap-2 border border-zinc-800 hover:bg-zinc-850 disabled:opacity-50 text-white font-semibold py-3.5 px-6 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-wider"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isParsing || isCompleting}
                  className="group flex items-center gap-3 bg-white hover:bg-zinc-100 disabled:opacity-50 text-zinc-950 font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg active:scale-95 text-sm uppercase tracking-wider"
                >
                  {isCompleting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  ) : (
                    <>
                      Finish & Enter Library
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ModeOptionProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}

function ModeOption({ active, onClick, icon, title }: ModeOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-3 cursor-pointer ${
        active
          ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)] scale-[1.02]'
          : 'border-zinc-850 bg-zinc-900/20 text-zinc-400 hover:border-zinc-850 hover:bg-zinc-900/50'
      }`}
    >
      <div
        className={`p-2.5 rounded-xl ${active ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}
      >
        {icon}
      </div>
      <span className="text-xs font-bold leading-tight">{title}</span>
    </button>
  );
}
