"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { Zap, Rocket, Check, ArrowRight, Shield, Cloud, Sparkles, Globe, Laptop, Smartphone } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

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

export default function PricingPage() {
  const { data: session } = useSession();
  const shouldReduceMotion = useReducedMotion();
  const isReduced = !!shouldReduceMotion;
  const { handleCheckout, isLoading } = useSubscription();

  const tiers = [
    {
      name: "Free Reader",
      price: "$0",
      description: "Perfect for casual readers managing a local collection.",
      features: [
        "Unlimited Local Storage (IndexedDB)",
        "Reading Progress Synchronization",
        "Manual Metadata Editing",
        "Basic Search & Filtering",
        "Ad-supported experience",
      ],
      cta: session ? "Current Plan" : "Get Started",
      href: "/register",
      highlight: false,
    },
    {
      name: "Cloud Voyager",
      price: "$9.99",
      period: "/month",
      description: "For the serious collector who reads everywhere.",
      features: [
        "Everything in Free",
        "Cloud Comic Sync (S3/R2)",
        "Automatic Metadata Enrichment",
        "Cross-device File Restoration",
        "Early Access to Guided View",
        "Ad-free Experience",
        "Priority Support",
      ],
      cta: session?.user?.plan === 'PREMIUM' ? "Manage Plan" : "Upgrade to Premium",
      action: session?.user?.plan === 'PREMIUM' ? null : handleCheckout,
      href: "/register",
      highlight: true,
    }
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
        <Link href={session ? "/library" : "/login"} className="text-sm font-semibold hover:text-comet-accent transition-colors">
          {session ? "Back to Library" : "Log in"}
        </Link>
      </nav>

      {/* ── Pricing Hero ───────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center px-6 pt-20 pb-32 md:px-12 lg:px-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="text-center mb-20"
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
            className="mx-auto max-w-2xl text-lg text-comet-muted md:text-xl font-medium"
          >
            Whether you&apos;re a local hero or a galactic explorer, we have a plan built for your reading speed.
          </motion.p>
        </motion.div>

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
                  ? 'bg-neutral-900 border-comet-accent shadow-[0_20px_50px_rgba(124,106,247,0.15)] scale-105 z-20' 
                  : 'bg-neutral-900/40 border-neutral-900 backdrop-blur-xl z-10'
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
                <p className="mt-4 text-comet-muted font-medium leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tier.highlight ? 'bg-comet-accent text-white' : 'bg-neutral-800 text-comet-muted'}`}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                    <span className="text-sm font-semibold">{feature}</span>
                  </div>
                ))}
              </div>

              {tier.action ? (
                <button
                  onClick={tier.action}
                  disabled={isLoading}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 ${
                    tier.highlight 
                      ? 'bg-comet-accent text-white hover:bg-comet-accent-hover shadow-comet-accent/20' 
                      : 'bg-white text-black hover:bg-neutral-100 shadow-white/5'
                  }`}
                >
                  {isLoading ? "Processing..." : tier.cta}
                  <ArrowRight size={18} />
                </button>
              ) : (
                <Link
                  href={tier.href}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl text-center flex items-center justify-center gap-3 ${
                    tier.highlight 
                      ? 'bg-comet-accent text-white hover:bg-comet-accent-hover shadow-comet-accent/20' 
                      : 'bg-white text-black hover:bg-neutral-100 shadow-white/5'
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
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic">Deep Space Comparison</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="py-6 px-4 text-sm font-black uppercase tracking-widest text-comet-muted">Feature</th>
                  <th className="py-6 px-4 text-sm font-black uppercase tracking-widest text-center">Free</th>
                  <th className="py-6 px-4 text-sm font-black uppercase tracking-widest text-center text-comet-accent">Premium</th>
                </tr>
              </thead>
              <tbody className="font-medium">
                <ComparisonRow label="Local Library Storage" free="Unlimited" premium="Unlimited" />
                <ComparisonRow label="Cloud Sync (S3/R2)" free="No" premium="Yes" />
                <ComparisonRow label="Reading Progress Sync" free="Yes" premium="Yes" />
                <ComparisonRow label="Manual Metadata Editor" free="Yes" premium="Yes" />
                <ComparisonRow label="Automatic Enrichment" free="Manual Trigger" premium="Unlimited Auto" />
                <ComparisonRow label="Guided View Tech" free="Standard" premium="Early Access" />
                <ComparisonRow label="Multiple Devices" free="Restricted Sync" premium="Seamless Sync" />
                <ComparisonRow label="Advertisements" free="Yes" premium="None" />
              </tbody>
            </table>
          </div>
        </section>

        {/* ── FAQ Section ─────────────────────────────────────────────── */}
        <section className="mt-48 w-full max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter italic">Common Questions</h2>
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
          <h2 className="text-4xl font-black mb-8 italic tracking-tighter">Ready to join the orbit?</h2>
          <Link href="/register" className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-comet-accent text-white px-10 text-lg font-black uppercase tracking-widest shadow-2xl transition-all hover:bg-comet-accent-hover">
            Join Now
          </Link>
        </section>
      </main>

      <footer className="relative z-10 border-t border-neutral-900 bg-neutral-900/20 py-12 text-center text-sm text-comet-muted">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-comet-accent/20 border border-comet-accent/30">
                <Rocket className="text-comet-accent" size={16} aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-white">Comet</span>
            </div>
            <p>&copy; 2026 Comet — The Speed of Light Comic Reader.</p>
        </div>
      </footer>
    </div>
  );
}

function ComparisonRow({ label, free, premium }: { label: string, free: string, premium: string }) {
  return (
    <tr className="border-b border-neutral-900/50 hover:bg-white/5 transition-colors">
      <td className="py-5 px-4 text-sm font-semibold">{label}</td>
      <td className="py-5 px-4 text-sm text-center text-comet-muted">{free}</td>
      <td className="py-5 px-4 text-sm text-center font-bold text-white">{premium}</td>
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-neutral-900/40 border border-neutral-900">
      <h4 className="text-lg font-bold mb-4 text-white">{question}</h4>
      <p className="text-comet-muted leading-relaxed">{answer}</p>
    </div>
  );
}
