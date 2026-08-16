'use client';

import React, { useState, useRef, useEffect } from 'react';

import { useSession, signOut } from 'next-auth/react';

import { useReaderStore } from '@/stores/readerStore';

import type { ReaderMode } from '@/stores/readerStore';

import { useSubscription } from '@/hooks/useSubscription';

import NextImage from 'next/image';

import {
  Trash2,
  Smartphone,
  HardDrive,
  Monitor,
  BookOpen,
  RefreshCw,
  User,
  Camera,
  Loader2,
  Save,
  File,
  AlignRight,
  ChevronLeft,
  CreditCard,
  Sparkles,
  Download,
  Upload,
  Keyboard,
  LogOut,
} from 'lucide-react';

import Link from 'next/link';

import { logger } from '@/lib/logger';

import { useSettingsStore } from '@/stores/settingsStore';

import { AchievementsSection } from './AchievementsSection';

interface SettingsPanelProps {
  earnedBadgeIds?: string[];
}

import { CacheSettings } from './CacheSettings';

import { ProfileSection } from './ProfileSection';

import { ImportExportSection } from './ImportExportSection';

import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';

export function SettingsPanel({ earnedBadgeIds = [] }: SettingsPanelProps) {
  // User profile state

  const { data: session, update: updateSession } = useSession();

  const mode = useReaderStore((state) => state.mode);

  const setMode = useReaderStore((state) => state.setMode);

  const brightness = useReaderStore((state) => state.brightness);

  const setBrightness = useReaderStore((state) => state.setBrightness);

  // Client-side cache limit configuration

  // Backup / Import state

  // Keyboard cheat sheet active key highlight state

  const { handlePortal, isLoading: isSubscriptionLoading } = useSubscription();

  const saveReadingPreference = async (newMode: ReaderMode) => {
    setMode(newMode);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ defaultReadingMode: newMode }),
      });

      if (response.ok) {
        await updateSession({ defaultReadingMode: newMode });
      }
    } catch (error) {
      logger.error(
        'Failed to save reading preference:',

        {},

        error instanceof Error ? error : undefined,
      );
    }
  };

  const saveThemePreference = async (newTheme: string) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ theme: newTheme }),
      });

      if (response.ok) {
        await updateSession({ theme: newTheme });
      }
    } catch (error) {
      logger.error(
        'Failed to save theme preference:',

        {},

        error instanceof Error ? error : undefined,
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-24 text-comet-text transition-colors duration-300">
      <header className="flex items-center gap-6">
        <Link
          href="/library"
          className="p-4 bg-comet-surface border border-comet-border rounded-2xl hover:bg-comet-surface-2 transition-all text-comet-muted hover:text-comet-accent shadow-sm"
        >
          <ChevronLeft size={24} />
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-comet-text mb-1">Settings</h1>

          <p className="text-comet-muted">Manage your reading preferences and offline storage.</p>
        </div>
      </header>

      {/* User Profile Section */}

      <ProfileSection />

      {/* Reading Preferences */}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
          <BookOpen className="text-comet-muted" />
          Reading Preferences
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-comet-text mb-3">
              Default Reading Mode
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 'single-page', label: 'Single Page', icon: <File size={18} /> },

                { id: 'single-vertical', label: 'Vertical Scroll', icon: <Smartphone size={18} /> },

                { id: 'dual-spread', label: 'Dual Spread', icon: <Monitor size={18} /> },

                { id: 'manga-rtl', label: 'Manga (RTL)', icon: <AlignRight size={18} /> },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => saveReadingPreference(item.id as ReaderMode)}
                  className={`flex items-center gap-3 p-4 min-h-[44px] rounded-xl border transition-all ${
                    mode === item.id
                      ? 'border-comet-accent bg-comet-accent/10 text-comet-accent shadow-[0_0_10px_rgba(124,106,247,0.1)]'
                      : 'border-comet-border bg-comet-surface text-comet-muted hover:border-comet-accent hover:text-comet-text'
                  }`}
                >
                  {item.icon}

                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-comet-text mb-3">
              Brightness Filter
            </label>

            <div className="p-6 bg-comet-surface border border-comet-border rounded-2xl max-w-md">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full h-2 bg-comet-surface-2 rounded-lg appearance-none cursor-pointer accent-comet-accent"
                  aria-label="Screen brightness"
                />

                <span className="text-comet-text font-mono min-w-[3rem] text-right">
                  {Math.round(brightness * 100)}%
                </span>
              </div>

              <p className="text-xs text-comet-muted mt-4">
                Adjusts the brightness of the reader viewport.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-comet-text mb-3">App Theme</label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'dark', label: 'Dark', bg: 'bg-zinc-950', border: 'border-zinc-800' },

                { id: 'light', label: 'Light', bg: 'bg-white', border: 'border-zinc-200' },

                { id: 'sepia', label: 'Sepia', bg: 'bg-[#f4ecd8]', border: 'border-[#e0d6b8]' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => saveThemePreference(item.id)}
                  className={`flex items-center flex-col gap-3 p-4 rounded-xl border transition-all ${
                    session?.user?.theme === item.id || (!session?.user && item.id === 'dark')
                      ? 'border-comet-accent ring-2 ring-comet-accent/20'
                      : 'border-comet-border bg-comet-surface'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg ${item.bg} ${item.border} border`} />

                  <span className="font-medium text-comet-muted">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subscription & Billing */}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
          <CreditCard className="text-comet-muted" />
          Subscription & Billing
        </h2>

        <div className="bg-comet-surface border border-comet-border rounded-2xl p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-lg font-bold text-comet-text mb-1 flex items-center gap-2">
              Current Plan:{' '}
              <span className="text-comet-accent">{session?.user?.plan || 'FREE'}</span>
            </h3>

            <p className="text-comet-muted text-sm">
              {session?.user?.plan === 'PREMIUM'
                ? 'You are on the Premium tier with unlimited cloud sync, auto-enrichment, and ad-free reading.'
                : 'Cloud sync is included free. Upgrade to Premium for auto-enrichment, ad-free reading, and more.'}
            </p>
          </div>

          <div className="shrink-0">
            {session?.user?.plan === 'PREMIUM' ? (
              <button
                onClick={handlePortal}
                disabled={isSubscriptionLoading}
                className="flex items-center gap-2 bg-comet-surface-2 border border-comet-border text-comet-text px-6 py-3 rounded-xl hover:bg-comet-surface transition-all disabled:opacity-50"
              >
                {isSubscriptionLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <CreditCard size={18} />
                )}

                <span>Manage Billing</span>
              </button>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <Sparkles size={18} />

                <span className="font-bold">Upgrade Plan</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      <CacheSettings />

      {/* Achievements Section */}

      <AchievementsSection earnedBadgeIds={earnedBadgeIds} />

      {/* Data Backup & Restore */}

      <ImportExportSection />

      <KeyboardShortcutsSettings />

      {/* Mobile-only Log Out */}

      <section className="md:hidden pt-4 pb-12 border-t border-comet-border">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 active:scale-[0.98] transition-transform font-semibold min-h-[56px]"
        >
          <LogOut size={20} />
          Log Out
        </button>
      </section>
    </div>
  );
}
