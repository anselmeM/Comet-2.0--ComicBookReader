'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Target, Play, Pause, BookOpen, Sparkles as SparklesIcon } from 'lucide-react';

const DEMO_PANELS = [
  { id: 0, x: 0, y: 0, scale: 1, label: 'Full Page View' },
  { id: 1, x: 0, y: 110, scale: 1.8, label: 'Panel 1: Opening Shot' },
  { id: 2, x: 70, y: -20, scale: 2.2, label: 'Panel 2: Dramatic Focus' },
  { id: 3, x: -70, y: -20, scale: 2.2, label: 'Panel 3: Side-by-Side Action' },
  { id: 4, x: 0, y: -120, scale: 1.8, label: 'Panel 4: Splash Finish' },
];

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

/** Guided View + Dual Spread interactive showcase (fully self-contained). */
export const GuidedViewShowcase = () => {
  const isReduced = !!useReducedMotion();
  const [demoMode, setDemoMode] = useState<'guided' | 'spread'>('guided');
  const [activePanelIndex, setActivePanelIndex] = useState(0);
  const [isDemoAutoplay, setIsDemoAutoplay] = useState(true);
  const [dualSpreadPage, setDualSpreadPage] = useState(1);

  useEffect(() => {
    if (demoMode !== 'guided' || !isDemoAutoplay) return;
    const interval = setInterval(() => {
      setActivePanelIndex((prev) => (prev + 1) % DEMO_PANELS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [demoMode, isDemoAutoplay]);

  useEffect(() => {
    if (demoMode !== 'spread' || !isDemoAutoplay) return;
    const interval = setInterval(() => {
      setDualSpreadPage((prev) => (prev % 3) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [demoMode, isDemoAutoplay]);

  const animatedFadeIn = isReduced ? { initial: { opacity: 1 }, animate: { opacity: 1 } } : fadeIn;

  return (
    <section className="content-visibility-auto mt-48 w-full max-w-7xl mx-auto text-left">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={animatedFadeIn}
        >
          <div className="inline-flex items-center gap-2 text-comet-gold font-display font-black uppercase tracking-widest text-xs mb-6">
            <Target size={14} aria-hidden="true" />
            CINEMATIC PANNING
          </div>

          <h2 className="text-4xl md:text-5xl font-heading font-black mb-8 italic tracking-tighter uppercase leading-none">
            SMART PANEL <br />
            SEGMENTATION.
          </h2>

          <p className="text-sm md:text-base text-neutral-400 font-medium leading-relaxed mb-10 max-w-lg">
            Guided View analyzes page margins to locate panel coordinates client-side. The reader
            centers and zooms each cell for a focused reading flow.
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
            <div className="flex bg-comet-ink p-1 rounded-xl border border-neutral-850">
              <button
                type="button"
                onClick={() => {
                  setDemoMode('guided');

                  setActivePanelIndex(0);
                }}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-heading font-black uppercase tracking-wider transition-all ${
                  demoMode === 'guided'
                    ? 'bg-comet-orange text-white shadow-md'
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
                    ? 'bg-comet-orange text-white shadow-md'
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

          <div className="flex-1 relative w-full overflow-hidden rounded-xl bg-comet-ink border border-neutral-855 flex items-center justify-center my-4">
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
                      className={`absolute top-[2%] left-[2%] w-[96%] h-[26%] border-2 rounded transition-all duration-300 ${activePanelIndex === 1 ? 'border-comet-orange bg-comet-orange/10 shadow-[0_0_15px_rgba(255,90,0,0.2)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                    >
                      <span className="absolute bottom-1 left-2 font-mono text-[7px] text-neutral-600">
                        Panel 1
                      </span>
                    </div>

                    {/* Panel 2 */}

                    <div
                      className={`absolute top-[32%] left-[2%] w-[46%] h-[32%] border-2 rounded transition-all duration-300 ${activePanelIndex === 2 ? 'border-comet-orange bg-comet-orange/10 shadow-[0_0_15px_rgba(255,90,0,0.2)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                    >
                      <span className="absolute bottom-1 left-2 font-mono text-[7px] text-neutral-600">
                        Panel 2
                      </span>
                    </div>

                    {/* Panel 3 */}

                    <div
                      className={`absolute top-[32%] left-[52%] w-[46%] h-[32%] border-2 rounded transition-all duration-300 ${activePanelIndex === 3 ? 'border-comet-orange bg-comet-orange/10 shadow-[0_0_15px_rgba(255,90,0,0.2)]' : 'border-neutral-800 bg-neutral-900/50'}`}
                    >
                      <span className="absolute bottom-1 left-2 font-mono text-[7px] text-neutral-600">
                        Panel 3
                      </span>
                    </div>

                    {/* Panel 4 */}

                    <div
                      className={`absolute top-[68%] left-[2%] w-[96%] h-[30%] border-2 rounded transition-all duration-300 ${activePanelIndex === 4 ? 'border-comet-orange bg-comet-orange/10 shadow-[0_0_15px_rgba(255,90,0,0.2)]' : 'border-neutral-800 bg-neutral-900/50'}`}
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
                        <BookOpen size={24} className="text-comet-orange mb-2" />

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
                        <SparklesIcon size={24} className="text-comet-lime mb-2" />

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
                          ? 'bg-comet-orange w-4'
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
                          ? 'bg-comet-orange w-4'
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
  );
};

export default GuidedViewShowcase;
