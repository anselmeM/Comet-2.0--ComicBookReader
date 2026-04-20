"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Zap, CloudOff, Shield, Rocket, ArrowRight, Menu, X } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const heroTextVariant = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
};

const navVariant = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" }
};

const blobVariant = {
  animate: {
    scale: [1, 1.1, 1],
    rotate: [0, 5, 0],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const featureCardVariant = {
  initial: { opacity: 0, y: 40, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
};

const footerVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.8 }
};

export default function Home() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const isReduced = !!shouldReduceMotion;

  // Conditional variants for reduced motion
  const animatedFadeIn = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : fadeIn;
  const animatedNav = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : navVariant;
  const animatedHeroText = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : heroTextVariant;
  const animatedFooter = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : footerVariant;
  const animatedStagger = isReduced ? { animate: { transition: { staggerChildren: 0 } } } : staggerContainer;

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
          variants={isReduced ? { animate: { opacity: 0.1 } } : {
            animate: {
              scale: [1, 1.15, 1],
              rotate: [0, -5, 0],
              transition: { duration: 25, repeat: Infinity, ease: "easeInOut" }
            }
          } as any}
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
            <Rocket className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Comet</span>
        </motion.div>

        <div className="flex items-center gap-4 sm:gap-5">
          {status === "loading" ? (
            <div className="h-8 w-24 bg-comet-surface/30 rounded-lg animate-pulse" />
          ) : !session ? (
            <>
              {/* Desktop: Inline navigation */}
              <div className="hidden sm:flex items-center gap-8">
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
                <motion.div whileHover={isReduced ? {} : { scale: 1.05 }} whileTap={isReduced ? {} : { scale: 0.95 }}>
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
            <motion.div whileHover={isReduced ? {} : { scale: 1.05 }} whileTap={isReduced ? {} : { scale: 0.95 }}>
              <Link
                href="/library"
                className="group flex items-center gap-2 rounded-full border border-comet-border bg-comet-surface/50 px-4 sm:px-6 py-2.5 text-sm font-medium backdrop-blur-md transition-all hover:bg-comet-accent hover:text-white"
              >
                <span className="hidden sm:inline">Open Library</span>
                <span className="sm:hidden">Library</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
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
          className="max-w-4xl"
        >
          <motion.div 
            variants={isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : {
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-comet-accent/30 bg-comet-accent/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-comet-accent uppercase"
          >
            <Zap size={14} />
            The Speed of Light Comic Reader
          </motion.div>
          
          <motion.h1 
            variants={animatedHeroText}
            className="mb-8 text-5xl font-black leading-[1.1] tracking-tight md:text-7xl lg:text-8xl"
          >
            Read Comics at the <br /> 
            <span className="bg-gradient-to-r from-comet-accent via-blue-400 to-comet-accent bg-clip-text text-transparent italic">
              Speed of Light
            </span>
          </motion.h1>

          <motion.p 
            variants={animatedFadeIn}
            className="mb-12 mx-auto max-w-2xl text-lg text-comet-muted md:text-xl font-medium"
          >
            Zero lag construction. Offline-first architecture. 
            Experience your collection in a high-res, immersive environment built for 60fps performance.
          </motion.p>

          <motion.div variants={animatedFadeIn} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {status === "loading" ? (
              <div className="h-14 w-full sm:w-48 rounded-2xl bg-comet-surface/50 animate-pulse backdrop-blur-md" />
            ) : !session ? (
              <motion.div whileHover={isReduced ? {} : { scale: 1.05 }} whileTap={isReduced ? {} : { scale: 0.95 }}>
                <Link
                  href="/register"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-comet-accent px-10 text-lg font-bold text-white shadow-[0_10px_40px_rgba(124,106,247,0.3)] transition-all hover:bg-comet-accent-hover sm:w-auto"
                >
                  Get Started
                </Link>
              </motion.div>
            ) : (
              <motion.div whileHover={isReduced ? {} : { scale: 1.05 }} whileTap={isReduced ? {} : { scale: 0.95 }}>
                <Link
                  href="/library"
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-comet-accent px-10 text-lg font-bold text-white shadow-[0_10px_40px_rgba(124,106,247,0.3)] transition-all hover:bg-comet-accent-hover sm:w-auto"
                >
                  Go to Library
                </Link>
              </motion.div>
            )}
            <motion.div whileHover={isReduced ? {} : { scale: 1.05 }} whileTap={isReduced ? {} : { scale: 0.95 }}>
              <a
                href="#features"
                className="flex h-14 w-full items-center justify-center rounded-2xl border border-comet-border bg-comet-surface/50 px-10 text-lg font-semibold backdrop-blur-md transition-all hover:bg-comet-surface sm:w-auto"
              >
                Learn More
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ── Features Grid ────────────────────────────────────────────── */}
        <motion.div 
          id="features"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            animate: {
              transition: {
                staggerChildren: isReduced ? 0 : 0.15
              }
            }
          }}
          className="mt-40 grid w-full gap-8 md:grid-cols-3"
        >
          <FeatureCard 
            icon={<Zap />}
            title="60 FPS Performance"
            description="Decompression and rendering handled by Web Workers to keep the main thread fluid at all times."
            reducedMotion={isReduced}
          />
          <FeatureCard 
            icon={<CloudOff />}
            title="Offline First"
            description="Full PWA support means your library is accessible even when you're deep in space (or a subway tunnel)."
            reducedMotion={isReduced}
          />
          <FeatureCard 
            icon={<Shield />}
            title="Local & Private"
            description="Your comics stay on your device. Metadata enrichment happens client-side. No cloud uploads needed."
            reducedMotion={isReduced}
          />
        </motion.div>
      </main>

      <motion.footer 
        initial="initial"
        whileInView="animate"
        viewport={{ once: true }}
        variants={animatedFooter}
        className="relative z-10 border-t border-comet-border bg-comet-surface/20 py-12 text-center text-sm text-comet-muted"
      >
        <p>&copy; 2026 Comet — The Speed of Light Comic Reader. All rights reserved.</p>
      </motion.footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, reducedMotion }: { icon: React.ReactNode, title: string, description: string, reducedMotion?: boolean }) {
  return (
    <motion.div 
      variants={reducedMotion ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : featureCardVariant}
      whileHover={reducedMotion ? {} : { 
        y: -10,
        borderColor: 'rgba(124, 106, 247, 0.5)',
        backgroundColor: 'rgba(20, 20, 30, 0.4)'
      }}
      className="group relative flex flex-col items-start rounded-3xl border border-comet-border bg-comet-surface/30 p-8 text-left backdrop-blur-lg transition-all cursor-pointer overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-comet-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <motion.div 
        whileHover={reducedMotion ? {} : { scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-comet-accent/10 text-comet-accent"
      >
        {icon}
      </motion.div>
      
      <h3 className="mb-3 text-xl font-bold group-hover:text-white transition-colors">{title}</h3>
      <p className="text-comet-muted leading-relaxed group-hover:text-comet-text/80 transition-colors">
        {description}
      </p>

      {!reducedMotion && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute top-8 right-8 text-comet-accent opacity-0 group-hover:opacity-100 transition-all"
        >
          <ArrowRight size={20} />
        </motion.div>
      )}
    </motion.div>
  );
}
