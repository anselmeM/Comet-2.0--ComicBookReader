'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function SettingsPanel() {
  const { info, clearCache, refresh } = useStorage();
  const mode = useReaderStore((state) => state.mode);
  const setMode = useReaderStore((state) => state.setMode);
  const brightness = useReaderStore((state) => state.brightness);
  const setBrightness = useReaderStore((state) => state.setBrightness);

  // User profile state
  const { data: session, update: updateSession } = useSession();
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
        await updateSession();
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
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultReadingMode: newMode }),
      });
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
        await updateSession();
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
    <div className="max-w-4xl mx-auto p-6 space-y-12 pb-24 text-comet-text">
      <header className="flex items-center gap-6">
        <Link
          href="/library"
          className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl hover:bg-neutral-800 transition-all text-neutral-400 hover:text-blue-500 shadow-sm"
        >
          <ChevronLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-neutral-400">Manage your reading preferences and offline storage.</p>
        </div>
      </header>

      {/* User Profile Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
          <User className="text-neutral-400" />
          Profile
        </h2>

        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              {session?.user?.image ? (
                <NextImage
                  src={session.user.image}
                  alt={name || session.user.name || 'User'}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-2 border-neutral-700"
                  unoptimized
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-2 border-neutral-700">
                  {(name || session?.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
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
              <h3 className="text-lg font-semibold text-white">
                {name || session?.user?.name || 'User'}
              </h3>
              <p className="text-neutral-400 text-sm">{session?.user?.email}</p>
            </div>
          </div>

          <form
            onSubmit={handleProfileUpdate}
            className="space-y-4 pt-4 border-t border-neutral-800"
          >
            <div className="space-y-2">
              <label htmlFor="display-name" className="block text-sm font-medium text-neutral-300">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  id="display-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                />
                <button
                  type="submit"
                  disabled={isSaving || name === session?.user?.name}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
          <BookOpen className="text-neutral-400" />
          Reading Preferences
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">
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
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    mode === item.id
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              Brightness Filter
            </label>
            <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  aria-label="Screen brightness"
                />
                <span className="text-white font-mono min-w-[3rem] text-right">
                  {Math.round(brightness * 100)}%
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-4">
                Adjusts the brightness of the reader viewport.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">App Theme</label>
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
                    (session?.user as any)?.theme === item.id ||
                    (!session?.user && item.id === 'dark')
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-neutral-800 bg-neutral-900'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg ${item.bg} ${item.border} border`} />
                  <span className="font-medium text-neutral-300">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subscription & Billing */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
          <CreditCard className="text-neutral-400" />
          Subscription & Billing
        </h2>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              Current Plan:{' '}
              <span className="text-blue-400">{(session?.user as any)?.plan || 'FREE'}</span>
            </h3>
            <p className="text-neutral-400 text-sm">
              {(session?.user as any)?.plan === 'PRO'
                ? 'You are on the Cloud Voyager tier with full cloud sync.'
                : 'Upgrade to Cloud Voyager to unlock cloud backups and seamless sync.'}
            </p>
          </div>

          <div className="shrink-0">
            {(session?.user as any)?.plan === 'PRO' ? (
              <button
                onClick={handlePortal}
                disabled={isSubscriptionLoading}
                className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 text-white px-6 py-3 rounded-xl hover:bg-neutral-700 transition-all disabled:opacity-50"
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
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
          <HardDrive className="text-neutral-400" />
          Offline Storage
        </h2>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-inner overflow-hidden relative">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Local Library Cache</h3>
              <p className="text-neutral-400 text-sm max-w-lg">
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
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
                  Used Space
                </span>
                <div className="text-3xl font-black text-white">
                  {info.loading ? '...' : formatBytes(info.idbCustomUsage)}
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider text-right block">
                  Storage Health
                </span>
                <div
                  className={`text-sm font-bold flex items-center gap-2 ${
                    info.idbCustomUsage / info.quota > 0.8 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      info.idbCustomUsage / info.quota > 0.8
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    }`}
                  />
                  {info.idbCustomUsage / info.quota > 0.8 ? 'Near Capacity' : 'Healthy'}
                </div>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative w-full h-4 bg-black/40 rounded-full border border-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  info.idbCustomUsage / info.quota > 0.8
                    ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-comet-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                }`}
                style={{
                  width:
                    info.quota > 0
                      ? `${Math.max(2, (info.idbCustomUsage / info.quota) * 100)}%`
                      : '0%',
                }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-neutral-500">
              <span>Limit: {info.quota > 0 ? formatBytes(info.quota) : 'Unlimited'}</span>
              <div className="flex items-center gap-3">
                <span>* Estimated usage for parsed pages.</span>
                <button
                  onClick={refresh}
                  className="text-comet-blue hover:text-white transition-colors flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Individual Comic Storage List */}
            {info.cachedComics && info.cachedComics.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-800/50">
                <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  Downloaded Comics
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {info.cachedComics
                    .sort((a, b) => b.sizeBytes - a.sizeBytes)
                    .map((comic) => (
                      <div
                        key={comic.comicId}
                        className="flex items-center justify-between p-3 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {comic.coverUrl ? (
                            <div className="w-10 h-14 rounded bg-neutral-800 overflow-hidden shrink-0 border border-neutral-700">
                              <img
                                src={comic.coverUrl}
                                alt="Cover"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 rounded bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-700">
                              <BookOpen size={16} className="text-neutral-600" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white truncate w-full">
                              {comic.title || 'Unknown Title'}
                            </p>
                            <p className="text-xs text-neutral-500 font-mono">
                              {formatBytes(comic.sizeBytes)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEvictSingle(comic.comicId)}
                          className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0 ml-4"
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
    </div>
  );
}
