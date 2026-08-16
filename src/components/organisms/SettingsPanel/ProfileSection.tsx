'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { User, Camera, Save, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

/** Profile section — avatar upload + display name. Owns its handlers. */
export const ProfileSection = () => {
  const { data: session, update: updateSession } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
        <User className="text-comet-muted" />
        Profile
      </h2>

      <div className="p-6 bg-comet-surface border border-comet-border rounded-2xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            {session?.user?.image ? (
              <Image
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
  );
};
