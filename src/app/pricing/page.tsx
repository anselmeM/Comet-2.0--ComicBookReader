'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import { useSession } from 'next-auth/react';

import { logger } from '@/lib/logger';

import { motion, useReducedMotion } from 'framer-motion';

import {
  Zap,
  Rocket,
  Check,
  ArrowRight,
  Shield,
  Cloud,
  Sparkles,
  Globe,
  Laptop,
  Smartphone,
  Loader2,
  Users,
  MessageSquare,
  Target,
} from 'lucide-react';

import { useSubscription } from '@/hooks/useSubscription';

import { PricingComparison } from './PricingComparison';

import { PricingFaq } from './PricingFaq';

import { PricingCards } from './PricingCards';

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

interface CurrencyConfig {
  code: string;

  symbol: string;

  monthlyPrice: string;

  annualPrice: string;

  annualBilledPrice: string;

  countryName: string;
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',

    symbol: '$',

    monthlyPrice: '4.99',

    annualPrice: '3.99',

    annualBilledPrice: '47.88',

    countryName: 'United States',
  },

  CAD: {
    code: 'CAD',

    symbol: 'C$',

    monthlyPrice: '6.99',

    annualPrice: '5.49',

    annualBilledPrice: '65.88',

    countryName: 'Canada',
  },

  GBP: {
    code: 'GBP',

    symbol: '£',

    monthlyPrice: '4.49',

    annualPrice: '3.59',

    annualBilledPrice: '43.08',

    countryName: 'United Kingdom',
  },

  EUR: {
    code: 'EUR',

    symbol: '€',

    monthlyPrice: '4.99',

    annualPrice: '3.99',

    annualBilledPrice: '47.88',

    countryName: 'Europe',
  },
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD',

  CA: 'CAD',

  GB: 'GBP',

  AT: 'EUR',

  BE: 'EUR',

  CY: 'EUR',

  EE: 'EUR',

  FI: 'EUR',

  FR: 'EUR',

  DE: 'EUR',

  GR: 'EUR',

  IE: 'EUR',

  IT: 'EUR',

  LV: 'EUR',

  LT: 'EUR',

  LU: 'EUR',

  MT: 'EUR',

  NL: 'EUR',

  PT: 'EUR',

  SK: 'EUR',

  SI: 'EUR',

  ES: 'EUR',
};

const DEFAULT_PRICING = CURRENCY_CONFIGS.USD;

export default function PricingPage() {
  const { data: session } = useSession();

  const shouldReduceMotion = useReducedMotion();

  const isReduced = !!shouldReduceMotion;

  const { handleCheckout, handlePortal, isLoading } = useSubscription();

  // Scroll tracking for premium floating navbar

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  const [currency, setCurrency] = useState<string>('USD');

  const [isManualCurrency, setIsManualCurrency] = useState(false);

  const [isGeoLoaded, setIsGeoLoaded] = useState(false);

  useEffect(() => {
    async function detectLocale() {
      try {
        const res = await fetch('/api/stripe/locale');

        if (res.ok) {
          const data = await res.json();

          const countryCode = data.country;

          const currencyCode = COUNTRY_TO_CURRENCY[countryCode] || 'USD';

          setCurrency(currencyCode);

          setIsGeoLoaded(true);
        }
      } catch (error) {
        logger.error('Failed to detect country locale', {}, error as Error);
      }
    }

    detectLocale();
  }, []);

  const config = CURRENCY_CONFIGS[currency] || DEFAULT_PRICING;

  const { symbol } = config;

  const tiers = [
    {
      name: 'Free Reader',

      price: `${symbol}0`,

      period: '',

      description: 'Perfect for casual readers managing a local collection.',

      features: [
        'Unlimited Local Storage (IndexedDB)',

        'Cloud Sync (S3/R2)',

        'Cross-device File Restoration',

        'Reading Progress Synchronization',

        'Manual Metadata Editing',

        'Basic Search & Filtering',

        'Ad-supported experience',
      ],

      cta: session && session.user?.plan !== 'PREMIUM' ? 'Current Plan' : 'Get Started',

      action: null,

      href: '/register',

      highlight: false,

      disabled: !!(session && session.user?.plan !== 'PREMIUM'),
    },

    {
      name: 'Cloud Voyager',

      price: `${symbol}${billingInterval === 'annual' ? config.annualPrice : config.monthlyPrice}`,

      period: '/month',

      billedAnnually:
        billingInterval === 'annual'
          ? `billed as ${symbol}${config.annualBilledPrice}/year`
          : undefined,

      description: 'For the serious collector who reads everywhere.',

      features: [
        'Everything in Free',

        'Unlimited Cloud Sync',

        'Automatic Metadata Enrichment',

        'Seamless Multi-device Sync',

        'Ad-free Experience',

        'Priority Support',
      ],

      cta: session?.user?.plan === 'PREMIUM' ? 'Manage Plan' : 'Upgrade to Premium',

      action:
        session?.user?.plan === 'PREMIUM'
          ? () => handlePortal()
          : () => handleCheckout(billingInterval),

      href: '/register',

      highlight: true,

      disabled: false,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-comet-ink text-[#e8e8f0] font-sans bg-halftone">
      {/* ── Background Gradients (Warm Sunset Nebula) ───────────────────── */}

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={
            isReduced
              ? {}
              : {
                  scale: [1, 1.1, 1],

                  rotate: [0, 5, 0],
                }
          }
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-lime-500/5 rounded-full blur-[140px]"
        />

        <motion.div
          animate={
            isReduced
              ? {}
              : {
                  scale: [1, 1.15, 1],

                  rotate: [0, -8, 0],
                }
          }
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-comet-orange/5 rounded-full blur-[140px]"
        />

        <motion.div
          animate={
            isReduced
              ? {}
              : {
                  scale: [1.1, 0.9, 1.1],

                  x: [0, 20, 0],
                }
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[30%] right-[10%] w-[45%] h-[45%] bg-comet-gold/3 rounded-full blur-[120px]"
        />
      </div>

      <nav
        className={`sticky top-4 z-50 mx-auto w-[calc(100%-2rem)] max-w-7xl flex items-center justify-between px-6 py-4 rounded-[1.5rem] border transition-all duration-300 ${
          scrolled
            ? 'bg-zinc-950/70 backdrop-blur-2xl border-comet-orange/20 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_15px_rgba(255,90,0,0.05)]'
            : 'bg-zinc-950/30 backdrop-blur-xl border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.4)]'
        }`}
      >
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-comet-orange border-2 border-neutral-950 shadow-[2px_2px_0px_0px_#000] transition-transform group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-hover:shadow-[4px_4px_0px_0px_#000]">
            <Rocket className="text-white" size={18} aria-hidden="true" />
          </div>

          <span className="text-xl font-heading font-black tracking-tight text-white uppercase italic">
            Comet
          </span>
        </Link>

        <Link
          href={session ? '/library' : '/login'}
          className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-850 hover:border-comet-orange hover:text-white bg-neutral-950/40 px-5 py-2.5 text-xs font-heading font-black uppercase tracking-wider text-neutral-300 transition-all focus-visible:outline-2 focus-visible:outline-comet-orange cursor-pointer"
        >
          {session ? 'Back to Library' : 'Log in'}
        </Link>
      </nav>

      {/* ── Pricing Hero ───────────────────────────────────────────────── */}

      <main className="relative z-10 flex flex-col items-center px-6 pt-20 pb-32 md:px-12 lg:px-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div
            variants={fadeIn}
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-comet-lime/20 bg-comet-lime/5 px-3 py-1.5 text-[10px] font-display font-black tracking-widest text-comet-lime uppercase"
          >
            <Sparkles size={12} aria-hidden="true" className="animate-pulse" />
            Simple Pricing. No Hidden Missions.
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="mb-6 text-5xl md:text-7xl font-heading font-black tracking-tighter uppercase leading-[0.95]"
          >
            CHOOSE YOUR <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-comet-orange via-comet-gold to-comet-lime italic">
              DIMENSION.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="mx-auto max-w-2xl text-neutral-400 text-base md:text-lg font-medium leading-relaxed"
          >
            Whether you&apos;re a local hero or a galactic explorer, we have a plan built for your
            reading speed.
          </motion.p>
        </motion.div>

        {/* ── Billing Cycle & Localized Currency Selectors ────────────────── */}

        <div className="flex flex-col items-center gap-6 mb-16 z-20">
          <div className="relative flex items-center justify-center gap-4">
            {/* Toggle Switch */}

            <div className="relative flex p-1 rounded-xl bg-neutral-950 border-2 border-neutral-900 shadow-[3px_3px_0px_0px_#000]">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`relative z-10 px-6 py-2 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                  billingInterval === 'monthly'
                    ? 'text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {billingInterval === 'monthly' && (
                  <motion.div
                    layoutId="billing-pill"
                    className="absolute inset-0 bg-comet-orange border border-neutral-950 rounded-lg -z-10 shadow"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                Monthly
              </button>

              <button
                onClick={() => setBillingInterval('annual')}
                className={`relative z-10 px-6 py-2 rounded-lg text-xs font-heading font-black uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                  billingInterval === 'annual'
                    ? 'text-white'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {billingInterval === 'annual' && (
                  <motion.div
                    layoutId="billing-pill"
                    className="absolute inset-0 bg-comet-orange border border-neutral-950 rounded-lg -z-10 shadow"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                Annual
              </button>
            </div>

            {/* Discount Badge */}

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-comet-lime/15 border border-comet-lime/30 text-[9px] font-display font-black tracking-wider text-comet-lime uppercase shadow-sm"
            >
              Save ~20%
            </motion.div>
          </div>

          {/* Region / Currency Indicator & Manual Selector */}

          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <Globe size={13} className="text-comet-orange" />

            <span>Prices shown in</span>

            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);

                setIsManualCurrency(true);
              }}
              className="bg-neutral-950 border-2 border-neutral-850 hover:border-comet-orange text-neutral-200 rounded-xl px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-comet-orange focus:border-transparent transition-all cursor-pointer"
            >
              {Object.values(CURRENCY_CONFIGS).map((cfg) => (
                <option key={cfg.code} value={cfg.code} className="bg-neutral-950">
                  {cfg.code} ({cfg.symbol}) — {cfg.countryName}
                </option>
              ))}
            </select>

            {isGeoLoaded && !isManualCurrency && (
              <span className="text-[9px] uppercase font-display font-black bg-comet-lime/15 text-comet-lime px-2 py-0.5 rounded border border-comet-lime/10 shadow-sm animate-fade-in">
                Geo-detected
              </span>
            )}
          </div>
        </div>

        <PricingCards tiers={tiers} isLoading={isLoading} />

        <PricingComparison />

        <PricingFaq />

        {/* ── Final CTA ────────────────────────────────────────────────── */}

        <section className="mt-48 mb-20 text-center">
          <h2 className="text-4xl font-heading font-black mb-8 italic tracking-tighter uppercase text-white">
            Ready to join the orbit?
          </h2>

          <motion.div
            whileHover={isReduced ? {} : { scale: 1.02 }}
            whileTap={isReduced ? {} : { scale: 0.98 }}
            className="inline-block"
          >
            <Link
              href="/register"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-comet-orange hover:bg-comet-orange-hover text-white px-10 text-sm font-heading font-black uppercase tracking-wider border-2 border-neutral-950 shadow-[4px_4px_0px_0px_#000] hover:shadow-[5px_5px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
            >
              <span>Join Now</span>

              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="relative z-10 border-t-3 border-neutral-850 bg-[#070709] bg-halftone py-16 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top Section: Multi-Column Grid */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-neutral-900">
            {/* Column 1 & 2: Brand Pitch (Spans 2 columns) */}

            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-comet-orange border-2 border-neutral-950 shadow-[2px_2px_0px_0px_#000]">
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
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-comet-orange hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                  aria-label="GitHub Repository"
                >
                  <Users size={16} />
                </a>

                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-comet-orange hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                  aria-label="Community Server"
                >
                  <MessageSquare size={16} />
                </a>

                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-comet-orange hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
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
                  <Link href="/#features" className="hover:text-white transition-colors">
                    Performance Stats
                  </Link>
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
                  <Link href="/api-docs" className="hover:text-white transition-colors">
                    API Reference
                  </Link>
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
                  className="flex-1 bg-neutral-900 border-2 border-neutral-850 p-2.5 rounded-xl text-xs text-white placeholder-neutral-600 focus:border-comet-orange focus:ring-0 outline-none transition-colors"
                  aria-label="Email address for newsletter"
                />

                <button
                  type="submit"
                  className="bg-comet-orange hover:bg-comet-orange-hover text-white border-2 border-neutral-950 px-4 rounded-xl font-heading font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
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
