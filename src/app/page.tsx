'use client';

import Link from 'next/link';

import dynamic from 'next/dynamic';

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
  Layers,
  Check,
  Sparkles as SparklesIcon,
} from 'lucide-react';

import { LandingFeatures } from '@/components/organisms/Landing/LandingFeatures';

import { LandingFooter } from '@/components/organisms/Landing/LandingFooter';
import { GuidedViewShowcase } from '@/components/organisms/Landing/GuidedViewShowcase';

// NOTE: the sandbox demo (JSZip + parsing stack + worker + panel detection)

// lives in components/organisms/Landing/SandboxDemo.tsx and is loaded lazily

// via LazySandbox below — none of it ships in the initial bundle/hydration.

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
  // LCP element (the h1): animate transform ONLY. Fading opacity from 0

  // delays the first visible paint of the largest element, which is exactly

  // what Lighthouse LCP measures. A y-slide keeps the entrance animation

  // without hiding the text.

  initial: { y: 16 },

  animate: { y: 0 },

  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const navVariant = {
  initial: { opacity: 0, y: -20 },

  animate: { opacity: 1, y: 0 },

  transition: { duration: 0.5, ease: 'easeOut' },
};

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

const SandboxDemo = dynamic(() => import('@/components/organisms/Landing/SandboxDemo'), {
  ssr: false,
});

/**



 * Mounts the sandbox demo only when it scrolls near the viewport: the parsing



 * stack (JSZip, workers, panel detection) and its framer-motion UI stay out of



 * the initial bundle and hydration, cutting main-thread work (TBT/TTI).



 */

function LazySandbox() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isNearViewport, setIsNearViewport] = useState(false);

  useEffect(() => {
    const el = containerRef.current;

    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);

          observer.disconnect();
        }
      },

      { rootMargin: '800px 0px' },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef}>
      {isNearViewport ? (
        <SandboxDemo />
      ) : (
        <div
          aria-hidden="true"
          className="mt-48 w-full max-w-7xl mx-auto text-left relative z-20 h-[560px] lg:h-[480px] rounded-[2.5rem] border-3 border-neutral-850 bg-neutral-950/40 animate-pulse"
        />
      )}
    </div>
  );
}

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

  // Feature Demo states

  // Auto-playing Guided View simulation

  // Auto-playing Dual Spread simulation

  // Conditional variants for reduced motion

  const animatedFadeIn = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : fadeIn;

  const animatedNav = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : navVariant;

  const animatedHeroText = isReduced ? {} : heroTextVariant;

  const animatedStagger = isReduced
    ? { animate: { transition: { staggerChildren: 0 } } }
    : staggerContainer;

  return (
    <div className="relative min-h-screen overflow-hidden bg-comet-ink text-[#e8e8f0] font-sans bg-halftone">
      {/* ── Background Gradients (Warm Sunset Nebula - No Blues/Purples) ── */}

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* CSS-animated (compositor), not framer-motion: infinite JS rAF



            loops burned ~8s of main-thread work per page load. The global



            prefers-reduced-motion rule freezes these. */}

        <div className="absolute top-[-5%] left-[-5%] w-[55%] h-[55%] bg-lime-500/8 rounded-full blur-[140px] animate-comet-blob-slow" />

        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-comet-orange/8 rounded-full blur-[140px] animate-comet-blob-slower" />

        <div className="absolute top-[30%] right-[10%] w-[45%] h-[45%] bg-comet-gold/5 rounded-full blur-[120px] animate-comet-blob-breathe" />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}

      <motion.nav
        initial="initial"
        animate="animate"
        variants={animatedNav}
        className={`sticky top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-7xl flex items-center justify-between px-6 py-4 rounded-[1.5rem] border transition-all duration-300 ${
          scrolled
            ? 'bg-zinc-950/70 backdrop-blur-2xl border-comet-orange/20 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_15px_rgba(255,90,0,0.05)]'
            : 'bg-zinc-950/30 backdrop-blur-xl border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4)]'
        }`}
      >
        <motion.div
          whileHover={isReduced ? {} : { scale: 1.03 }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-comet-orange border-2 border-neutral-900 shadow-[2px_2px_0px_0px_#000] transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-hover:shadow-[4px_4px_0px_0px_#000]">
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
                    className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-850 hover:border-comet-orange hover:text-white bg-neutral-950/40 px-5 py-2.5 text-xs font-heading font-black uppercase tracking-wider text-neutral-300 transition-all focus-visible:outline-2 focus-visible:outline-comet-orange cursor-pointer"
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
                    className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-850 hover:border-comet-orange hover:text-white bg-neutral-950/40 px-5 py-2.5 text-xs font-heading font-black uppercase tracking-wider text-neutral-300 transition-all focus-visible:outline-2 focus-visible:outline-comet-orange cursor-pointer"
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
                    className="inline-flex items-center justify-center rounded-xl bg-comet-orange hover:bg-comet-orange-hover border-2 border-neutral-950 px-5 py-2.5 text-xs font-heading font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all focus-visible:outline-2 focus-visible:outline-white cursor-pointer"
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
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-900 border-2 border-neutral-800 text-neutral-400 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-comet-orange"
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
                        className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-comet-orange/30 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Pricing
                      </Link>

                      <Link
                        href="/login"
                        className="block w-full text-left px-4 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-comet-orange/30 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>

                      <Link
                        href="/register"
                        className="block w-full text-center px-4 py-2.5 mt-1 rounded-xl text-xs font-heading font-black uppercase tracking-wider bg-comet-orange text-white hover:bg-comet-orange-hover border border-black shadow-[2px_2px_0px_0px_#000] transition-colors"
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
                className="inline-flex items-center gap-2 rounded-lg border border-comet-lime/20 bg-comet-lime/5 px-3 py-1 text-[10px] font-display font-black tracking-widest text-comet-lime uppercase"
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-comet-orange via-comet-gold to-comet-lime italic">
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
                      className="flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-comet-orange hover:bg-comet-orange-hover px-8 text-sm font-heading font-black uppercase tracking-wider text-white border-2 border-neutral-950 shadow-[4px_4px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
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
                      className="flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-comet-orange hover:bg-comet-orange-hover px-8 text-sm font-heading font-black uppercase tracking-wider text-white border-2 border-neutral-950 shadow-[4px_4px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
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
              className="absolute top-8 left-8 w-48 aspect-[3/4] rounded-[2rem] bg-neutral-950 border-3 border-neutral-855 p-4 shadow-2xl flex flex-col justify-between hover:border-comet-orange transition-colors rotate-[-6deg] z-20 animate-float-slow"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-display font-black text-comet-orange tracking-widest bg-comet-orange/10 px-2 py-0.5 rounded uppercase">
                  Sci-Fi
                </span>

                <span className="text-[8px] font-mono text-neutral-500">Vol. 12</span>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center text-center my-2 bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl border border-white/5 relative overflow-hidden">
                <SparklesIcon size={24} className="text-comet-orange animate-pulse" />

                <div className="absolute bottom-2 inset-x-2 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div className="bg-comet-orange h-full w-[80%]" />
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
              className="absolute bottom-12 left-16 bg-neutral-950 border-3 border-neutral-855 p-4 rounded-2xl shadow-xl w-44 flex items-center gap-3 hover:border-comet-lime transition-colors rotate-[4deg] z-30 animate-float-medium"
            >
              <div className="h-10 w-10 rounded-xl bg-comet-lime/10 border border-comet-lime/20 flex items-center justify-center text-comet-lime">
                <Zap size={16} className="animate-bounce" />
              </div>

              <div>
                <div className="font-display font-black text-xl text-comet-lime leading-none">
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
              className="absolute top-20 right-6 w-48 aspect-[3/4] rounded-[2rem] bg-neutral-950 border-3 border-neutral-855 p-4 shadow-2xl flex flex-col justify-between hover:border-comet-gold transition-colors rotate-[8deg] z-10 animate-float-fast"
            >
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-display font-black text-comet-gold tracking-widest bg-comet-gold/10 px-2 py-0.5 rounded uppercase">
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

        <LandingFeatures />

        <LazySandbox />

        <GuidedViewShowcase />
        {/* ── Social / Community Section (Speech-Bubble Ticker) ───────── */}

        <section className="content-visibility-auto mt-48 w-full max-w-7xl mx-auto">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={animatedFadeIn}
            className="bg-neutral-950/40 border-3 border-neutral-850 rounded-[2.5rem] p-12 md:p-20 text-white text-center relative overflow-hidden"
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-lg border border-comet-lime/20 bg-comet-lime/5 px-3 py-1 text-[10px] font-display font-black tracking-widest text-comet-lime uppercase mb-6">
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
              {/* CSS marquee (compositor) — was a framer-motion x-loop that



                  kept the main thread busy every frame. */}

              <div className="flex gap-6 whitespace-nowrap w-max animate-comet-ticker">
                {/* Render multiple flat copies for a continuous seamless loop */}

                {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-4 bg-neutral-950 border-2 border-neutral-855 p-4 rounded-2xl shadow-md hover:border-comet-orange transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-heading font-black text-xs text-comet-lime">
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

                    <span className="text-[8px] font-mono font-bold bg-comet-orange/10 text-comet-orange border border-comet-orange/20 px-2 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}

        <section className="content-visibility-auto mt-48 pb-20">
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
              <span className="text-comet-orange">RECONFIGURED.</span>
            </h2>

            <motion.div
              whileHover={isReduced ? {} : { scale: 1.02 }}
              whileTap={isReduced ? {} : { scale: 0.98 }}
            >
              <Link
                href="/register"
                className="inline-flex h-16 items-center justify-center gap-3 rounded-xl bg-white text-black border-3 border-neutral-950 px-10 text-base font-heading font-black uppercase tracking-widest shadow-[5px_5px_0px_0px_var(--color-comet-orange)] hover:shadow-[3px_3px_0px_0px_var(--color-comet-orange)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all"
              >
                Join the Orbit
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
