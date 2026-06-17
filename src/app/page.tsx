'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
  Zap,
  CloudOff,
  Shield,
  Rocket,
  ArrowRight,
  Menu,
  X,
  Users,
  MessageSquare,
  Target,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Layers,
  Check,
  HelpCircle,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles as SparklesIcon,
  Trash2,
} from 'lucide-react';
import JSZip from 'jszip';
import { executeParserWorker } from '@/lib/comic-worker-client';
import { validateComicArchive } from '@/lib/comic-validation';
import { computeFileHash } from '@/lib/hash';
import { detectPanels } from '@/lib/guidedView';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const heroTextVariant = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
};

const navVariant = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

const blobVariant = {
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 5, 0],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const featureCardVariant = {
  initial: { opacity: 0, y: 40, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
};

async function createMockCbzFile(): Promise<File> {
  const zip = new JSZip();
  const pageCount = 3;
  for (let i = 1; i <= pageCount; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 800, 1200);

      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 790, 1190);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(20, 20, 760, 320);
      ctx.fillRect(20, 360, 370, 420);
      ctx.fillRect(410, 360, 370, 420);
      ctx.fillRect(20, 800, 760, 380);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`PAGE ${i}: COMET DECOMPRESSION`, 60, 100);
      ctx.fillStyle = '#71717a';
      ctx.font = '20px sans-serif';
      ctx.fillText('Testing client-side Web Worker parsing speed...', 60, 150);

      ctx.fillStyle = i === 1 ? '#3b82f6' : i === 2 ? '#10b981' : '#f59e0b';
      ctx.fillRect(60, 400, 290, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('High Performance', 85, 560);

      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(450, 400, 290, 300);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Guided View', 475, 560);

      ctx.fillStyle = '#141416';
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 840, 680, 280);
      ctx.fillRect(60, 840, 680, 280);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'italic 20px sans-serif';
      ctx.fillText(`"This mock comic page was compiled in-memory in less than 5ms."`, 100, 950);
      ctx.fillText(`"Decompression runs at ~120 pages/second on this device."`, 100, 1000);
    }
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85);
    });
    zip.file(`page_${i}.jpg`, blob);
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return new File([zipBlob], 'comet-sample-sandbox.cbz', { type: 'application/x-cbz' });
}

const DEMO_PANELS = [
  { id: 0, x: 0, y: 0, scale: 1, label: 'Full Page View' },
  { id: 1, x: 0, y: 110, scale: 1.8, label: 'Panel 1: Opening Shot' },
  { id: 2, x: 70, y: -20, scale: 2.2, label: 'Panel 2: Dramatic Focus' },
  { id: 3, x: -70, y: -20, scale: 2.2, label: 'Panel 3: Side-by-Side Action' },
  { id: 4, x: 0, y: -120, scale: 1.8, label: 'Panel 4: Splash Finish' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isReduced = !!shouldReduceMotion;

  // Sandbox state
  const [sandboxFile, setSandboxFile] = useState<File | null>(null);
  const [sandboxPages, setSandboxPages] = useState<any[]>([]);
  const [sandboxIsParsing, setSandboxIsParsing] = useState(false);
  const [sandboxProgress, setSandboxProgress] = useState<{
    page: number;
    total: number;
    phase: string;
  } | null>(null);
  const [sandboxError, setSandboxError] = useState<string | null>(null);
  const [sandboxMetrics, setSandboxMetrics] = useState<{
    hashingTime: number;
    decompressionTime: number;
    throughput: number;
    fileSize: number;
    format: string;
  } | null>(null);
  const [sandboxCurrentPage, setSandboxCurrentPage] = useState(0);
  const [sandboxShowPanels, setSandboxShowPanels] = useState(false);
  const [sandboxDetectedPanels, setSandboxDetectedPanels] = useState<Record<number, any[]>>({});
  const [sandboxIsDetecting, setSandboxIsDetecting] = useState(false);
  const [sandboxIsDragging, setSandboxIsDragging] = useState(false);

  // Feature Demo states
  const [demoMode, setDemoMode] = useState<'guided' | 'spread'>('guided');
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isDemoAutoplay, setIsDemoAutoplay] = useState(true);
  const [dualSpreadPage, setDualSpreadPage] = useState(1);

  // Auto-playing Guided View simulation
  useEffect(() => {
    if (demoMode !== 'guided' || !isDemoAutoplay) return;
    const interval = setInterval(() => {
      setActivePanelIndex((prev) => (prev + 1) % 5);
    }, 3500);
    return () => clearInterval(interval);
  }, [demoMode, isDemoAutoplay]);

  // Auto-playing Dual Spread simulation
  useEffect(() => {
    if (demoMode !== 'spread' || !isDemoAutoplay) return;
    const interval = setInterval(() => {
      setDualSpreadPage((prev) => (prev % 3) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [demoMode, isDemoAutoplay]);

  // Guided View panel detection for sandbox previewer
  useEffect(() => {
    if (!sandboxShowPanels || sandboxPages.length === 0) return;
    const pageIdx = sandboxCurrentPage;
    if (sandboxDetectedPanels[pageIdx]) return;

    const runDetection = async () => {
      setSandboxIsDetecting(true);
      try {
        const page = sandboxPages[pageIdx];
        const imageBitmap = await createImageBitmap(page.blob);
        const panels = await detectPanels(imageBitmap);
        setSandboxDetectedPanels((prev) => ({ ...prev, [pageIdx]: panels }));
        imageBitmap.close();
      } catch (err) {
        console.error('Panel detection failed:', err);
      } finally {
        setSandboxIsDetecting(false);
      }
    };

    runDetection();
  }, [sandboxShowPanels, sandboxCurrentPage, sandboxPages, sandboxDetectedPanels]);

  const handleSandboxParse = async (file: File) => {
    setSandboxIsParsing(true);
    setSandboxError(null);
    setSandboxMetrics(null);
    setSandboxPages([]);
    setSandboxCurrentPage(0);
    setSandboxDetectedPanels({});
    setSandboxShowPanels(false);
    setSandboxFile(file);

    const startTime = performance.now();
    let hashingTime = 0;
    let decompressionTime = 0;

    try {
      await validateComicArchive(file);

      setSandboxProgress({ phase: 'hashing', page: 0, total: 100 });
      const hashStartTime = performance.now();
      const hash = await computeFileHash(file, (progress) => {
        setSandboxProgress({ phase: 'hashing', page: Math.round(progress * 100), total: 100 });
      });
      hashingTime = performance.now() - hashStartTime;

      setSandboxProgress({ phase: 'parsing', page: 0, total: 100 });
      const decompStartTime = performance.now();
      const parsedPages = await executeParserWorker(file, hash, (page, total) => {
        setSandboxProgress({ phase: 'parsing', page, total });
      });
      decompressionTime = performance.now() - decompStartTime;

      const throughput = parsedPages.length / (decompressionTime / 1000);

      setSandboxPages(parsedPages);
      setSandboxMetrics({
        hashingTime: Math.round(hashingTime),
        decompressionTime: Math.round(decompressionTime),
        throughput: Math.round(throughput),
        fileSize: file.size,
        format: file.name.endsWith('.cbr') ? 'CBR (RAR)' : 'CBZ (ZIP)',
      });
      setSandboxIsParsing(false);
      setSandboxProgress(null);
    } catch (err: any) {
      console.error(err);
      setSandboxError(err.message || 'Failed to parse file.');
      setSandboxIsParsing(false);
      setSandboxProgress(null);
    }
  };

  const handleSandboxDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setSandboxIsDragging(true);
  };

  const handleSandboxDragLeave = () => {
    setSandboxIsDragging(false);
  };

  const handleSandboxDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setSandboxIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleSandboxParse(file);
  };

  const handleSandboxFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleSandboxParse(file);
  };

  const handleTrySample = async () => {
    setSandboxIsParsing(true);
    setSandboxProgress({ phase: 'generating', page: 0, total: 100 });
    try {
      const mockFile = await createMockCbzFile();
      await handleSandboxParse(mockFile);
    } catch (err: any) {
      setSandboxError('Failed to generate mock sample.');
      setSandboxIsParsing(false);
    }
  };

  // Conditional variants for reduced motion
  const animatedFadeIn = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : fadeIn;
  const animatedNav = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : navVariant;
  const animatedHeroText = isReduced
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : heroTextVariant;
  const animatedStagger = isReduced
    ? { animate: { transition: { staggerChildren: 0 } } }
    : staggerContainer;

  return (
    <div className="relative min-h-screen overflow-hidden bg-comet-bg text-comet-text font-comet-text">
      {/* ── Background Elements ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate="animate"
          variants={isReduced ? { animate: { opacity: 0.1 } } : (blobVariant as any)}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate="animate"
          variants={
            isReduced
              ? { animate: { opacity: 0.1 } }
              : ({
                  animate: {
                    scale: [1, 1.15, 1],
                    rotate: [0, -5, 0],
                    transition: { duration: 25, repeat: Infinity, ease: 'easeInOut' },
                  },
                } as any)
          }
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-comet-bg/40" />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <motion.nav
        initial="initial"
        animate="animate"
        variants={animatedNav}
        className="relative z-50 flex items-center justify-between px-6 py-8 md:px-12 lg:px-24"
      >
        <motion.div
          whileHover={isReduced ? {} : { scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-comet-accent shadow-[0_0_20px_rgba(124,106,247,0.4)]">
            <Rocket className="text-white" size={20} aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight">Comet</span>
        </motion.div>

        <div className="flex items-center gap-4 sm:gap-5">
          {status === 'loading' ? (
            <div className="h-8 w-24 bg-comet-surface/30 rounded-lg animate-pulse" />
          ) : !session ? (
            <>
              {/* Desktop: Inline navigation */}
              <div className="hidden sm:flex items-center gap-8">
                <Link
                  href="/pricing"
                  className="group relative text-sm font-semibold text-white hover:text-comet-accent transition-colors"
                >
                  Pricing
                  {!isReduced && (
                    <motion.span
                      className="absolute -bottom-1 left-0 h-0.5 w-0 bg-comet-accent transition-all group-hover:w-full"
                      layoutId="nav-underline-pricing"
                    />
                  )}
                </Link>
                <Link
                  href="/login"
                  className="group relative text-sm font-semibold text-white hover:text-comet-accent transition-colors"
                >
                  Log in
                  {!isReduced && (
                    <motion.span
                      className="absolute -bottom-1 left-0 h-0.5 w-0 bg-comet-accent transition-all group-hover:w-full"
                      layoutId="nav-underline"
                    />
                  )}
                </Link>
                <motion.div
                  whileHover={isReduced ? {} : { scale: 1.05 }}
                  whileTap={isReduced ? {} : { scale: 0.95 }}
                >
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-full bg-comet-accent px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(124,106,247,0.4)] transition-all hover:bg-comet-accent-hover hover:shadow-[0_6px_20px_rgba(124,106,247,0.5)]"
                  >
                    Sign up
                  </Link>
                </motion.div>
              </div>
              {/* Mobile: Hamburger menu */}
              <div className="sm:hidden relative">
                <motion.button
                  whileTap={isReduced ? {} : { scale: 0.9 }}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-comet-surface/50 backdrop-blur-md border border-comet-border text-comet-muted hover:text-white transition-colors"
                  aria-label="Open menu"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.button>

                <AnimatePresence>
                  {mobileMenuOpen && (
                    <motion.div
                      initial={isReduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
                      animate={isReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={isReduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-12 w-48 bg-comet-surface/95 backdrop-blur-xl border border-comet-border rounded-2xl p-4 shadow-xl z-50"
                    >
                      <Link
                        href="/pricing"
                        className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-white hover:bg-comet-accent transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Pricing
                      </Link>
                      <Link
                        href="/login"
                        className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-white hover:bg-comet-accent transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        href="/register"
                        className="block w-full text-left px-4 py-3 mt-2 rounded-xl text-sm font-semibold bg-comet-accent text-white text-center hover:bg-comet-accent-hover transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign up
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <motion.div
              whileHover={isReduced ? {} : { scale: 1.05 }}
              whileTap={isReduced ? {} : { scale: 0.95 }}
            >
              <Link
                href="/library"
                className="group flex items-center gap-2 rounded-full border border-comet-border bg-comet-surface/50 px-4 sm:px-6 py-2.5 text-sm font-medium backdrop-blur-md transition-all hover:bg-comet-accent hover:text-white"
              >
                <span className="hidden sm:inline">Open Library</span>
                <span className="sm:hidden">Library</span>
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center md:px-12 lg:px-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={animatedStagger}
          className="max-w-5xl"
        >
          <motion.div
            variants={
              isReduced
                ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
                : {
                    initial: { opacity: 0, scale: 0.8 },
                    animate: { opacity: 1, scale: 1 },
                  }
            }
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-comet-accent/30 bg-comet-accent/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-comet-accent uppercase"
          >
            <Zap size={14} aria-hidden="true" />
            The Speed of Light Comic Reader
          </motion.div>

          <motion.h1
            variants={animatedHeroText}
            className="mb-8 text-6xl font-black leading-[1.05] tracking-tighter md:text-8xl lg:text-9xl"
          >
            Read <span className="italic">Beyond</span> <br />
            <span className="bg-gradient-to-r from-comet-accent via-blue-400 to-comet-accent bg-clip-text text-transparent">
              Boundaries.
            </span>
          </motion.h1>

          <motion.p
            variants={animatedFadeIn}
            className="mb-12 mx-auto max-w-2xl text-lg text-comet-muted md:text-xl font-medium"
          >
            Zero lag construction. Offline-first architecture. Experience your collection in a
            high-res, immersive environment built for 60fps performance.
          </motion.p>

          <motion.div
            variants={animatedFadeIn}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            {status === 'loading' ? (
              <div className="h-14 w-full sm:w-48 rounded-2xl bg-comet-surface/50 animate-pulse backdrop-blur-md" />
            ) : !session ? (
              <motion.div
                whileHover={isReduced ? {} : { scale: 1.05 }}
                whileTap={isReduced ? {} : { scale: 0.95 }}
              >
                <Link
                  href="/register"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-comet-accent px-10 text-lg font-bold text-white shadow-[0_10px_40px_rgba(124,106,247,0.3)] transition-all hover:bg-comet-accent-hover sm:w-auto"
                >
                  Start Reading
                </Link>
              </motion.div>
            ) : (
              <motion.div
                whileHover={isReduced ? {} : { scale: 1.05 }}
                whileTap={isReduced ? {} : { scale: 0.95 }}
              >
                <Link
                  href="/library"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-comet-accent px-10 text-lg font-bold text-white shadow-[0_10px_40px_rgba(124,106,247,0.3)] transition-all hover:bg-comet-accent-hover sm:w-auto"
                >
                  Enter Library
                </Link>
              </motion.div>
            )}
            <motion.div
              whileHover={isReduced ? {} : { scale: 1.05 }}
              whileTap={isReduced ? {} : { scale: 0.95 }}
            >
              <a
                href="#features"
                className="flex h-14 w-full items-center justify-center rounded-2xl border border-comet-border bg-comet-surface/50 px-10 text-lg font-semibold backdrop-blur-md transition-all hover:bg-comet-surface sm:w-auto"
              >
                Explore Features
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── Features Grid (The Panel Grid) ───────────────────────────── */}
        <section id="features" className="mt-48 w-full max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={animatedStagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <FeatureCard
              icon={<Zap aria-hidden="true" />}
              title="60 FPS Performance"
              description="Decompression and rendering handled by Web Workers to keep the main thread fluid at all times."
              reducedMotion={isReduced}
            />
            <FeatureCard
              icon={<CloudOff aria-hidden="true" />}
              title="Offline First"
              description="Full PWA support means your library is accessible even when you're deep in space or underground."
              reducedMotion={isReduced}
            />
            <FeatureCard
              icon={<Shield aria-hidden="true" />}
              title="Local & Private"
              description="Your comics stay on your device. Metadata enrichment happens client-side. No cloud uploads needed."
              reducedMotion={isReduced}
            />
          </motion.div>
        </section>

        {/* ── Interactive Decompression Sandbox ───────────────────────── */}
        <section className="mt-48 w-full max-w-7xl mx-auto text-left relative z-20">
          <div className="bg-neutral-900/60 backdrop-blur-xl border-2 border-neutral-800/80 rounded-[3rem] p-8 md:p-16 shadow-2xl flex flex-col lg:flex-row gap-12 items-stretch">
            {/* Left Side: Drag & Drop Dropzone */}
            <div className="flex-1 flex flex-col justify-between space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 text-comet-accent font-bold uppercase tracking-widest text-xs mb-4">
                  <Zap size={14} className="text-comet-accent animate-pulse" />
                  Try It Free & Offline
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white leading-none tracking-tighter italic mb-4">
                  Experience Speed of Light Parsing.
                </h2>
                <p className="text-comet-muted text-base max-w-lg leading-relaxed">
                  Decompressing large archives on the main thread leads to lag. Comet delegates
                  parsing to high-performance Web Workers. Drag a file here to test it yourself!
                </p>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleSandboxDragOver}
                onDragLeave={handleSandboxDragLeave}
                onDrop={handleSandboxDrop}
                onClick={() => document.getElementById('sandbox-file-input')?.click()}
                className={`border-2 border-dashed rounded-[2rem] p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center min-h-[220px] ${
                  sandboxIsDragging
                    ? 'border-comet-accent bg-comet-accent/15 scale-[1.02]'
                    : 'border-neutral-800 bg-neutral-950/40 hover:border-comet-accent/50 hover:bg-comet-accent/5'
                }`}
              >
                <input
                  id="sandbox-file-input"
                  type="file"
                  accept=".cbz,.cbr,.zip"
                  onChange={handleSandboxFileInput}
                  className="hidden"
                />

                {sandboxIsParsing ? (
                  <div className="space-y-4 w-full px-4" aria-live="polite">
                    <Loader2 className="w-12 h-12 text-comet-accent animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-white font-bold uppercase text-xs tracking-wider">
                        {sandboxProgress?.phase === 'hashing'
                          ? 'Generating Deduplication Hash...'
                          : sandboxProgress?.phase === 'generating'
                            ? 'Compiling Mock Comic Pages...'
                            : 'Extracting Comic Archive...'}
                      </p>
                      <p className="text-comet-muted text-xs">
                        {sandboxProgress
                          ? `${sandboxProgress.page} / ${sandboxProgress.total}`
                          : ''}
                      </p>
                    </div>
                    {/* Progress bar */}
                    {sandboxProgress && (
                      <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          className="h-full bg-comet-accent rounded-full shadow-[0_0_10px_rgba(124,106,247,0.5)]"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(sandboxProgress.page / sandboxProgress.total) * 100}%`,
                          }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <UploadCloud
                      className={`w-12 h-12 mb-4 transition-colors ${sandboxIsDragging ? 'text-comet-accent' : 'text-neutral-500 group-hover:text-comet-accent'}`}
                    />
                    <p className="font-bold text-white text-sm mb-1">
                      Drag & drop your .cbz or .cbr file
                    </p>
                    <p className="text-xs text-comet-muted mb-4">
                      Supports ZIP, RAR, or CBZ/CBR up to 1GB.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrySample();
                        }}
                        className="bg-neutral-850 hover:bg-neutral-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all uppercase tracking-wider shadow-md active:scale-95"
                      >
                        Try with Sample
                      </button>
                    </div>
                  </>
                )}
              </div>

              {sandboxError && (
                <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                  {sandboxError}
                </p>
              )}
            </div>

            {/* Right Side: Metrics Dashboard and Viewer */}
            <div className="flex-1 bg-neutral-950/60 border border-neutral-800 rounded-[2rem] p-6 md:p-10 flex flex-col justify-between min-h-[400px]">
              {sandboxPages.length > 0 && sandboxMetrics ? (
                <div className="h-full flex flex-col justify-between space-y-6">
                  {/* Performance stats banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-neutral-900/80 p-4 rounded-2xl border border-white/5 text-center">
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">
                        Throughput
                      </span>
                      <span className="text-xl font-black text-comet-accent italic block mt-1">
                        {sandboxMetrics.throughput} p/s
                      </span>
                    </div>
                    <div className="bg-neutral-900/80 p-4 rounded-2xl border border-white/5 text-center">
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">
                        Hashing Time
                      </span>
                      <span className="text-xl font-black text-white block mt-1">
                        {sandboxMetrics.hashingTime}ms
                      </span>
                    </div>
                    <div className="bg-neutral-900/80 p-4 rounded-2xl border border-white/5 text-center">
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">
                        Decompress
                      </span>
                      <span className="text-xl font-black text-white block mt-1">
                        {sandboxMetrics.decompressionTime}ms
                      </span>
                    </div>
                    <div className="bg-neutral-900/80 p-4 rounded-2xl border border-white/5 text-center">
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block">
                        File Size
                      </span>
                      <span className="text-xl font-black text-white block mt-1">
                        {(sandboxMetrics.fileSize / (1024 * 1024)).toFixed(1)}MB
                      </span>
                    </div>
                  </div>

                  {/* Comic Sandbox Viewer */}
                  <div className="flex-1 relative bg-neutral-900 border border-neutral-800/80 rounded-2xl overflow-hidden aspect-[4/3] max-h-[300px] flex items-center justify-center shadow-inner group/viewer">
                    {/* The Page Image */}
                    <img
                      src={URL.createObjectURL(sandboxPages[sandboxCurrentPage].blob)}
                      alt="Sandbox Preview Page"
                      className="max-h-full max-w-full object-contain pointer-events-none select-none"
                    />

                    {/* Guided View Panel Overlays */}
                    {sandboxShowPanels && sandboxDetectedPanels[sandboxCurrentPage] && (
                      <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
                        <div className="relative aspect-auto max-h-full max-w-full w-full h-full">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-h-full max-w-full flex items-center justify-center">
                            <div
                              className="relative w-full h-full"
                              style={{
                                aspectRatio: `${sandboxPages[sandboxCurrentPage].width}/${sandboxPages[sandboxCurrentPage].height}`,
                              }}
                            >
                              {sandboxDetectedPanels[sandboxCurrentPage].map((panel, idx) => {
                                const pageW = sandboxPages[sandboxCurrentPage].width;
                                const pageH = sandboxPages[sandboxCurrentPage].height;
                                return (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="absolute border-2 border-red-500 bg-red-500/10 rounded-sm shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                    style={{
                                      left: `${(panel.x / pageW) * 100}%`,
                                      top: `${(panel.y / pageH) * 100}%`,
                                      width: `${(panel.width / pageW) * 100}%`,
                                      height: `${(panel.height / pageH) * 100}%`,
                                    }}
                                  >
                                    <span className="absolute -top-4 left-0 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-t-sm shadow-md">
                                      {idx + 1}
                                    </span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {sandboxIsDetecting && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 text-comet-accent animate-spin" />
                        <span className="text-white text-xs font-bold uppercase tracking-wider">
                          Analyzing gutters...
                        </span>
                      </div>
                    )}

                    {/* Navigation Overlays */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover/viewer:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setSandboxCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={sandboxCurrentPage === 0}
                        className="p-3 bg-neutral-950/80 hover:bg-neutral-900 border border-white/5 text-white rounded-xl transition-all pointer-events-auto disabled:opacity-30 disabled:pointer-events-none active:scale-90"
                      >
                        <ChevronLeft size={16} />
                        <span className="sr-only">Previous Page</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSandboxCurrentPage((p) => Math.min(sandboxPages.length - 1, p + 1))
                        }
                        disabled={sandboxCurrentPage === sandboxPages.length - 1}
                        className="p-3 bg-neutral-950/80 hover:bg-neutral-900 border border-white/5 text-white rounded-xl transition-all pointer-events-auto disabled:opacity-30 disabled:pointer-events-none active:scale-90"
                      >
                        <ChevronRight size={16} />
                        <span className="sr-only">Next Page</span>
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-neutral-950/80 px-4 py-1.5 rounded-full border border-white/5 text-[10px] font-bold text-neutral-400">
                      Page {sandboxCurrentPage + 1} / {sandboxPages.length}
                    </div>
                  </div>

                  {/* Panel Overlay Toggle Controls */}
                  <div className="flex items-center justify-between border-t border-neutral-900 pt-6">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSandboxShowPanels(!sandboxShowPanels)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                          sandboxShowPanels
                            ? 'bg-comet-accent text-white shadow-lg shadow-comet-accent/20'
                            : 'bg-neutral-900 text-neutral-400 border border-white/5 hover:text-white'
                        }`}
                      >
                        <Layers size={14} />
                        <span>Highlights</span>
                      </button>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider hidden sm:inline">
                        Recursive Gutter Splitting
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSandboxPages([]);
                        setSandboxMetrics(null);
                        setSandboxFile(null);
                      }}
                      className="p-2.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Clear Sandbox"
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">Clear Sandbox</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-neutral-900/60 p-5 rounded-2xl border border-white/5 mb-6 text-comet-muted">
                    <Rocket size={32} className="mx-auto text-neutral-500" />
                  </div>
                  <h4 className="text-white font-bold text-base mb-2">Metrics Console Idle</h4>
                  <p className="text-xs text-comet-muted max-w-xs leading-relaxed">
                    Upload a local comic volume or use the sample file to evaluate hashing, parsing,
                    and rendering statistics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Guided View Showcase ─────────────────────────────────────── */}
        <section className="mt-48 w-full max-w-7xl mx-auto text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={animatedFadeIn}
            >
              <div className="inline-flex items-center gap-2 text-comet-accent font-bold uppercase tracking-widest text-xs mb-6">
                <Target size={16} aria-hidden="true" />
                The Next Dimension
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 italic tracking-tighter">
                Smart Panel <br /> Detection.
              </h2>
              <p className="text-lg text-comet-muted leading-relaxed mb-10 max-w-lg">
                Our proprietary Guided View technology automatically detects comic panels, allowing
                you to dive deep into the action with cinematic transitions that capture every
                detail of the artist&apos;s intent.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-white font-bold">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
                    1
                  </div>
                  Recursive Gutter Splitting
                </div>
                <div className="flex items-center gap-4 text-white font-bold">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/50 flex items-center justify-center text-violet-400">
                    2
                  </div>
                  Cinematic Panel Transitions
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={isReduced ? { opacity: 1 } : { opacity: 0, x: 50 }}
              whileInView={isReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[4/3] bg-neutral-900 rounded-[2.5rem] border-2 border-neutral-800 overflow-hidden shadow-2xl flex flex-col justify-between p-6"
            >
              {/* Demo Selector Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex bg-neutral-950 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode('guided');
                      setActivePanelIndex(0);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      demoMode === 'guided'
                        ? 'bg-comet-accent text-white shadow-md'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    Guided View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode('spread');
                      setDualSpreadPage(1);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      demoMode === 'spread'
                        ? 'bg-comet-accent text-white shadow-md'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    Dual Spread
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDemoAutoplay(!isDemoAutoplay)}
                  className="p-2 bg-neutral-950 hover:bg-neutral-800 border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-all active:scale-95"
                  title={isDemoAutoplay ? 'Pause Autoplay' : 'Play Autoplay'}
                >
                  {isDemoAutoplay ? <Pause size={14} /> : <Play size={14} />}
                  <span className="sr-only">
                    {isDemoAutoplay ? 'Pause Autoplay' : 'Play Autoplay'}
                  </span>
                </button>
              </div>

              {/* Main Demo Viewport */}
              <div className="flex-1 relative w-full overflow-hidden rounded-2xl bg-neutral-950/80 border border-white/5 flex items-center justify-center my-4">
                {demoMode === 'guided' ? (
                  <div className="relative w-[280px] h-[380px] overflow-hidden rounded-xl border border-neutral-800/80 shadow-2xl flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: DEMO_PANELS[activePanelIndex].scale,
                        x: DEMO_PANELS[activePanelIndex].x,
                        y: DEMO_PANELS[activePanelIndex].y,
                      }}
                      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                      className="absolute w-[240px] h-[340px] bg-[#0c0c0e] border border-neutral-800/60 rounded-lg p-2 origin-center"
                    >
                      {/* Panel Grid inside mockup page */}
                      <div className="relative w-full h-full">
                        {/* Panel 1 */}
                        <div
                          className={`absolute top-[2%] left-[2%] w-[96%] h-[26%] border-2 rounded transition-all duration-300 ${activePanelIndex === 1 ? 'border-comet-accent bg-comet-accent/10 shadow-[0_0_15px_rgba(124,106,247,0.4)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                        >
                          <span className="absolute bottom-1 left-2 text-[8px] font-bold text-neutral-500">
                            Panel 1
                          </span>
                        </div>
                        {/* Panel 2 */}
                        <div
                          className={`absolute top-[32%] left-[2%] w-[46%] h-[32%] border-2 rounded transition-all duration-300 ${activePanelIndex === 2 ? 'border-comet-accent bg-comet-accent/10 shadow-[0_0_15px_rgba(124,106,247,0.4)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                        >
                          <span className="absolute bottom-1 left-2 text-[8px] font-bold text-neutral-500">
                            Panel 2
                          </span>
                        </div>
                        {/* Panel 3 */}
                        <div
                          className={`absolute top-[32%] left-[52%] w-[46%] h-[32%] border-2 rounded transition-all duration-300 ${activePanelIndex === 3 ? 'border-comet-accent bg-comet-accent/10 shadow-[0_0_15px_rgba(124,106,247,0.4)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                        >
                          <span className="absolute bottom-1 left-2 text-[8px] font-bold text-neutral-500">
                            Panel 3
                          </span>
                        </div>
                        {/* Panel 4 */}
                        <div
                          className={`absolute top-[68%] left-[2%] w-[96%] h-[30%] border-2 rounded transition-all duration-300 ${activePanelIndex === 4 ? 'border-comet-accent bg-comet-accent/10 shadow-[0_0_15px_rgba(124,106,247,0.4)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                        >
                          <span className="absolute bottom-1 left-2 text-[8px] font-bold text-neutral-500">
                            Panel 4
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="flex gap-4 items-center justify-center h-full w-full p-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={dualSpreadPage}
                        initial={{ rotateY: 45, opacity: 0, scale: 0.95 }}
                        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                        exit={{ rotateY: -45, opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="flex gap-3 w-full max-w-[420px] aspect-[1.3] perspective-1000 origin-center"
                      >
                        {/* Left Page */}
                        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-2xl relative">
                          <span className="text-[9px] font-black text-neutral-600">
                            PAGE {dualSpreadPage * 2}
                          </span>
                          <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <BookOpen size={32} className="text-comet-accent mb-2" />
                            <h4 className="font-bold text-xs text-white truncate max-w-full">
                              Comet Dual View
                            </h4>
                            <p className="text-[10px] text-comet-muted mt-1 hidden sm:block">
                              Side-by-side reading
                            </p>
                          </div>
                          <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-800/80 shadow-2xl" />
                        </div>

                        {/* Right Page */}
                        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-2xl">
                          <span className="text-[9px] font-black text-neutral-600">
                            PAGE {dualSpreadPage * 2 + 1}
                          </span>
                          <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <SparklesIcon size={32} className="text-blue-500 mb-2" />
                            <h4 className="font-bold text-xs text-white truncate max-w-full">
                              Zero Shifts
                            </h4>
                            <p className="text-[10px] text-comet-muted mt-1 hidden sm:block">
                              Pre-cached assets
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Demo Status Info Footer */}
              <div className="flex items-center justify-between z-10 border-t border-white/5 pt-4">
                {demoMode === 'guided' ? (
                  <>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      {DEMO_PANELS[activePanelIndex].label}
                    </span>
                    <div className="flex gap-1.5">
                      {DEMO_PANELS.map((p, idx) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setActivePanelIndex(idx);
                            setIsDemoAutoplay(false);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            activePanelIndex === idx
                              ? 'bg-comet-accent w-4'
                              : 'bg-neutral-800 hover:bg-neutral-600'
                          }`}
                        >
                          <span className="sr-only">Go to Panel {idx + 1}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Spread {dualSpreadPage}
                    </span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => {
                            setDualSpreadPage(page);
                            setIsDemoAutoplay(false);
                          }}
                          className={`w-2 h-2 rounded-full transition-all ${
                            dualSpreadPage === page
                              ? 'bg-comet-accent w-4'
                              : 'bg-neutral-800 hover:bg-neutral-600'
                          }`}
                        >
                          <span className="sr-only">Go to Spread {page}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Social / Community Section ───────────────────────────────── */}
        <section className="mt-48 w-full max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={animatedFadeIn}
            className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-12 md:p-24 text-white text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-center -space-x-4 mb-10">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-full border-4 border-indigo-600 bg-white overflow-hidden shadow-xl"
                  >
                    <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" />
                  </div>
                ))}
                <div className="w-16 h-16 rounded-full border-4 border-indigo-600 bg-black flex items-center justify-center font-bold text-xs shadow-xl">
                  +1k
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 italic tracking-tighter">
                Read Together.
              </h2>
              <p className="text-xl text-indigo-100 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
                Join a global community of readers. Share your progress, invite friends to your
                circle, and discover new stories through our live community feed.
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                  <Users size={20} aria-hidden="true" />
                  <span className="font-bold">Friends List</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                  <MessageSquare size={20} aria-hidden="true" />
                  <span className="font-bold">Community Feed</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="mt-48 pb-32">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={animatedFadeIn}
            className="text-center"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-12 italic tracking-tighter">
              Your Library. <br />
              <span className="text-comet-accent">Redefined.</span>
            </h2>
            <motion.div
              whileHover={isReduced ? {} : { scale: 1.05 }}
              whileTap={isReduced ? {} : { scale: 0.95 }}
            >
              <Link
                href="/register"
                className="inline-flex h-16 items-center justify-center gap-3 rounded-2xl bg-white text-black px-12 text-xl font-black uppercase tracking-widest shadow-2xl transition-all hover:bg-neutral-100"
              >
                Join the Orbit
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-comet-border bg-comet-surface/20 py-12 text-center text-sm text-comet-muted">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-comet-accent/20 border border-comet-accent/30">
              <Rocket className="text-comet-accent" size={16} aria-hidden="true" />
            </div>
            <span className="text-lg font-bold text-white">Comet</span>
          </div>
          <p>&copy; 2026 Comet — The Speed of Light Comic Reader.</p>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  reducedMotion,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  reducedMotion?: boolean;
}) {
  return (
    <motion.div
      variants={
        reducedMotion ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : featureCardVariant
      }
      whileHover={
        reducedMotion
          ? {}
          : {
              y: -10,
              borderColor: 'rgba(124, 106, 247, 0.5)',
              backgroundColor: 'rgba(20, 20, 30, 0.4)',
            }
      }
      className="group relative flex flex-col items-start rounded-[2.5rem] border-2 border-neutral-900 bg-neutral-900/40 p-10 text-left backdrop-blur-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-comet-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <motion.div
        whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-comet-accent/10 text-comet-accent border border-comet-accent/20"
      >
        {icon}
      </motion.div>

      <h3 className="mb-4 text-2xl font-black italic tracking-tight group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="text-comet-muted font-medium leading-relaxed group-hover:text-comet-text/80 transition-colors">
        {description}
      </p>

      {!reducedMotion && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute top-10 right-10 text-comet-accent opacity-0 group-hover:opacity-100 transition-all"
        >
          <ArrowRight size={20} />
        </motion.div>
      )}
    </motion.div>
  );
}
