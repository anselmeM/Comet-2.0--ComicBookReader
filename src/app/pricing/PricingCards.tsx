'use client';

import { motion } from 'framer-motion';

import Link from 'next/link';

import { Check, Loader2, ArrowRight } from 'lucide-react';

export interface PricingTier {
  name: string;

  price: string;

  period?: string;

  billedAnnually?: string;

  description: string;

  features: string[];

  highlight?: boolean;

  cta: string;

  href?: string;

  disabled?: boolean;

  action?: (() => void) | null;
}

interface PricingCardsProps {
  tiers: PricingTier[];

  isLoading: boolean;
}

/** The plan cards grid — tiers come pre-built from the page (checkout closures). */

export const PricingCards = ({ tiers, isLoading }: PricingCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl items-stretch">
      {tiers.map((tier, idx) => (
        <motion.div
          key={tier.name}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`relative flex flex-col p-8 md:p-10 rounded-[2.5rem] border-3 border-neutral-950 transition-all ${
            tier.highlight
              ? 'bg-neutral-950 shadow-[8px_8px_0px_0px_var(--color-comet-orange)] hover:shadow-[10px_10px_0px_0px_var(--color-comet-orange)] md:scale-105 z-20'
              : 'bg-neutral-950/40 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.02)] hover:border-comet-orange hover:shadow-[6px_6px_0px_0px_var(--color-comet-orange)] z-10'
          }`}
        >
          {tier.highlight && (
            <div className="absolute -top-4 left-10 bg-comet-lime text-neutral-950 px-4 py-1 border-2 border-neutral-950 text-[10px] font-display font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] rounded-lg">
              Most Popular
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-2xl font-heading font-black italic uppercase text-white mb-2">
              {tier.name}
            </h3>

            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-display font-black tracking-tighter text-white">
                {tier.price}
              </span>

              {tier.period && (
                <span className="text-neutral-400 font-heading font-black uppercase text-sm tracking-wider">
                  {tier.period}
                </span>
              )}
            </div>

            {tier.billedAnnually && (
              <div className="text-xs text-comet-lime font-display font-black uppercase tracking-wide mt-2">
                {tier.billedAnnually}
              </div>
            )}

            <p className="mt-4 text-neutral-400 font-medium leading-relaxed text-sm">
              {tier.description}
            </p>
          </div>

          <div className="flex-1 space-y-4 mb-10">
            {tier.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-neutral-950 ${
                    tier.highlight
                      ? 'bg-comet-orange text-white shadow-[1px_1px_0px_0px_#000]'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <Check size={11} strokeWidth={4} />
                </div>

                <span className="text-sm font-semibold text-neutral-300">{feature}</span>
              </div>
            ))}
          </div>

          {tier.action ? (
            <button
              onClick={tier.action}
              disabled={isLoading || tier.disabled}
              className={`w-full py-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-3 border-2 border-neutral-950 cursor-pointer ${
                tier.highlight
                  ? 'bg-comet-orange text-white hover:bg-comet-orange-hover shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] disabled:bg-comet-orange/50 disabled:pointer-events-none'
                  : 'bg-white text-neutral-950 hover:bg-neutral-100 shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] disabled:bg-neutral-900 disabled:text-neutral-500 disabled:pointer-events-none'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin text-current" size={14} />
                  Processing...
                </>
              ) : (
                <>
                  {tier.cta}

                  <ArrowRight size={14} />
                </>
              )}
            </button>
          ) : tier.disabled ? (
            <button
              disabled
              className="w-full py-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider bg-neutral-900 text-neutral-500 border-2 border-neutral-950 flex items-center justify-center gap-3 cursor-not-allowed"
            >
              {tier.cta}

              <Check size={14} />
            </button>
          ) : (
            <Link
              href={tier.href ?? '#'}
              className={`w-full py-4 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98] text-center flex items-center justify-center gap-3 border-2 border-neutral-950 cursor-pointer ${
                tier.highlight
                  ? 'bg-comet-orange text-white hover:bg-comet-orange-hover shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000]'
                  : 'bg-white text-neutral-950 hover:bg-neutral-100 shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000]'
              }`}
            >
              {tier.cta}

              <ArrowRight size={14} />
            </Link>
          )}
        </motion.div>
      ))}
    </div>
  );
};
