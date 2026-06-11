'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Rocket, ArrowRight, Cloud, Zap, Shield } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function PremiumModal({ isOpen, onClose, featureName }: PremiumModalProps) {
  const { handleCheckout, isLoading } = useSubscription();

  const handleUpgrade = async () => {
    await handleCheckout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-xl bg-neutral-900 border border-comet-accent/30 rounded-[3rem] shadow-2xl overflow-hidden relative"
          >
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-comet-accent/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="p-8 md:p-12 relative z-10">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl transition-all text-neutral-400"
                aria-label="Close"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-comet-accent rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-comet-accent/40 mb-8 animate-bounce">
                  <Sparkles size={32} />
                </div>

                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter italic mb-4">
                  Unlock the <br />
                  <span className="bg-gradient-to-r from-comet-accent via-blue-400 to-comet-accent bg-clip-text text-transparent">
                    Cloud Voyager Tier
                  </span>
                </h3>

                <p className="text-comet-muted text-lg font-medium max-w-sm mb-12">
                  {featureName ? (
                    <><strong>{featureName}</strong> is a Premium feature. Upgrade to unlock the full power of Comet.</>
                  ) : (
                    "Upgrade to Premium to unlock cloud sync, automatic enrichment, and more."
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full mb-12">
                  <FeatureItem icon={<Cloud size={18} />} label="Cloud Sync" />
                  <FeatureItem icon={<Zap size={18} />} label="Auto-Enrich" />
                  <FeatureItem icon={<Shield size={18} />} label="Ad-Free" />
                </div>

                <button 
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-100 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-3 active:scale-95"
                >
                  {isLoading ? 'Preparing...' : 'Upgrade Now'}
                  <ArrowRight size={18} />
                </button>
                
                <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Cancel anytime • Secure checkout via Stripe
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FeatureItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
      <div className="text-comet-accent">{icon}</div>
      <span className="text-[10px] font-black uppercase text-white tracking-tighter">{label}</span>
    </div>
  );
}
