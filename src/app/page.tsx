"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Zap, CloudOff, Shield, Rocket, ArrowRight } from "lucide-react";

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
  return (
    <div className="relative min-h-screen overflow-hidden bg-comet-bg text-comet-text">
      {/* ── Background Elements ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-concept.png"
          alt="Cosmic comet background"
          fill
          className="object-cover opacity-40 mix-blend-screen"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-comet-bg/50 to-comet-bg" />
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 md:px-12 lg:px-24">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-comet-accent shadow-[0_0_20px_rgba(124,106,247,0.4)]">
            <Rocket className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Comet</span>
        </div>
        <Link
          href="/library"
          className="group flex items-center gap-2 rounded-full border border-comet-border bg-comet-surface/50 px-6 py-2.5 text-sm font-medium backdrop-blur-md transition-all hover:bg-comet-accent hover:text-white"
        >
          Open Library
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
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
            <Link
              href="/library"
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-comet-accent px-10 text-lg font-bold text-white shadow-[0_10px_40px_rgba(124,106,247,0.3)] transition-all hover:scale-105 hover:bg-comet-accent-hover sm:w-auto"
            >
              Start Reading
            </Link>
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
