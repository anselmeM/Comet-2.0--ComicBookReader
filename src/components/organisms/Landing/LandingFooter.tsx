'use client';

import Link from 'next/link';
import { Rocket, Users, MessageSquare, Target } from 'lucide-react';

/** Landing footer — brand, link columns, newsletter, legal + status. */
export const LandingFooter = () => {
  return (
    <footer className="relative z-10 border-t-3 border-neutral-850 bg-[#070709] bg-halftone py-16 text-xs text-neutral-500">
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Section: Multi-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12 border-b border-neutral-900">
          {/* Column 1 & 2: Brand Pitch (Spans 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff5a00] border-2 border-neutral-950 shadow-[2px_2px_0px_0px_#000]">
                <Rocket className="text-white" size={16} aria-hidden="true" />
              </div>
              <span className="text-lg font-heading font-black uppercase italic text-white tracking-tight">
                Comet
              </span>
            </div>
            <p className="text-neutral-400 font-medium leading-relaxed max-w-sm">
              The Speed of Light Comic Reader. Instantly decompress, segment, and catalog your comic
              book archive entirely client-side. Built for speed and privacy.
            </p>

            {/* Mock Social Badges */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-[#ff5a00] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                aria-label="GitHub Repository"
              >
                <Users size={16} />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-[#ff5a00] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
                aria-label="Community Server"
              >
                <MessageSquare size={16} />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 border-2 border-neutral-850 text-neutral-400 hover:text-white hover:border-[#ff5a00] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all"
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
                <a href="#features" className="hover:text-white transition-colors">
                  Performance Stats
                </a>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition-colors">
                  Preferences
                </Link>
              </li>
              <li>
                <Link href="/settings/achievements" className="hover:text-white transition-colors">
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
                <a href="/api-docs" className="hover:text-white transition-colors">
                  API Reference
                </a>
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
                className="flex-1 bg-neutral-900 border-2 border-neutral-850 p-2.5 rounded-xl text-xs text-white placeholder-neutral-600 focus:border-[#ff5a00] focus:ring-0 outline-none transition-colors"
                aria-label="Email address for newsletter"
              />
              <button
                type="submit"
                className="bg-[#ff5a00] hover:bg-[#e65100] text-white border-2 border-neutral-950 px-4 rounded-xl font-heading font-black text-[10px] uppercase tracking-wider shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
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
  );
};
