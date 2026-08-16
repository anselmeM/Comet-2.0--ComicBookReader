'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { BookOpen, Zap, CloudOff, Shield, Check, ArrowRight } from 'lucide-react';

const featureCardVariant = {
  initial: { opacity: 0, y: 30, scale: 0.97 },

  animate: { opacity: 1, y: 0, scale: 1 },

  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

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

              borderColor: 'var(--color-comet-orange)',

              boxShadow: '6px 6px 0px 0px rgba(255, 90, 0, 1)',
            }
      }
      className={`group relative flex flex-col justify-between rounded-[2rem] border-3 border-neutral-855 bg-neutral-950/40 p-8 text-left backdrop-blur-lg transition-all cursor-pointer overflow-hidden ${colSpan}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-comet-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-comet-orange/10 text-comet-orange border border-comet-orange/20">
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
        <div className="absolute top-8 right-8 text-comet-orange opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          <ArrowRight size={16} />
        </div>
      )}
    </motion.div>
  );
}

/** Landing Features Grid — asymmetric engineering showcase panels. */

export const LandingFeatures = () => {
  const isReduced = !!useReducedMotion();

  const animatedStagger = isReduced
    ? { animate: { transition: { staggerChildren: 0 } } }
    : staggerContainer;

  return (
    <section
      id="features"
      className="content-visibility-auto mt-48 w-full max-w-7xl mx-auto text-left"
    >
      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        className="text-left mb-16 max-w-xl"
      >
        <div className="inline-flex items-center gap-2 rounded-lg border border-comet-gold/20 bg-comet-gold/5 px-3 py-1 text-[10px] font-display font-black tracking-widest text-comet-gold uppercase mb-4">
          <BookOpen size={10} aria-hidden="true" />
          ENGINE ARCHITECTURE
        </div>

        <h2 className="text-4xl md:text-5xl font-heading font-black tracking-tighter uppercase italic leading-none">
          DESIGNED TO <br />
          BE FLUID.
        </h2>

        <p className="text-neutral-400 font-medium text-sm mt-4 leading-relaxed">
          We audited the typical bottlenecks in digital readers to construct a rendering client that
          isolates resources and protects responsiveness.
        </p>
      </motion.div>

      <motion.div
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        variants={animatedStagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        <FeatureCard
          icon={<Zap aria-hidden="true" size={20} />}
          title="60 FPS PERFORMANCE"
          description="Decompression and render paths run on dedicated background threads. The main viewport thread stays fluid for scrolling and gestures."
          colSpan="md:col-span-2"
          reducedMotion={isReduced}
          visual={
            <div className="mt-6 bg-comet-ink/80 border-2 border-neutral-900 p-4 rounded-xl font-mono text-xs text-neutral-400 space-y-2 select-none">
              <div className="flex justify-between text-comet-lime border-b border-neutral-850 pb-1">
                <span>worker.ts</span>

                <span>Status: RUNNING</span>
              </div>

              <div>$ parse_archive -f star_rover_12.cbz</div>

              <div className="text-white font-bold">$ Decompress completed in 294ms (130 p/s)</div>

              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-comet-lime h-full w-full rounded-full" />
              </div>
            </div>
          }
        />

        <FeatureCard
          icon={<CloudOff aria-hidden="true" size={20} />}
          title="READ OFFLINE"
          description="Full PWA packaging caches your layouts, logic, and comic archives locally. Start and read volumes completely offline."
          colSpan="md:col-span-1"
          reducedMotion={isReduced}
          visual={
            <div className="mt-6 flex flex-col items-center justify-center p-4 bg-comet-ink/80 border-2 border-neutral-900 rounded-xl select-none">
              <CloudOff size={28} className="text-comet-orange mb-2 animate-pulse" />

              <span className="text-[9px] font-display font-black text-neutral-500 uppercase tracking-widest">
                Network disconnected
              </span>
            </div>
          }
        />

        <FeatureCard
          icon={<Shield aria-hidden="true" size={20} />}
          title="ZERO SERVER UPLOADS"
          description="Your collection stays private. Encryption keys and file signatures are calculated locally. ComicVine metadata is enriched client-side."
          colSpan="md:col-span-3"
          reducedMotion={isReduced}
          visual={
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-6 p-4 bg-comet-ink/80 border-2 border-neutral-900 rounded-xl select-none">
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
  );
};
