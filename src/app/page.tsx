"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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

export default function Home() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-comet-bg text-comet-text">
      {/* ── Background Elements ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-comet-bg/80 to-indigo-900/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-comet-accent/10 via-transparent to-transparent" />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 md:px-12 lg:px-24">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-comet-accent shadow-[0_0_20px_rgba(124,106,247,0.4)]">
            <Rocket className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Comet</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-5">
          {status === "loading" ? (
            <div className="h-8 w-24 bg-comet-surface/30 rounded-lg animate-pulse" />
          ) : !session ? (
            <>
              {/* Desktop: Inline navigation */}
              <div className="hidden sm:flex items-center gap-5">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-white hover:text-comet-accent transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-full bg-comet-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(124,106,247,0.4)] transition-all hover:bg-comet-accent-hover hover:shadow-[0_6px_20px_rgba(124,106,247,0.5)] hover:scale-105 active:scale-95"
                >
                  Sign up
                </Link>
              </div>
              {/* Mobile: Hamburger menu */}
              <div className="sm:hidden relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-comet-surface/50 backdrop-blur-md border border-comet-border text-comet-muted hover:text-white transition-colors"
                  aria-label="Open menu"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                {mobileMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-comet-surface/95 backdrop-blur-xl border border-comet-border rounded-2xl p-4 shadow-xl z-50">
                    <Link
                      href="/login"
                      className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-white hover:bg-comet-accent hover:text-white transition-colors"
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
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/library"
              className="group flex items-center gap-2 rounded-full border border-comet-border bg-comet-surface/50 px-4 sm:px-6 py-2.5 text-sm font-medium backdrop-blur-md transition-all hover:bg-comet-accent hover:text-white"
            >
              <span className="hidden sm:inline">Open Library</span>
              <span className="sm:hidden">Library</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-32 text-center md:px-12 lg:px-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-4xl"
        >
          <motion.div variants={fadeIn} className="mb-6 inline-flex items-center gap-2 rounded-full border border-comet-accent/30 bg-comet-accent/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-comet-accent uppercase">
            <Zap size={14} />
            The Speed of Light Comic Reader
          </motion.div>
          
          <motion.h1 
            variants={fadeIn}
            className="mb-8 text-5xl font-black leading-[1.1] tracking-tight md:text-7xl lg:text-8xl"
          >
            Read Comics at the <br /> 
            <span className="bg-gradient-to-r from-comet-accent via-blue-400 to-comet-accent bg-clip-text text-transparent">
              Speed of Light
            </span>
          </motion.h1>

          <motion.p 
            variants={fadeIn}
            className="mb-12 mx-auto max-w-2xl text-lg text-comet-muted md:text-xl"
          >
            Zero lag construction. Offline-first architecture. 
            Experience your collection in a high-res, immersive environment built for 60fps performance.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {status === "loading" ? (
              <div className="h-14 w-full sm:w-48 rounded-2xl bg-comet-surface/50 animate-pulse backdrop-blur-md" />
            ) : !session ? (
              <Link
                href="/register"
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-comet-accent px-10 text-lg font-bold text-white shadow-[0_10px_40px_rgba(124,106,247,0.3)] transition-all hover:scale-105 hover:bg-comet-accent-hover sm:w-auto"
              >
                Get Started
              </Link>
            ) : (
              <Link
                href="/library"
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-comet-accent px-10 text-lg font-bold text-white shadow-[0_10px_40px_rgba(124,106,247,0.3)] transition-all hover:scale-105 hover:bg-comet-accent-hover sm:w-auto"
              >
                Go to Library
              </Link>
            )}
            <a
              href="#features"
              className="flex h-14 w-full items-center justify-center rounded-2xl border border-comet-border bg-comet-surface/50 px-10 text-lg font-semibold backdrop-blur-md transition-all hover:bg-comet-surface sm:w-auto"
            >
              Learn More
            </a>
          </motion.div>
        </motion.div>

        {/* ── Features Grid ────────────────────────────────────────────── */}
        <motion.div 
          id="features"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="mt-40 grid w-full gap-8 md:grid-cols-3"
        >
          <FeatureCard 
            icon={<Zap />}
            title="60 FPS Performance"
            description="Decompression and rendering handled by Web Workers to keep the main thread fluid at all times."
          />
          <FeatureCard 
            icon={<CloudOff />}
            title="Offline First"
            description="Full PWA support means your library is accessible even when you're deep in space (or a subway tunnel)."
          />
          <FeatureCard 
            icon={<Shield />}
            title="Local & Private"
            description="Your comics stay on your device. Metadata enrichment happens client-side. No cloud uploads needed."
          />
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-comet-border bg-comet-surface/20 py-12 text-center text-sm text-comet-muted">
        <p>&copy; 2026 Comet — The Speed of Light Comic Reader. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      variants={fadeIn}
      className="group relative flex flex-col items-start rounded-3xl border border-comet-border bg-comet-surface/30 p-8 text-left backdrop-blur-lg transition-all hover:border-comet-accent/50 hover:bg-comet-surface/50"
    >
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-comet-accent/10 text-comet-accent group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold">{title}</h3>
      <p className="text-comet-muted leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
