'use client';

import React from 'react';
import { useStorage } from '@/hooks/useStorage';
import { useReaderStore, type ReadingMode } from '@/stores/readerStore';
import { Trash2, Smartphone, HardDrive, Monitor, BookOpen } from 'lucide-react';

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
  const { readingMode, setReadingMode, brightness, setBrightness } = useReaderStore();

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear your local comic cache? You will need to re-download or re-parse comics to read them offline.')) {
      await clearCache();
      alert('Cache cleared!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-neutral-400">Manage your reading preferences and offline storage.</p>
      </header>

      {/* Reading Preferences */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
          <BookOpen className="text-neutral-400" />
          Reading Preferences
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Default Reading Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'single-vertical', label: 'Vertical Scroll', icon: <Smartphone size={18} /> },
                { id: 'dual-spread', label: 'Dual Spread', icon: <Monitor size={18} /> },
                { id: 'manga-rtl', label: 'Manga (RTL)', icon: <BookOpen size={18} /> }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setReadingMode(mode.id as ReadingMode)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    readingMode === mode.id 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-white'
                  }`}
                >
                  {mode.icon}
                  <span className="font-medium">{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Screen Brightness (Filter)</label>
            <div className="flex items-center gap-4 max-w-md">
              <input 
                type="range" 
                min="0.5" 
                max="1.5" 
                step="0.05" 
                value={brightness}
                onChange={(e) => setBrightness(parseFloat(e.target.value))}
                className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-neutral-400 min-w-12 text-right">
                {Math.round(brightness * 100)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Storage Management */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
          <HardDrive className="text-neutral-400" />
          Offline Storage
        </h2>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-1">Local Comic Cache</h3>
              <p className="text-neutral-400 text-sm">
                Comics you open are parsed and stored locally for instant, offline access.
              </p>
            </div>
            
            <button 
              onClick={handleClear}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors shrink-0"
            >
              <Trash2 size={18} />
              <span>Clear Cache</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-300 font-medium">
                {info.loading ? 'Calculating...' : formatBytes(info.idbCustomUsage)} used
              </span>
              <span className="text-neutral-500">
                {info.quota > 0 ? `${formatBytes(info.quota)} available limit` : 'Unknown quota'}
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                style={{ 
                  width: info.quota > 0 ? `${Math.min(100, (info.idbCustomUsage / info.quota) * 100)}%` : '0%' 
                }}
              />
            </div>
            
            <div className="text-xs text-neutral-500 mt-2 flex justify-between">
              <span>* Estimated usage for parsed pages.</span>
              <button onClick={refresh} className="hover:text-neutral-300 underline">Refresh</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
