'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

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
        console.error('Failed to detect country locale:', error);
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
        'Cloud Comic Sync (S3/R2)',
        'Automatic Metadata Enrichment',
        'Cross-device File Restoration',
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
    <div className="relative min-h-screen overflow-hidden bg-comet-bg text-comet-text font-comet-text">
      {/* ── Background Elements ─────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      {/* ── Navigation (Simple) ─────────────────────────────────────────── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-8 md:px-12 lg:px-24">
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-comet-accent shadow-[0_0_20px_rgba(124,106,247,0.4)] transition-transform group-hover:scale-105">
            <Rocket className="text-white" size={20} aria-hidden="true" />
          </div>
          <span className="text-xl font-bold tracking-tight">Comet</span>
        </Link>
        <Link
          href={session ? '/library' : '/login'}
          className="text-sm font-semibold hover:text-comet-accent transition-colors"
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
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-comet-accent/30 bg-comet-accent/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-comet-accent uppercase"
          >
            <Sparkles size={14} aria-hidden="true" />
            Simple Pricing. No Hidden Missions.
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="mb-6 text-5xl font-black leading-tight tracking-tighter md:text-7xl italic"
          >
            Choose Your <br />
            <span className="bg-gradient-to-r from-comet-accent via-blue-400 to-comet-accent bg-clip-text text-transparent">
              Dimension.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeIn}
            className="mx-auto max-w-2xl text-lg text-comet-muted md:text-xl font-medium animate-fade-in"
          >
            Whether you&apos;re a local hero or a galactic explorer, we have a plan built for your
            reading speed.
          </motion.p>
        </motion.div>

        {/* ── Billing Cycle & Localized Currency Selectors ────────────────── */}
        <div className="flex flex-col items-center gap-6 mb-16 z-20">
          <div className="relative flex items-center justify-center gap-4">
            {/* Toggle Switch */}
            <div className="relative flex p-1 rounded-full bg-comet-surface border border-comet-border shadow-inner">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`relative z-10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                  billingInterval === 'monthly'
                    ? 'text-white font-extrabold'
                    : 'text-comet-muted hover:text-comet-text'
                }`}
              >
                {billingInterval === 'monthly' && (
                  <motion.div
                    layoutId="billing-pill"
                    className="absolute inset-0 bg-comet-accent rounded-full -z-10 shadow-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`relative z-10 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${
                  billingInterval === 'annual'
                    ? 'text-white font-extrabold'
                    : 'text-comet-muted hover:text-comet-text'
                }`}
              >
                {billingInterval === 'annual' && (
                  <motion.div
                    layoutId="billing-pill"
                    className="absolute inset-0 bg-comet-accent rounded-full -z-10 shadow-lg"
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
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase shadow-sm animate-pulse"
            >
              Save ~20%
            </motion.div>
          </div>

          {/* Region / Currency Indicator & Manual Selector */}
          <div className="flex items-center gap-2 text-xs font-medium text-comet-muted">
            <Globe size={13} className="text-comet-accent" />
            <span>Prices shown in</span>
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setIsManualCurrency(true);
              }}
              className="bg-comet-surface border border-comet-border text-comet-text rounded px-2.5 py-1 text-xs font-bold focus:border-comet-accent focus:ring-1 focus:ring-comet-accent outline-none cursor-pointer transition-all"
            >
              {Object.values(CURRENCY_CONFIGS).map((cfg) => (
                <option key={cfg.code} value={cfg.code}>
                  {cfg.code} ({cfg.symbol}) — {cfg.countryName}
                </option>
              ))}
            </select>
            {isGeoLoaded && !isManualCurrency && (
              <span className="text-[10px] uppercase font-black bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/10 shadow-sm animate-fade-in">
                Geo-detected
              </span>
            )}
          </div>
        </div>

        {/* ── Pricing Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative flex flex-col p-10 rounded-[3rem] border-2 transition-all ${
                tier.highlight
                  ? 'bg-comet-surface border-comet-accent shadow-[0_20px_50px_rgba(124,106,247,0.15)] scale-105 z-20'
                  : 'bg-comet-surface/40 border-comet-border backdrop-blur-xl z-10'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-comet-accent text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black italic mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                  {tier.period && <span className="text-comet-muted font-bold">{tier.period}</span>}
                </div>
                {tier.billedAnnually && (
                  <div className="text-xs text-emerald-400 font-extrabold mt-2 uppercase tracking-wide">
                    {tier.billedAnnually}
                  </div>
                )}
                <p className="mt-4 text-comet-muted font-medium leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tier.highlight ? 'bg-comet-accent text-white' : 'bg-comet-surface text-comet-muted border border-comet-border/50'}`}
                    >
                      <Check size={12} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-semibold">{feature}</span>
                  </div>
                ))}
              </div>

              {tier.action ? (
                <button
                  onClick={tier.action}
                  disabled={isLoading || tier.disabled}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${
                    tier.highlight
                      ? 'bg-comet-accent text-white hover:bg-comet-accent-hover shadow-comet-accent/20 disabled:bg-comet-accent/50 disabled:scale-100 disabled:pointer-events-none'
                      : 'bg-comet-text text-comet-bg hover:opacity-90 shadow-sm disabled:bg-comet-surface disabled:text-comet-muted disabled:scale-100 disabled:pointer-events-none'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin text-current" size={18} />
                      Processing...
                    </>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              ) : tier.disabled ? (
                <button
                  disabled
                  className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-comet-surface text-comet-muted border border-comet-border shadow-inner flex items-center justify-center gap-3 cursor-not-allowed"
                >
                  {tier.cta}
                  <Check size={18} />
                </button>
              ) : (
                <Link
                  href={tier.href}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl text-center flex items-center justify-center gap-3 ${
                    tier.highlight
                      ? 'bg-comet-accent text-white hover:bg-comet-accent-hover shadow-comet-accent/20'
                      : 'bg-comet-text text-comet-bg hover:opacity-90 shadow-sm'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight size={18} />
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Feature Comparison (Table) ───────────────────────────────── */}
        <section className="mt-48 w-full max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic">
              Deep Space Comparison
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-comet-border">
                  <th className="py-6 px-4 text-sm font-black uppercase tracking-widest text-comet-muted">
                    Feature
                  </th>
                  <th className="py-6 px-4 text-sm font-black uppercase tracking-widest text-center">
                    Free
                  </th>
                  <th className="py-6 px-4 text-sm font-black uppercase tracking-widest text-center text-comet-accent">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="font-medium">
                <ComparisonRow label="Local Library Storage" free="Unlimited" premium="Unlimited" />
                <ComparisonRow label="Cloud Sync (S3/R2)" free="No" premium="Yes" />
                <ComparisonRow label="Reading Progress Sync" free="Yes" premium="Yes" />
                <ComparisonRow label="Manual Metadata Editor" free="Yes" premium="Yes" />
                <ComparisonRow
                  label="Automatic Enrichment"
                  free="Manual Trigger"
                  premium="Unlimited Auto"
                />
                <ComparisonRow
                  label="Multiple Devices"
                  free="Restricted Sync"
                  premium="Seamless Sync"
                />
                <ComparisonRow label="Advertisements" free="Yes" premium="None" />
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FAQ Section ─────────────────────────────────────────────── */}
        <section className="mt-48 w-full max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic">
              Common Questions
            </h2>
          </div>
          <div className="space-y-8">
            <FAQItem
              question="What happens to my comics if I cancel Premium?"
              answer="Your comics stay in your local library! You'll only lose access to the cloud backup and automatic syncing features. Any comics already synced to the cloud will remain there for 30 days before being purged."
            />
            <FAQItem
              question="How secure is the Cloud Sync?"
              answer="Comet uses industry-standard AES-256 encryption for files at rest and secure SSL/TLS for all data transfers. We never share your library data with third parties."
            />
            <FAQItem
              question="Can I upgrade from Free later?"
              answer="Absolutely. You can upgrade or downgrade at any time through your account settings. All your reading progress and metadata will be preserved regardless of your tier."
            />
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="mt-48 mb-20 text-center">
          <h2 className="text-4xl font-black mb-8 italic tracking-tighter">
            Ready to join the orbit?
          </h2>
          <Link
            href="/register"
            className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-comet-accent text-white px-10 text-lg font-black uppercase tracking-widest shadow-2xl transition-all hover:bg-comet-accent-hover"
          >
            Join Now
          </Link>
        </section>
      </main>

      <footer className="relative z-10 border-t border-comet-border bg-comet-surface/20 py-12 text-center text-sm text-comet-muted">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-comet-accent/20 border border-comet-accent/30">
              <Rocket className="text-comet-accent" size={16} aria-hidden="true" />
            </div>
            <span className="text-lg font-bold text-comet-text">Comet</span>
          </div>
          <p>&copy; 2026 Comet — The Speed of Light Comic Reader.</p>
        </div>
      </footer>
    </div>
  );
}

function ComparisonRow({ label, free, premium }: { label: string; free: string; premium: string }) {
  return (
    <tr className="border-b border-comet-border/50 hover:bg-comet-surface/30 transition-colors">
      <td className="py-5 px-4 text-sm font-semibold">{label}</td>
      <td className="py-5 px-4 text-sm text-center text-comet-muted">{free}</td>
      <td className="py-5 px-4 text-sm text-center font-bold text-comet-text">{premium}</td>
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-comet-surface/40 border border-comet-border">
      <h4 className="text-lg font-bold mb-4 text-comet-text">{question}</h4>
      <p className="text-comet-muted leading-relaxed">{answer}</p>
    </div>
  );
}
