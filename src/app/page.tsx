'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';
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
  Layers,
  Check,
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
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
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
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
};

const navVariant = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const blobVariant = {
  animate: {
    scale: [1, 1.12, 1],
    rotate: [0, 8, 0],
    transition: {
      duration: 18,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const featureCardVariant = {
  initial: { opacity: 0, y: 30, scale: 0.97 },
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

      ctx.fillStyle = i === 1 ? '#ff5a00' : i === 2 ? '#a3e635' : '#eab308';
      ctx.fillRect(60, 400, 290, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('High Performance', 85, 560);

      ctx.fillStyle = '#e65100';
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

const TICKER_ITEMS = [
  { user: '@stan_lee', activity: 'decompressed 380MB volume in 1.1s! ⚡', tag: 'SPEED' },
  { user: '@cosmic_reader', activity: 'offline reading works in subways 🚆', tag: 'OFFLINE' },
  {
    user: '@gwen_stacy',
    activity: 'panel-zoom transitions are incredibly smooth',
    tag: 'GUIDED_VIEW',
  },
  { user: '@peter_parker', activity: 'no server uploads = complete privacy 🕷️', tag: 'SECURITY' },
  { user: '@manga_fan', activity: 'RTL mode works perfectly for manga!', tag: 'MANGA' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isReduced = !!shouldReduceMotion;

  // Scroll tracking for premium floating navbar
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parallax cursor tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isReduced) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { left, top, width, height } = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      setMousePos({ x, y });
    };
    const currentHero = heroRef.current;
    if (currentHero) {
      currentHero.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (currentHero) {
        currentHero.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [isReduced]);

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
        logger.error('Panel detection failed', {}, err as Error);
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
      logger.error('Sandbox parse failed', {}, err instanceof Error ? err : undefined);
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
    <div className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#e8e8f0] font-sans bg-halftone">
      {/* ── Background Gradients (Warm Sunset Nebula - No Blues/Purples) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate="animate"
          variants={isReduced ? { animate: { opacity: 0.05 } } : (blobVariant as any)}
          className="absolute top-[-5%] left-[-5%] w-[55%] h-[55%] bg-lime-500/8 rounded-full blur-[140px]"
        />
        <motion.div
          animate="animate"
          variants={
            isReduced
              ? { animate: { opacity: 0.05 } }
              : ({
                  animate: {
                    scale: [1, 1.15, 1],
                    rotate: [0, -8, 0],
                    transition: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
                  },
                } as any)
          }
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#ff5a00]/8 rounded-full blur-[140px]"
        />
        <motion.div
          animate="animate"
          variants={
            isReduced
              ? { animate: { opacity: 0.03 } }
              : ({
                  animate: {
                    scale: [1.1, 0.9, 1.1],
                    x: [0, 20, 0],
                    transition: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
                  },
                } as any)
          }
          className="absolute top-[30%] right-[10%] w-[45%] h-[45%] bg-[#eab308]/5 rounded-full blur-[120px]"
        />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <motion.nav
        initial="initial"
        animate="animate"
        variants={animatedNav}
        className={`sticky top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-7xl flex items-center justify-between px-6 py-4 rounded-[1.5rem] border transition-all duration-300 ${
          scrolled
            ? 'bg-zinc-950/70 backdrop-blur-2xl border-[#ff5a00]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_15px_rgba(255,90,0,0.05)]'
            : 'bg-zinc-950/30 backdrop-blur-xl border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4)]'
        }`}
      >
        <motion.div
          whileHover={isReduced ? {} : { scale: 1.03 }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff5a00] border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#000] transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-hover:shadow-[4px_4px_0px_0px_#000]">
            <Rocket className="text-white" size={18} aria-hidden="true" />
          </div>
          <span className="text-xl font-heading font-black tracking-tight text-white uppercase italic">
            Comet
          </span>
        </motion.div>

        <div className="flex items-center gap-4 sm:gap-6">
          {status === 'loading' ? (
            <div className="h-8 w-24 bg-neutral-900/50 rounded-lg animate-pulse" />
          ) : !session ? (
            <>
              {/* Desktop links */}
              <div className="hidden sm:flex items-center gap-4">
                <motion.div
                  whileHover={isReduced ? {} : { scale: 1.05 }}
                  whileTap={isReduced ? {} : { scale: 0.95 }}
                >
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-850 hover:border-[#ff5a00] hover:text-white bg-neutral-950/40 px-5 py-2.5 text-xs font-heading font-black uppercase tracking-wider text-neutral-300 transition-all focus-visible:outline-2 focus-visible:outline-[#ff5a00] cursor-pointer"
                  >
                    Pricing
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={isReduced ? {} : { scale: 1.05 }}
                  whileTap={isReduced ? {} : { scale: 0.95 }}
                >
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-850 hover:border-[#ff5a00] hover:text-white bg-neutral-950/40 px-5 py-2.5 text-xs font-heading font-black uppercase tracking-wider text-neutral-300 transition-all focus-visible:outline-2 focus-visible:outline-[#ff5a00] cursor-pointer"
                  >
                    Log in
                  </Link>
                </motion.div>
                <motion.div
                  whileHover={isReduced ? {} : { scale: 1.05 }}
                  whileTap={isReduced ? {} : { scale: 0.95 }}
                >
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-[#ff5a00] hover:bg-[#e65100] border-2 border-neutral-950 px-5 py-2.5 text-xs font-heading font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
                  >
                    Sign up
                  </Link>
                </motion.div>
              </div>

              {/* Mobile menu trigger */}
              <div className="sm:hidden relative">
                <motion.button
                  whileTap={isReduced ? {} : { scale: 0.95 }}
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-900 border-2 border-neutral-800 text-neutral-400 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[#ff5a00]"
                  aria-label="Open menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                </motion.button>

                <AnimatePresence>
                  {mobileMenuOpen && (
                    <motion.div
                      initial={isReduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
                      animate={isReduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      exit={isReduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-12 w-48 bg-neutral-950/95 border-2 border-neutral-800 rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-2"
                    >
                      <Link
                        href="/pricing"
                        className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-[#ff5a00]/30 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Pricing
                      </Link>
                      <Link
                        href="/login"
                        className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-[#ff5a00]/30 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        href="/register"
                        className="block w-full text-center px-4 py-2.5 mt-1 rounded-xl text-xs font-heading font-black uppercase tracking-wider bg-[#ff5a00] text-white hover:bg-[#e65100] border border-black shadow-[2px_2px_0px_0px_#000] transition-colors"
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
              whileHover={isReduced ? {} : { scale: 1.03 }}
              whileTap={isReduced ? {} : { scale: 0.97 }}
            >
              <Link
                href="/library"
                className="group flex items-center gap-2 rounded-xl border-2 border-neutral-900 bg-neutral-900/60 hover:bg-neutral-900 px-5 py-2.5 text-xs font-heading font-bold uppercase tracking-wider text-white shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#000]"
              >
                <span>Open Library</span>
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 md:px-12 lg:px-24">
        <div
          className="flex flex-col lg:flex-row items-center justify-between gap-16"
          ref={heroRef}
        >
          {/* Left Column: Core Value Copy */}
          <div className="flex-1 text-left max-w-2xl">
            <motion.div
              initial="initial"
              animate="animate"
              variants={animatedStagger}
              className="space-y-6"
            >
              <motion.div
                variants={
                  isReduced
                    ? {}
                    : { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } }
                }
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex items-center gap-2 rounded-lg border border-[#a3e635]/20 bg-[#a3e635]/5 px-3 py-1 text-[10px] font-display font-black tracking-widest text-[#a3e635] uppercase"
              >
                <Zap size={10} aria-hidden="true" className="animate-pulse" />
                COMET 2.0
              </motion.div>

              <motion.h1
                variants={animatedHeroText}
                className="text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tighter uppercase leading-[0.95]"
              >
                READ BEYOND <br />
                THE{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5a00] via-[#eab308] to-[#a3e635] italic">
                  GUTTERS
                </span>
                .
              </motion.h1>

              <motion.p
                variants={animatedFadeIn}
                className="text-neutral-400 text-base md:text-lg font-medium leading-relaxed max-w-xl"
              >
                No server uploads. Instant client-side parsing. Experience your high-res comic book
                collection offline at 60fps.
              </motion.p>

              <motion.div
                variants={animatedFadeIn}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
              >
                {status === 'loading' ? (
                  <div className="h-14 w-full sm:w-44 bg-neutral-900/50 rounded-2xl animate-pulse" />
                ) : !session ? (
                  <motion.div
                    whileHover={isReduced ? {} : { scale: 1.02 }}
                    whileTap={isReduced ? {} : { scale: 0.98 }}
                  >
                    <Link
                      href="/register"
                      className="flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-[#ff5a00] hover:bg-[#e65100] px-8 text-sm font-heading font-black uppercase tracking-wider text-white border-2 border-neutral-950 shadow-[4px_4px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      Start Reading
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={isReduced ? {} : { scale: 1.02 }}
                    whileTap={isReduced ? {} : { scale: 0.98 }}
                  >
                    <Link
                      href="/library"
                      className="flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-[#ff5a00] hover:bg-[#e65100] px-8 text-sm font-heading font-black uppercase tracking-wider text-white border-2 border-neutral-950 shadow-[4px_4px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      Enter Library
                    </Link>
                  </motion.div>
                )}
                <motion.div
                  whileHover={isReduced ? {} : { scale: 1.02 }}
                  whileTap={isReduced ? {} : { scale: 0.98 }}
                >
                  <a
                    href="#features"
                    className="flex h-14 w-full sm:w-auto items-center justify-center rounded-xl border-2 border-neutral-850 bg-neutral-950/40 hover:bg-neutral-900/60 px-8 text-sm font-heading font-black uppercase tracking-wider text-neutral-300 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.02)]"
                  >
                    Explore Features
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column: Floating Asymmetric Comic Panels (Desktop Parallax) */}
          <div className="flex-1 relative w-full aspect-[4/3] max-w-lg hidden lg:block select-none">
            {/* Background comic cells Grid */}
            <div className="absolute inset-0 border-2 border-neutral-850 bg-neutral-950/20 rounded-[2.5rem] overflow-hidden">
              <div className="absolute inset-0 bg-halftone opacity-40" />
            </div>

            {/* Panel A (Comic Library Cover Mockup) */}
            <motion.div
              style={{
                x: isReduced ? 0 : mousePos.x * 25,
                y: isReduced ? 0 : mousePos.y * 25,
              }}
              className="absolute top-8 left-8 w-48 aspect-[3/4] rounded-[2rem] bg-neutral-950 border-3 border-neutral-855 p-4 shadow-2xl flex flex-col justify-between hover:border-[#ff5a00] transition-colors rotate-[-6deg] z-20 animate-float-slow"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-display font-black text-[#ff5a00] tracking-widest bg-[#ff5a00]/10 px-2 py-0.5 rounded uppercase">
                  Sci-Fi
                </span>
                <span className="text-[8px] font-mono text-neutral-500">Vol. 12</span>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center text-center my-2 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl border border-white/5 relative overflow-hidden">
                <SparklesIcon size={24} className="text-[#ff5a00] animate-pulse" />
                <div className="absolute bottom-2 inset-x-2 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="bg-[#ff5a00] h-full w-[80%]" />
                </div>
              </div>
              <div>
                <h4 className="font-heading font-black italic text-sm text-white truncate">
                  STAR ROVER
                </h4>
                <p className="text-[9px] text-neutral-500 font-medium mt-0.5">By Kepler Studios</p>
              </div>
            </motion.div>

            {/* Panel B (60fps Speeder Meter HUD) */}
            <motion.div
              style={{
                x: isReduced ? 0 : mousePos.x * -35,
                y: isReduced ? 0 : mousePos.y * -35,
              }}
              className="absolute bottom-12 left-16 bg-neutral-950 border-3 border-neutral-855 p-4 rounded-2xl shadow-xl w-44 flex items-center gap-3 hover:border-[#a3e635] transition-colors rotate-[4deg] z-30 animate-float-medium"
            >
              <div className="h-10 w-10 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/20 flex items-center justify-center text-[#a3e635]">
                <Zap size={16} className="animate-bounce" />
              </div>
              <div>
                <div className="font-display font-black text-xl text-[#a3e635] leading-none">
                  60 FPS
                </div>
                <div className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider mt-1">
                  Worker Parsing
                </div>
              </div>
            </motion.div>

            {/* Panel C (Comic Reader Panel Outline) */}
            <motion.div
              style={{
                x: isReduced ? 0 : mousePos.x * 15,
                y: isReduced ? 0 : mousePos.y * 15,
              }}
              className="absolute top-20 right-6 w-48 aspect-[3/4] rounded-[2rem] bg-neutral-950 border-3 border-neutral-855 p-4 shadow-2xl flex flex-col justify-between hover:border-[#eab308] transition-colors rotate-[8deg] z-10 animate-float-fast"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-display font-black text-[#eab308] tracking-widest bg-[#eab308]/10 px-2 py-0.5 rounded uppercase">
                  Manga
                </span>
                <span className="text-[8px] font-mono text-neutral-500">RTL</span>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center text-center my-2 border border-dashed border-neutral-800 rounded-xl relative">
                <Layers size={20} className="text-neutral-600 mb-1" />
                <span className="text-[8px] font-mono text-neutral-500 uppercase">
                  Dual Spreads
                </span>
              </div>
              <div>
                <h4 className="font-heading font-black italic text-sm text-white truncate">
                  OUTLAW CITY
                </h4>
                <p className="text-[9px] text-neutral-500 font-medium mt-0.5">Page 23 / 210</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Features Grid (The Asymmetric Comic Grid) ────────────────── */}
        <section id="features" className="mt-48 w-full max-w-7xl mx-auto text-left">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            className="text-left mb-16 max-w-xl"
          >
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#eab308]/20 bg-[#eab308]/5 px-3 py-1 text-[10px] font-display font-black tracking-widest text-[#eab308] uppercase mb-4">
              <BookOpen size={10} aria-hidden="true" />
              ENGINE ARCHITECTURE
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter uppercase italic leading-none">
              DESIGNED TO <br />
              BE FLUID.
            </h2>
            <p className="text-neutral-400 font-medium text-sm mt-4 leading-relaxed">
              We audited the typical bottlenecks in digital readers to construct a rendering client
              that isolates resources and protects responsiveness.
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={animatedStagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Panel 1: md:col-span-2 */}
            <FeatureCard
              icon={<Zap aria-hidden="true" size={20} />}
              title="60 FPS PERFORMANCE"
              description="Decompression and render paths run on dedicated background threads. The main viewport thread stays fluid for scrolling and gestures."
              colSpan="md:col-span-2"
              reducedMotion={isReduced}
              visual={
                <div className="mt-6 bg-[#09090b]/80 border-2 border-neutral-900 p-4 rounded-xl font-mono text-xs text-neutral-400 space-y-2 select-none">
                  <div className="flex justify-between text-[#a3e635] border-b border-neutral-850 pb-1">
                    <span>worker.ts</span>
                    <span>Status: RUNNING</span>
                  </div>
                  <div>$ parse_archive -f star_rover_12.cbz</div>
                  <div className="text-white font-bold">
                    $ Decompress completed in 294ms (130 p/s)
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#a3e635] h-full w-full rounded-full" />
                  </div>
                </div>
              }
            />
            {/* Panel 2: md:col-span-1 */}
            <FeatureCard
              icon={<CloudOff aria-hidden="true" size={20} />}
              title="READ OFFLINE"
              description="Full PWA packaging caches your layouts, logic, and comic archives locally. Start and read volumes completely offline."
              colSpan="md:col-span-1"
              reducedMotion={isReduced}
              visual={
                <div className="mt-6 flex flex-col items-center justify-center p-4 bg-[#09090b]/80 border-2 border-neutral-900 rounded-xl select-none">
                  <CloudOff size={28} className="text-[#ff5a00] mb-2 animate-pulse" />
                  <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest">
                    Network disconnected
                  </span>
                </div>
              }
            />
            {/* Panel 3: md:col-span-3 */}
            <FeatureCard
              icon={<Shield aria-hidden="true" size={20} />}
              title="ZERO SERVER UPLOADS"
              description="Your collection stays private. Encryption keys and file signatures are calculated locally. ComicVine metadata is enriched client-side."
              colSpan="md:col-span-3"
              reducedMotion={isReduced}
              visual={
                <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-6 p-4 bg-[#09090b]/80 border-2 border-neutral-900 rounded-xl select-none">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/30 text-green-400">
                      <Check size={16} />
                    </div>
                    <div>
                      <div className="font-heading font-black text-xs text-white uppercase tracking-wider">
                        SHA-256 Signature
                      </div>
                      <div className="font-mono text-[9px] text-neutral-500 truncate max-w-xs md:max-w-md">
                        d7a8f89c3079b7a1f8e9a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-display font-black bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1 rounded uppercase tracking-wider">
                    Protected
                  </span>
                </div>
              }
            />
          </motion.div>
        </section>

        {/* ── Interactive Decompression Sandbox ───────────────────────── */}
        <section className="mt-48 w-full max-w-7xl mx-auto text-left relative z-20">
          <div className="bg-neutral-950/40 backdrop-blur-xl border-3 border-neutral-850 rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col lg:flex-row gap-12 items-stretch">
            {/* Left Side: Drag & Drop Dropzone */}
            <div className="flex-1 flex flex-col justify-between space-y-8">
              <div>
                <div className="inline-flex items-center gap-2 text-[#a3e635] font-display font-black uppercase tracking-widest text-xs mb-4">
                  <Zap size={12} className="text-[#a3e635] animate-pulse" />
                  TRY OFFLINE PARSING
                </div>
                <h2 className="text-3xl md:text-5xl font-heading font-black text-white leading-none tracking-tighter italic uppercase mb-4">
                  TEST SPEED IN REAL-TIME.
                </h2>
                <p className="text-neutral-400 text-sm max-w-lg leading-relaxed font-medium">
                  Delegating compression routes to Web Workers prevents main-thread lag. Drag a
                  local `.cbz` or `.cbr` file here to verify decompression throughput on your
                  device.
                </p>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleSandboxDragOver}
                onDragLeave={handleSandboxDragLeave}
                onDrop={handleSandboxDrop}
                onClick={() => document.getElementById('sandbox-file-input')?.click()}
                className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center min-h-[220px] ${
                  sandboxIsDragging
                    ? 'border-[#ff5a00] bg-[#ff5a00]/10 scale-[1.01] shadow-[4px_4px_0px_0px_rgba(255,90,0,0.15)]'
                    : 'border-neutral-855 bg-[#09090b]/40 hover:border-[#ff5a00]/50 hover:bg-[#ff5a00]/5'
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
                    <Loader2 className="w-10 h-10 text-[#ff5a00] animate-spin mx-auto" />
                    <div className="space-y-1">
                      <p className="text-white font-heading font-black uppercase text-xs tracking-wider">
                        {sandboxProgress?.phase === 'hashing'
                          ? 'Generating Signature...'
                          : sandboxProgress?.phase === 'generating'
                            ? 'Compiling Sample...'
                            : 'Decompressing Archive...'}
                      </p>
                      <p className="text-neutral-500 font-mono text-[10px]">
                        {sandboxProgress
                          ? `${sandboxProgress.page} / ${sandboxProgress.total} Pages`
                          : ''}
                      </p>
                    </div>
                    {/* Progress bar */}
                    {sandboxProgress && (
                      <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          className="h-full bg-[#ff5a00] rounded-full shadow-[0_0_10px_rgba(255,90,0,0.4)]"
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
                      className={`w-10 h-10 mb-4 transition-colors ${sandboxIsDragging ? 'text-[#ff5a00]' : 'text-neutral-500 group-hover:text-[#ff5a00]'}`}
                    />
                    <p className="font-heading font-black text-white text-xs uppercase tracking-wider mb-1">
                      Drag & drop your archive
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono mb-4">
                      ZIP, RAR, CBZ, or CBR up to 1GB
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrySample();
                        }}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white border-2 border-neutral-950 font-heading font-black text-[10px] px-5 py-2.5 rounded-lg transition-all uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[1px_1px_0px_0px_#000]"
                      >
                        Try with Sample
                      </button>
                    </div>
                  </>
                )}
              </div>

              {sandboxError && (
                <p className="text-xs font-mono text-red-400 bg-red-955/20 border border-red-500/20 px-4 py-3 rounded-xl">
                  Error: {sandboxError}
                </p>
              )}
            </div>

            {/* Right Side: Metrics Dashboard and Viewer */}
            <div className="flex-1 bg-neutral-955 border-2 border-neutral-850 rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
              {sandboxPages.length > 0 && sandboxMetrics ? (
                <div className="h-full flex flex-col justify-between space-y-6">
                  {/* Performance stats console */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#09090b] p-3 rounded-xl border border-neutral-850 text-center">
                      <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest block">
                        Throughput
                      </span>
                      <span className="text-xl font-heading font-black text-[#a3e635] italic block mt-1">
                        {sandboxMetrics.throughput} p/s
                      </span>
                    </div>
                    <div className="bg-[#09090b] p-3 rounded-xl border border-neutral-855 text-center">
                      <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest block">
                        Decompress Time
                      </span>
                      <span className="text-xl font-heading font-black text-white block mt-1 font-mono">
                        {sandboxMetrics.decompressionTime}ms
                      </span>
                    </div>
                    <div className="bg-[#09090b] p-3 rounded-xl border border-neutral-855 text-center col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest block">
                        Deduplication Hash
                      </span>
                      <span className="text-sm font-heading font-black text-white block mt-1 font-mono">
                        {sandboxMetrics.hashingTime}ms
                      </span>
                    </div>
                    <div className="bg-[#09090b] p-3 rounded-xl border border-neutral-855 text-center col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest block">
                        File Size
                      </span>
                      <span className="text-sm font-heading font-black text-white block mt-1 font-mono">
                        {(sandboxMetrics.fileSize / (1024 * 1024)).toFixed(1)}MB
                      </span>
                    </div>
                  </div>

                  {/* Comic Sandbox Viewer */}
                  <div className="flex-1 relative bg-[#09090b] border-2 border-neutral-855 rounded-xl overflow-hidden aspect-[4/3] max-h-[300px] flex items-center justify-center shadow-inner group/viewer">
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
                                    className="absolute border-2 border-[#ef4444] bg-[#ef4444]/10 rounded shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                    style={{
                                      left: `${(panel.x / pageW) * 100}%`,
                                      top: `${(panel.y / pageH) * 100}%`,
                                      width: `${(panel.width / pageW) * 100}%`,
                                      height: `${(panel.height / pageH) * 100}%`,
                                    }}
                                  >
                                    <span className="absolute -top-4 left-0 bg-[#ef4444] text-white text-[8px] font-heading font-black px-1.5 py-0.5 rounded-t shadow-md">
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
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 text-[#ff5a00] animate-spin" />
                        <span className="text-white text-xs font-heading font-black uppercase tracking-wider">
                          Analyzing margins...
                        </span>
                      </div>
                    )}

                    {/* Navigation Overlays */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover/viewer:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setSandboxCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={sandboxCurrentPage === 0}
                        className="p-3 bg-neutral-950/95 hover:bg-[#18181b] border-2 border-neutral-855 text-white rounded-xl transition-all pointer-events-auto disabled:opacity-30 disabled:pointer-events-none active:scale-90"
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
                        className="p-3 bg-neutral-950/95 hover:bg-[#18181b] border-2 border-neutral-855 text-white rounded-xl transition-all pointer-events-auto disabled:opacity-30 disabled:pointer-events-none active:scale-90"
                      >
                        <ChevronRight size={16} />
                        <span className="sr-only">Next Page</span>
                      </button>
                    </div>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-neutral-950/90 px-4 py-1.5 rounded-full border border-neutral-855 text-[10px] font-mono font-bold text-neutral-400">
                      Page {sandboxCurrentPage + 1} / {sandboxPages.length}
                    </div>
                  </div>

                  {/* Panel Overlay Toggle Controls */}
                  <div className="flex items-center justify-between border-t border-neutral-900 pt-6">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSandboxShowPanels(!sandboxShowPanels)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-heading font-black uppercase tracking-widest transition-all ${
                          sandboxShowPanels
                            ? 'bg-[#ff5a00] text-white border-2 border-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]'
                            : 'bg-neutral-900 text-neutral-400 border-2 border-neutral-855 hover:text-white'
                        }`}
                      >
                        <Layers size={12} />
                        <span>Detect Panels</span>
                      </button>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider hidden sm:inline">
                        Client-side segmentation
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
                  <div className="bg-neutral-900 border-2 border-neutral-855 p-4 rounded-2xl mb-6 text-neutral-500 select-none">
                    <Rocket size={24} className="mx-auto" />
                  </div>
                  <h4 className="text-white font-heading font-black text-sm uppercase tracking-wider mb-2">
                    Metrics Console Idle
                  </h4>
                  <p className="text-xs text-neutral-400 max-w-xs leading-relaxed font-medium">
                    Upload a local volume or run the mock generator to view hashing, parsing, and
                    rendering throughput statistics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Guided View Showcase ─────────────────────────────────────── */}
        <section className="mt-48 w-full max-w-7xl mx-auto text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={animatedFadeIn}
            >
              <div className="inline-flex items-center gap-2 text-[#eab308] font-display font-black uppercase tracking-widest text-xs mb-6">
                <Target size={14} aria-hidden="true" />
                CINEMATIC PANNING
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-black mb-8 italic tracking-tighter uppercase leading-none">
                SMART PANEL <br />
                SEGMENTATION.
              </h2>
              <p className="text-sm md:text-base text-neutral-400 font-medium leading-relaxed mb-10 max-w-lg">
                Guided View analyzes page margins to locate panel coordinates client-side. The
                reader centers and zooms each cell for a focused reading flow.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-white font-heading font-black text-xs uppercase tracking-wider">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center text-orange-450 font-mono">
                    1
                  </div>
                  Adaptive margin analysis
                </div>
                <div className="flex items-center gap-4 text-white font-heading font-black text-xs uppercase tracking-wider">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center text-yellow-450 font-mono">
                    2
                  </div>
                  Sub-pixel spring transitions
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={isReduced ? { opacity: 1 } : { opacity: 0, x: 40 }}
              whileInView={isReduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[4/3] bg-neutral-950 rounded-[2.5rem] border-3 border-neutral-855 overflow-hidden shadow-2xl flex flex-col justify-between p-6"
            >
              {/* Demo selector header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex bg-[#09090b] p-1 rounded-xl border border-neutral-850">
                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode('guided');
                      setActivePanelIndex(0);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all ${
                      demoMode === 'guided'
                        ? 'bg-[#ff5a00] text-white shadow-md'
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
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all ${
                      demoMode === 'spread'
                        ? 'bg-[#ff5a00] text-white shadow-md'
                        : 'text-neutral-500 hover:text-white'
                    }`}
                  >
                    Dual Spread
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDemoAutoplay(!isDemoAutoplay)}
                  className="p-2 bg-neutral-900 hover:bg-neutral-855 border border-neutral-855 rounded-xl text-neutral-400 hover:text-white transition-all active:scale-95"
                  title={isDemoAutoplay ? 'Pause Autoplay' : 'Play Autoplay'}
                >
                  {isDemoAutoplay ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>

              {/* Main Demo Viewport */}
              <div className="flex-1 relative w-full overflow-hidden rounded-xl bg-[#09090b] border border-neutral-855 flex items-center justify-center my-4">
                {demoMode === 'guided' ? (
                  <div className="relative w-[280px] h-[380px] overflow-hidden rounded-xl border border-neutral-855 shadow-2xl flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: DEMO_PANELS[activePanelIndex].scale,
                        x: DEMO_PANELS[activePanelIndex].x,
                        y: DEMO_PANELS[activePanelIndex].y,
                      }}
                      transition={{ type: 'spring', stiffness: 100, damping: 18 }}
                      className="absolute w-[240px] h-[340px] bg-[#0c0c0e] border border-neutral-850 rounded-lg p-2 origin-center"
                    >
                      {/* Mockup comic page panels */}
                      <div className="relative w-full h-full">
                        {/* Panel 1 */}
                        <div
                          className={`absolute top-[2%] left-[2%] w-[96%] h-[26%] border-2 rounded transition-all duration-300 ${activePanelIndex === 1 ? 'border-[#ff5a00] bg-[#ff5a00]/10 shadow-[0_0_15px_rgba(255,90,0,0.2)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                        >
                          <span className="absolute bottom-1 left-2 font-mono text-[7px] text-neutral-600">
                            Panel 1
                          </span>
                        </div>
                        {/* Panel 2 */}
                        <div
                          className={`absolute top-[32%] left-[2%] w-[46%] h-[32%] border-2 rounded transition-all duration-300 ${activePanelIndex === 2 ? 'border-[#ff5a00] bg-[#ff5a00]/10 shadow-[0_0_15px_rgba(255,90,0,0.2)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                        >
                          <span className="absolute bottom-1 left-2 font-mono text-[7px] text-neutral-600">
                            Panel 2
                          </span>
                        </div>
                        {/* Panel 3 */}
                        <div
                          className={`absolute top-[32%] left-[52%] w-[46%] h-[32%] border-2 rounded transition-all duration-300 ${activePanelIndex === 3 ? 'border-[#ff5a00] bg-[#ff5a00]/10 shadow-[0_0_15px_rgba(255,90,0,0.2)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                        >
                          <span className="absolute bottom-1 left-2 font-mono text-[7px] text-neutral-600">
                            Panel 3
                          </span>
                        </div>
                        {/* Panel 4 */}
                        <div
                          className={`absolute top-[68%] left-[2%] w-[96%] h-[30%] border-2 rounded transition-all duration-300 ${activePanelIndex === 4 ? 'border-[#ff5a00] bg-[#ff5a00]/10 shadow-[0_0_15px_rgba(255,90,0,0.2)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                        >
                          <span className="absolute bottom-1 left-2 font-mono text-[7px] text-neutral-600">
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
                        className="flex gap-3 w-full max-w-[400px] aspect-[1.3] perspective-1000 origin-center"
                      >
                        {/* Left Page */}
                        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-2xl relative">
                          <span className="text-[8px] font-mono font-bold text-neutral-600">
                            PAGE {dualSpreadPage * 2}
                          </span>
                          <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <BookOpen size={24} className="text-[#ff5a00] mb-2" />
                            <h4 className="font-heading font-black italic text-[11px] text-white">
                              Spread View
                            </h4>
                          </div>
                          <div className="absolute right-0 top-0 bottom-0 w-px bg-neutral-800/80 shadow-2xl" />
                        </div>

                        {/* Right Page */}
                        <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-2xl">
                          <span className="text-[8px] font-mono font-bold text-neutral-600">
                            PAGE {dualSpreadPage * 2 + 1}
                          </span>
                          <div className="flex-1 flex flex-col justify-center items-center text-center">
                            <SparklesIcon size={24} className="text-[#a3e635] mb-2" />
                            <h4 className="font-heading font-black italic text-[11px] text-white">
                              Zero Shifts
                            </h4>
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
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
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
                              ? 'bg-[#ff5a00] w-4'
                              : 'bg-neutral-800 hover:bg-neutral-600'
                          }`}
                        >
                          <span className="sr-only">Panel {idx + 1}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
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
                              ? 'bg-[#ff5a00] w-4'
                              : 'bg-neutral-800 hover:bg-neutral-600'
                          }`}
                        >
                          <span className="sr-only">Spread {page}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Social / Community Section (Speech-Bubble Ticker) ───────── */}
        <section className="mt-48 w-full max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={animatedFadeIn}
            className="bg-neutral-950/40 border-3 border-neutral-850 rounded-[2.5rem] p-12 md:p-20 text-white text-center relative overflow-hidden"
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#a3e635]/20 bg-[#a3e635]/5 px-3 py-1 text-[10px] font-display font-black tracking-widest text-[#a3e635] uppercase mb-6">
                <Users size={10} aria-hidden="true" />
                COMET CIRCLE
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-black mb-6 italic tracking-tighter uppercase leading-none">
                READ ALONG WITH THE ORBIT.
              </h2>
              <p className="text-sm md:text-base text-neutral-400 font-medium mb-12 leading-relaxed">
                Connect and sync progress lists across devices. Join readers logging client speed
                benchmarks and library catalog configurations.
              </p>
            </div>

            {/* Custom Speech-Bubble Scrolling Ticker */}
            <div className="relative w-full overflow-hidden py-4 select-none mask-fade-edges">
              <motion.div
                animate={isReduced ? {} : { x: [0, -1200] }}
                transition={{
                  repeat: Infinity,
                  ease: 'linear',
                  duration: 32,
                }}
                className="flex gap-6 whitespace-nowrap w-max"
              >
                {/* Render multiple flat copies for a continuous seamless loop */}
                {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-4 bg-neutral-950 border-2 border-neutral-855 p-4 rounded-2xl shadow-md hover:border-[#ff5a00] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-heading font-black text-xs text-[#a3e635]">
                      {item.user.charAt(1).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <span className="font-heading font-black text-xs text-white block">
                        {item.user}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-medium block mt-0.5">
                        {item.activity}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono font-bold bg-[#ff5a00]/10 text-[#ff5a00] border border-[#ff5a00]/20 px-2 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="mt-48 pb-20">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={animatedFadeIn}
            className="text-center"
          >
            <h2 className="text-5xl md:text-7xl font-heading font-black mb-12 italic tracking-tighter uppercase leading-none">
              YOUR LIBRARY.
              <br />
              <span className="text-[#ff5a00]">RECONFIGURED.</span>
            </h2>
            <motion.div
              whileHover={isReduced ? {} : { scale: 1.02 }}
              whileTap={isReduced ? {} : { scale: 0.98 }}
            >
              <Link
                href="/register"
                className="inline-flex h-16 items-center justify-center gap-3 rounded-xl bg-white text-black border-3 border-neutral-950 px-10 text-base font-heading font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_#ff5a00] hover:shadow-[3px_3px_0px_0px_#ff5a00] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all"
              >
                Join the Orbit
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t-3 border-neutral-850 bg-[#070709] bg-halftone py-16 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top Section: Multi-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-neutral-900">
            {/* Column 1 & 2: Brand Pitch (Spans 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a00] border-2 border-neutral-950 shadow-[2px_2px_0px_0px_#000]">
                  <Rocket className="text-white" size={16} aria-hidden="true" />
                </div>
                <span className="text-lg font-heading font-black uppercase italic text-white tracking-tight">
                  Comet
                </span>
              </div>
              <p className="text-neutral-400 font-medium leading-relaxed max-w-sm">
                The Speed of Light Comic Reader. Instantly decompress, segment, and catalog your
                comic book archive entirely client-side. Built for speed and privacy.
              </p>

              {/* Mock Social Badges */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-[#ff5a00] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                  aria-label="GitHub Repository"
                >
                  <Users size={16} />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-[#ff5a00] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                  aria-label="Community Server"
                >
                  <MessageSquare size={16} />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-[#ff5a00] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                  aria-label="Status Dashboard"
                >
                  <Target size={16} />
                </a>
              </div>
            </div>

            {/* Column 3: Reader Options */}
            <div>
              <h4 className="font-heading font-black text-xs text-neutral-300 uppercase tracking-widest mb-4">
                Reader
              </h4>
              <ul className="space-y-3 font-medium">
                <li>
                  <Link href="/library" className="hover:text-white transition-colors">
                    Open Library
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Performance Stats
                  </a>
                </li>
                <li>
                  <Link href="/settings" className="hover:text-white transition-colors">
                    Preferences
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings/achievements"
                    className="hover:text-white transition-colors"
                  >
                    Achievements
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Platform Info */}
            <div>
              <h4 className="font-heading font-black text-xs text-neutral-300 uppercase tracking-widest mb-4">
                Platform
              </h4>
              <ul className="space-y-3 font-medium">
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing Plans
                  </Link>
                </li>
                <li>
                  <a href="/api-docs" className="hover:text-white transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="https://github.com" className="hover:text-white transition-colors">
                    Source Code
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5: Stay Synced (Newsletter) */}
            <div className="space-y-4">
              <h4 className="font-heading font-black text-xs text-neutral-300 uppercase tracking-widest mb-1">
                Stay Synced
              </h4>
              <p className="text-neutral-500 text-[11px] font-medium leading-relaxed">
                Join the orbit and get notified of core parser speed updates.
              </p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex items-stretch gap-2 max-w-sm"
              >
                <input
                  type="email"
                  placeholder="name@domain.com"
                  required
                  className="flex-1 bg-neutral-900 border-2 border-neutral-850 p-2.5 rounded-xl text-xs text-white placeholder-neutral-600 focus:border-[#ff5a00] focus:ring-0 outline-none transition-colors"
                  aria-label="Email address for newsletter"
                />
                <button
                  type="submit"
                  className="bg-[#ff5a00] hover:bg-[#e65100] text-white border-2 border-neutral-950 px-4 rounded-xl font-heading font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Section: Legal & Status */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 font-mono text-[10px] text-neutral-500">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <span>&copy; 2026 Comet. Compiled with speed.</span>
              <span className="hidden md:inline text-neutral-800">|</span>
              <a href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Cookie Preferences
              </a>
            </div>

            {/* Live Operational Status Badge */}
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full text-[9px] text-green-450 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              All Systems Operational
            </div>
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
  colSpan = '',
  reducedMotion = false,
  visual = null,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  colSpan?: string;
  reducedMotion?: boolean;
  visual?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={reducedMotion ? {} : featureCardVariant}
      whileHover={
        reducedMotion
          ? {}
          : {
              y: -4,
              x: -4,
              borderColor: '#ff5a00',
              boxShadow: '6px 6px 0px 0px rgba(255, 90, 0, 1)',
            }
      }
      className={`group relative flex flex-col justify-between rounded-[2rem] border-3 border-neutral-855 bg-neutral-950/40 p-8 text-left backdrop-blur-lg transition-all cursor-pointer overflow-hidden ${colSpan}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff5a00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff5a00]/10 text-[#ff5a00] border border-[#ff5a00]/20">
          {icon}
        </div>

        <h3 className="mb-3 text-lg font-heading font-black italic uppercase tracking-wider group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-neutral-400 font-medium text-xs md:text-sm leading-relaxed group-hover:text-neutral-300 transition-colors">
          {description}
        </p>
      </div>

      {visual}

      {!reducedMotion && (
        <div className="absolute top-8 right-8 text-[#ff5a00] opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          <ArrowRight size={16} />
        </div>
      )}
    </motion.div>
  );
}
