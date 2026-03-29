'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useStorage } from '@/hooks/useStorage';
import { useReaderStore } from '@/stores/readerStore';
import type { ReaderMode } from '@/stores/readerStore';
import { Trash2, Smartphone, HardDrive, Monitor, BookOpen, RefreshCw, User, Camera, Loader2 } from 'lucide-react';

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Convert to base64 data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        
        // Update user profile via API
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image })
        });
        
        if (response.ok) {
          // Update session to reflect new image
          await updateSession();
        } else {
          alert('Failed to update profile image');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      alert('Failed to upload image');
    }
  };

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

      {/* User Profile Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2 border-b border-neutral-800 pb-2">
          <User className="text-neutral-400" />
          Profile
        </h2>

        <div className="flex items-center gap-6 p-6 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="relative">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt={session.user.name || 'User'}
                className="w-24 h-24 rounded-full object-cover border-2 border-neutral-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-2 border-neutral-700">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
              title="Change profile picture"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{session?.user?.name || 'User'}</h3>
            <p className="text-neutral-400 text-sm">{session?.user?.email}</p>
          </div>
        </div>
      </section>

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
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id as ReaderMode)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    mode === item.id 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
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
                aria-label="Screen brightness"
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
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Used Space</span>
                <div className="text-3xl font-black text-white">
                  {info.loading ? '...' : formatBytes(info.idbCustomUsage)}
                </div>
              </div>
              
              <div className="text-right space-y-1">
                <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider text-right block">Storage Health</span>
                <div className={`text-sm font-bold flex items-center gap-2 ${
                  (info.idbCustomUsage / info.quota) > 0.8 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    (info.idbCustomUsage / info.quota) > 0.8 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                  }`} />
                  {(info.idbCustomUsage / info.quota) > 0.8 ? 'Near Capacity' : 'Healthy'}
                </div>
              </div>
            </div>
            
            {/* Progress Bar Container */}
            <div className="relative w-full h-4 bg-black/40 rounded-full border border-white/5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  (info.idbCustomUsage / info.quota) > 0.8 
                    ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                    : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-comet-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                }`}
                style={{ 
                  width: info.quota > 0 ? `${Math.max(2, (info.idbCustomUsage / info.quota) * 100)}%` : '0%' 
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
          </div>
        </div>
      </section>

    </div>
  );
}
