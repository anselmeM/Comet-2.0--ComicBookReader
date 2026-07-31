'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useStorage } from '@/hooks/useStorage';
import { evictCachedComic } from '@/lib/idb';
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

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface SettingsPanelProps {
  earnedBadgeIds?: string[];
}

export function SettingsPanel({ earnedBadgeIds = [] }: SettingsPanelProps) {
  // User profile state
  const { data: session, update: updateSession } = useSession();
  const { info, clearCache, refresh } = useStorage(session?.user?.id);
  const mode = useReaderStore((state) => state.mode);
  const setMode = useReaderStore((state) => state.setMode);
  const brightness = useReaderStore((state) => state.brightness);
  const setBrightness = useReaderStore((state) => state.setBrightness);

  // Client-side cache limit configuration
  const cacheLimitGB = useSettingsStore((state) => state.cacheLimitGB);
  const setCacheLimitGB = useSettingsStore((state) => state.setCacheLimitGB);

  // Backup / Import state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Keyboard cheat sheet active key highlight state
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null);

  const shortcuts = [
    {
      key: 'Page Navigation',
      keys: ['Space', '◀', '▶', 'a', 'A', 'd', 'D', 'ArrowRight', 'ArrowLeft'],
      label: 'Page Turns',
      desc: 'Space / ArrowRight / D to go forward; ArrowLeft / A to go backward.',
    },
    {
      key: 'Fullscreen Toggle',
      keys: ['F', 'f'],
      label: 'Fullscreen Toggle',
      desc: 'F key toggles the PWA fullscreen view.',
    },
    {
      key: 'Bookmarks Toggle',
      keys: ['B', 'b'],
      label: 'Toggle Bookmark',
      desc: 'B key bookmarks/unbookmarks current page.',
    },
    {
      key: 'Zoom Controls',
      keys: ['+', '-', '0', '='],
      label: 'Zoom Controls',
      desc: '+ / - to zoom in/out, 0 to reset zoom.',
    },
  ];

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/user/backup');
      if (!res.ok) throw new Error('Failed to fetch backup from server');

      const serverData = await res.json();

      // Bundle local Zustand storage settings
      const readerStorage =
        typeof window !== 'undefined' ? localStorage.getItem('comet-reader-storage') : null;
      const settingsStorage =
        typeof window !== 'undefined' ? localStorage.getItem('comet-settings-storage') : null;

      const fullBackup = {
        ...serverData,
        clientSettings: {
          reader: readerStorage ? JSON.parse(readerStorage)?.state : null,
          settings: settingsStorage ? JSON.parse(settingsStorage)?.state : null,
        },
      };

      const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comet-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      logger.error('Export backup error:', {}, e instanceof Error ? e : undefined);
      alert(e instanceof Error ? e.message : 'Error exporting backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        'Are you sure you want to import this backup? This will overwrite your settings, streaks, and reading history.',
      )
    ) {
      if (backupInputRef.current) backupInputRef.current.value = '';
      return;
    }

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 1. Restore client-side settings if present
      if (data.clientSettings) {
        if (data.clientSettings.settings) {
          localStorage.setItem(
            'comet-settings-storage',
            JSON.stringify({ state: data.clientSettings.settings, version: 0 }),
          );
        }
        if (data.clientSettings.reader) {
          localStorage.setItem(
            'comet-reader-storage',
            JSON.stringify({ state: data.clientSettings.reader, version: 0 }),
          );
        }
      }

      // 2. Upload to server to restore DB settings, streaks, reading history, and metadata
      const response = await fetch('/api/user/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Failed to upload backup to server');
      }

      const result = await response.json();
      alert(
        `Backup imported successfully! Restored settings and updated progress for ${result.comicsRestoredCount} comics.`,
      );

      // Force reload to apply all client and server settings
      window.location.reload();
    } catch (err) {
      logger.error('Import backup error:', {}, err instanceof Error ? err : undefined);
      alert(err instanceof Error ? err.message : 'Failed to import backup file');
    } finally {
      setIsImporting(false);
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  const { handlePortal, isLoading: isSubscriptionLoading } = useSubscription();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync name when session loads
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;

        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
        });

        if (response.ok) {
          await updateSession();
        } else {
          alert('Failed to update profile image');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logger.error('Upload error:', {}, error instanceof Error ? error : undefined);
      setIsUploading(false);
      alert('Failed to upload image');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        await updateSession({ name });
        alert('Profile updated!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      logger.error('Update error:', {}, error instanceof Error ? error : undefined);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleClear = async () => {
    if (
      confirm(
        'Are you sure you want to clear your local comic cache? You will need to re-download or re-parse comics to read them offline.',
      )
    ) {
      await clearCache();
      alert('Cache cleared!');
    }
  };

  const handleEvictSingle = async (comicId: string) => {
    if (confirm('Remove this comic from local storage?')) {
      await evictCachedComic(comicId, session?.user?.id);
      await refresh();
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
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
          <User className="text-comet-muted" />
          Profile
        </h2>

        <div className="p-6 bg-comet-surface border border-comet-border rounded-2xl space-y-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              {session?.user?.image ? (
                <NextImage
                  src={session.user.image}
                  alt={name || session.user.name || 'User'}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-2 border-comet-border"
                  unoptimized
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-2 border-comet-border">
                  {(name || session?.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 bg-comet-accent rounded-full text-white hover:bg-comet-accent-hover transition-colors disabled:opacity-50"
                title="Change profile picture"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg font-semibold text-comet-text">
                {name || session?.user?.name || 'User'}
              </h3>
              <p className="text-comet-muted text-sm">{session?.user?.email}</p>
            </div>
          </div>

          <form
            onSubmit={handleProfileUpdate}
            className="space-y-4 pt-4 border-t border-comet-border"
          >
            <div className="space-y-2">
              <label htmlFor="display-name" className="block text-sm font-medium text-comet-text">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  id="display-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-comet-surface-2 border border-comet-border rounded-xl px-4 py-3 min-h-[44px] text-comet-text focus:outline-none focus:ring-2 focus:ring-comet-accent"
                  placeholder="Enter your name"
                />
                <button
                  type="submit"
                  disabled={isSaving || name === session?.user?.name}
                  className="flex items-center gap-2 bg-comet-accent text-white px-4 py-3 min-h-[44px] rounded-xl hover:bg-comet-accent-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>Save</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

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
              <span className="text-comet-accent">{(session?.user as any)?.plan || 'FREE'}</span>
            </h3>
            <p className="text-comet-muted text-sm">
              {(session?.user as any)?.plan === 'PREMIUM'
                ? 'You are on the Premium tier with unlimited cloud sync, auto-enrichment, and ad-free reading.'
                : 'Cloud sync is included free. Upgrade to Premium for auto-enrichment, ad-free reading, and more.'}
            </p>
          </div>

          <div className="shrink-0">
            {(session?.user as any)?.plan === 'PREMIUM' ? (
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

      {/* Storage Management */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
          <HardDrive className="text-comet-muted" />
          Offline Storage
        </h2>

        <div className="bg-comet-surface border border-comet-border rounded-2xl p-8 shadow-inner overflow-hidden relative">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-comet-text">Local Library Cache</h3>
              <p className="text-comet-muted text-sm max-w-lg">
                Comics you open are parsed and stored locally for instant, offline access.
              </p>
            </div>

            <button
              onClick={handleClear}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all shrink-0 font-semibold"
            >
              <Trash2 size={20} />
              <span>Clear Cache</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-comet-muted text-xs font-bold uppercase tracking-wider">
                  Used Space
                </span>
                <div className="text-3xl font-black text-comet-text">
                  {info.loading ? '...' : formatBytes(info.idbCustomUsage)}
                </div>
              </div>

              {/* Storage Health */}
              {(() => {
                const limitBytes = cacheLimitGB * 1024 * 1024 * 1024;
                const isNearLimit = info.idbCustomUsage / limitBytes > 0.8;
                return (
                  <div className="text-right space-y-1">
                    <span className="text-comet-muted text-xs font-bold uppercase tracking-wider text-right block">
                      Storage Health
                    </span>
                    <div
                      className={`text-sm font-bold flex items-center gap-2 ${
                        isNearLimit ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          isNearLimit
                            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                        }`}
                      />
                      {isNearLimit ? 'Near Capacity' : 'Healthy'}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Progress Bar Container */}
            {(() => {
              const limitBytes = cacheLimitGB * 1024 * 1024 * 1024;
              const usagePercent = Math.min(100, (info.idbCustomUsage / limitBytes) * 100);
              const isNearLimit = usagePercent > 80;
              return (
                <>
                  <div className="relative w-full h-4 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isNearLimit
                          ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-comet-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      }`}
                      style={{
                        width: `${Math.max(2, usagePercent)}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs text-comet-muted">
                    <span>
                      Limit: {formatBytes(limitBytes)} (Browser Quota:{' '}
                      {info.quota > 0 ? formatBytes(info.quota) : 'Unlimited'})
                    </span>
                    <div className="flex items-center gap-3">
                      <span>* Estimated usage for parsed pages.</span>
                      <button
                        onClick={refresh}
                        className="text-comet-accent hover:text-comet-text transition-colors flex items-center gap-1 font-bold"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Cache Limit Slider */}
            <div className="mt-6 pt-6 border-t border-comet-border space-y-4">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="cache-limit-slider"
                  className="text-sm font-semibold text-comet-text"
                >
                  Auto-Cache Budget
                </label>
                <span className="text-comet-text font-mono font-bold text-sm bg-comet-surface-2 px-3 py-1 rounded-lg border border-comet-border">
                  {cacheLimitGB.toFixed(1)} GB
                </span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  id="cache-limit-slider"
                  type="range"
                  min="0.5"
                  max="10.0"
                  step="0.5"
                  value={cacheLimitGB}
                  onChange={(e) => setCacheLimitGB(parseFloat(e.target.value))}
                  className="w-full h-2 bg-comet-surface-2 rounded-lg appearance-none cursor-pointer accent-comet-accent"
                />
              </div>
              <p className="text-xs text-comet-muted leading-relaxed">
                Comet will automatically evict the least recently read comics when cached comic
                files exceed this limit to keep your local storage clean.
              </p>
            </div>

            {/* Individual Comic Storage List */}
            {info.cachedComics && info.cachedComics.length > 0 && (
              <div className="mt-8 pt-6 border-t border-comet-border">
                <h4 className="text-sm font-semibold text-comet-muted uppercase tracking-wider mb-4">
                  Downloaded Comics
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {info.cachedComics
                    .sort((a, b) => b.sizeBytes - a.sizeBytes)
                    .map((comic) => (
                      <div
                        key={comic.comicId}
                        className="flex items-center justify-between p-3 bg-comet-surface/50 border border-comet-border rounded-xl hover:bg-comet-surface-2 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {comic.coverUrl ? (
                            <div className="w-10 h-14 rounded bg-comet-surface-2 overflow-hidden shrink-0 border border-comet-border">
                              <img
                                src={comic.coverUrl}
                                alt="Cover"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 rounded bg-comet-surface-2 flex items-center justify-center shrink-0 border border-comet-border">
                              <BookOpen size={16} className="text-comet-muted" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-comet-text truncate w-full">
                              {comic.title || 'Unknown Title'}
                            </p>
                            <p className="text-xs text-comet-muted font-mono">
                              {formatBytes(comic.sizeBytes)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEvictSingle(comic.comicId)}
                          className="p-2 text-comet-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0 ml-4"
                          title="Remove from device"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <AchievementsSection earnedBadgeIds={earnedBadgeIds} />

      {/* Data Backup & Restore */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
          <Download className="text-comet-muted" />
          Backup & Portability
        </h2>

        <div className="bg-comet-surface border border-comet-border rounded-2xl p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-comet-text mb-2">Import / Export Local Data</h3>
            <p className="text-comet-muted text-sm max-w-xl leading-relaxed">
              Backup your entire reading history, streaks, bookmarks, custom metadata, and reader
              configurations. Save the portable JSON file on your computer to restore your state
              anytime or migrate to a new device.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={handleExportBackup}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-comet-surface-2 hover:bg-comet-surface border border-comet-border text-comet-text rounded-xl active:scale-95 transition-all font-medium disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Export Portable JSON</span>
            </button>

            <button
              onClick={() => backupInputRef.current?.click()}
              disabled={isImporting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-comet-accent hover:bg-comet-accent-hover text-white rounded-xl active:scale-95 transition-all font-medium disabled:opacity-50 cursor-pointer"
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span>Import Portable JSON</span>
            </button>
            <input
              type="file"
              ref={backupInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Cheat Sheet */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
          <Keyboard className="text-comet-muted" />
          Interactive Keyboard Cheat Sheet
        </h2>

        <div className="bg-comet-surface border border-comet-border rounded-2xl p-8 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-comet-text mb-2">Desktop Shortcuts</h3>
            <p className="text-comet-muted text-sm">
              Hover over a keycap on the mockup to view its associated reading action, or hover over
              an action list item to see the keycaps light up.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Visual Keyboard Mockup */}
            <div className="w-full lg:w-3/5 bg-comet-surface-2 border border-comet-border rounded-2xl p-6 shadow-2xl overflow-x-auto custom-scrollbar flex flex-col gap-2 min-w-[500px]">
              {(() => {
                const keyboardRows = [
                  [
                    { label: 'Esc', width: 'w-10' },
                    { label: '1' },
                    { label: '2' },
                    { label: '3' },
                    { label: '4' },
                    { label: '5' },
                    { label: '6' },
                    { label: '7' },
                    { label: '8' },
                    { label: '9' },
                    { label: '0' },
                    { label: '-' },
                    { label: '+' },
                    { label: 'Del', width: 'w-10' },
                  ],
                  [
                    { label: 'Tab', width: 'w-10' },
                    { label: 'Q' },
                    { label: 'W' },
                    { label: 'E' },
                    { label: 'R' },
                    { label: 'T' },
                    { label: 'Y' },
                    { label: 'U' },
                    { label: 'I' },
                    { label: 'O' },
                    { label: 'P' },
                    { label: '[' },
                    { label: ']' },
                    { label: '\\', width: 'w-10' },
                  ],
                  [
                    { label: 'Caps', width: 'w-12' },
                    { label: 'A' },
                    { label: 'S' },
                    { label: 'D' },
                    { label: 'F' },
                    { label: 'G' },
                    { label: 'H' },
                    { label: 'J' },
                    { label: 'K' },
                    { label: 'L' },
                    { label: ';' },
                    { label: "'" },
                    { label: 'Enter', width: 'w-12' },
                  ],
                  [
                    { label: 'Shift', width: 'w-16' },
                    { label: 'Z' },
                    { label: 'X' },
                    { label: 'C' },
                    { label: 'V' },
                    { label: 'B' },
                    { label: 'N' },
                    { label: 'M' },
                    { label: ',' },
                    { label: '.' },
                    { label: '/' },
                    { label: '▲', width: 'w-9' },
                  ],
                  [
                    { label: 'Ctrl', width: 'w-9' },
                    { label: 'Opt', width: 'w-9' },
                    { label: 'Cmd', width: 'w-9' },
                    { label: 'Space', width: 'w-36' },
                    { label: '◀', width: 'w-9' },
                    { label: '▼', width: 'w-9' },
                    { label: '▶', width: 'w-9' },
                  ],
                ];

                return keyboardRows.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex justify-start gap-1">
                    {row.map((key) => {
                      const widthClass = key.width || 'w-9';
                      const keyLabel = key.label;

                      // Highlight key if it belongs to activeShortcut
                      let isHighlighted = false;
                      if (activeShortcut) {
                        const activeItem = shortcuts.find((s) => s.key === activeShortcut);
                        if (activeItem?.keys.includes(keyLabel)) {
                          isHighlighted = true;
                        }
                      }

                      return (
                        <div
                          key={keyLabel}
                          onMouseEnter={() => {
                            const found = shortcuts.find((s) => s.keys.includes(keyLabel));
                            if (found) {
                              setActiveShortcut(found.key);
                            }
                          }}
                          onMouseLeave={() => setActiveShortcut(null)}
                          className={`h-9 flex items-center justify-center rounded-md border font-mono text-[10px] select-none transition-all duration-200 cursor-pointer ${widthClass} ${
                            isHighlighted
                              ? 'bg-comet-accent/25 border-comet-accent text-comet-accent shadow-[0_0_12px_rgba(124,106,247,0.5)] scale-105 z-10'
                              : 'bg-comet-surface border-comet-border text-comet-muted hover:border-comet-accent hover:text-comet-text hover:bg-comet-surface-2'
                          }`}
                        >
                          {keyLabel}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>

            {/* Shortcut Descriptions List */}
            <div className="w-full lg:w-2/5 space-y-3">
              {shortcuts.map((shortcut) => {
                const isActive = activeShortcut === shortcut.key;
                return (
                  <div
                    key={shortcut.key}
                    onMouseEnter={() => setActiveShortcut(shortcut.key)}
                    onMouseLeave={() => setActiveShortcut(null)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-comet-accent/5 border-comet-accent/30 shadow-[0_0_15px_rgba(124,106,247,0.05)]'
                        : 'bg-comet-surface/50 border-comet-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-comet-accent' : 'text-comet-text'}`}
                      >
                        {shortcut.label}
                      </span>
                      <div className="flex gap-1">
                        {shortcut.keys
                          .filter((k) => k.length <= 5)
                          .map((k) => (
                            <kbd
                              key={k}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                isActive
                                  ? 'bg-comet-accent/20 border-comet-accent/40 text-comet-accent'
                                  : 'bg-comet-surface-2 border-comet-border text-comet-muted'
                              }`}
                            >
                              {k}
                            </kbd>
                          ))}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-450 leading-relaxed">{shortcut.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
