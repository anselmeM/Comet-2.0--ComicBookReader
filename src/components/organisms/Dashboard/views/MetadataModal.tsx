'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Hash, Type, Sparkles, Search, Globe, Loader2 } from 'lucide-react';
import { DashboardComic } from '@/components/molecules/DashboardComicCard';
import { useUpdateComic } from '@/hooks/useLibrary';
import { useNotification } from '@/components/atoms/Toast';
import Image from 'next/image';

import { createPortal } from 'react-dom';
import { logger } from '@/lib/logger';

interface MetadataModalProps {
  comic: DashboardComic;
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  comicVineId: string;
  title: string;
  series: string;
  issue: number | null;
  year: number | null;
  coverUrl: string | null;
  description?: string | null;
}

export function MetadataModal({ comic, isOpen, onClose }: MetadataModalProps) {
  const updateComic = useUpdateComic();
  const { triggerNotification } = useNotification();
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    title: comic.title || '',
    series: comic.author || '', // DashboardComic uses 'author' for series
    issue: comic.issue?.toString() || '',
    year: comic.year?.toString() || '',
    rating: comic.rating || 0,
    coverUrl: comic.coverUrl || '',
    comicVineId: comic.comicVineId || '',
  });

  const [searchQuery, setSearchQuery] = useState(comic.title || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'search'>('edit');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset form data when comic changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: comic.title || '',
        series: comic.author || '',
        issue: comic.issue?.toString() || '',
        year: comic.year?.toString() || '',
        rating: comic.rating || 0,
        coverUrl: comic.coverUrl || '',
        comicVineId: comic.comicVineId || '',
      });
      setSearchQuery(comic.title || '');
      setSearchResults([]);
      setActiveTab('edit');
    }
  }, [comic, isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/comics/search-metadata?query=${encodeURIComponent(searchQuery.trim())}`,
      );
      const data = await res.json();

      if (res.ok) {
        setSearchResults(data);
        if (data.length === 0) {
          triggerNotification('No results found on ComicVine', 'info');
        }
      } else {
        if (data.code === 'PREMIUM_REQUIRED') {
          triggerNotification('Online search is a Premium feature.', 'error');
        } else {
          triggerNotification(data.error || 'Failed to search online database', 'error');
        }
      }
    } catch (err) {
      logger.error('[MetadataSearch] Error:', {}, err instanceof Error ? err : undefined);
      triggerNotification('An unexpected error occurred during search', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setFormData((prev) => ({
      ...prev,
      title: result.title,
      series: result.series || '',
      issue: result.issue?.toString() || '',
      year: result.year?.toString() || '',
      coverUrl: result.coverUrl || prev.coverUrl,
      comicVineId: result.comicVineId,
    }));
    triggerNotification('Metadata auto-populated! Review details below.', 'success');
    setActiveTab('edit');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateComic.mutateAsync({
        id: comic.id,
        data: {
          title: formData.title,
          series: formData.series || null,
          issue: formData.issue ? parseInt(formData.issue) : null,
          year: formData.year ? parseInt(formData.year) : null,
          rating: formData.rating,
          coverUrl: formData.coverUrl || null,
          comicVineId: formData.comicVineId || null,
        },
      });
      triggerNotification('Metadata updated successfully!', 'success');
      onClose();
    } catch (err) {
      triggerNotification('Failed to update metadata', 'error');
      logger.error(String(err), {}, err instanceof Error ? err : undefined);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-comet-surface border border-comet-border rounded-[2rem] shadow-2xl overflow-hidden text-comet-text"
          >
            {/* Header */}
            <div className="p-6 border-b border-comet-border flex items-center justify-between bg-comet-surface-2/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-comet-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-comet-accent/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight italic">Comic Metadata Editor</h3>
                  <p className="text-[10px] font-black uppercase text-comet-muted tracking-widest">
                    Enrich your library info
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-comet-surface-2 rounded-xl transition-all text-comet-muted"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-comet-border bg-comet-surface-2/20 px-6 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'edit'
                    ? 'border-comet-accent text-comet-accent'
                    : 'border-transparent text-comet-muted hover:text-comet-text'
                }`}
              >
                Manual Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'search'
                    ? 'border-comet-accent text-comet-accent'
                    : 'border-transparent text-comet-muted hover:text-comet-text'
                }`}
              >
                <Globe size={14} /> Search ComicVine
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {activeTab === 'search' ? (
                <div className="space-y-6">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-comet-muted w-5 h-5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search series or issue title..."
                        className="w-full bg-comet-bg/60 border border-comet-border rounded-xl py-3 pl-12 pr-4 text-sm text-comet-text placeholder-comet-muted focus:ring-2 focus:ring-comet-accent outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="bg-comet-accent hover:bg-comet-accent-hover disabled:opacity-50 text-white px-6 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </button>
                  </form>

                  {/* Results List */}
                  <div className="space-y-3">
                    {isSearching ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 text-comet-accent animate-spin" />
                        <p className="text-sm text-comet-muted">Searching ComicVine database...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result) => (
                        <div
                          key={result.comicVineId}
                          onClick={() => handleSelectResult(result)}
                          className="flex items-center gap-4 p-3 bg-comet-bg/40 border border-comet-border rounded-2xl hover:border-comet-accent/50 hover:bg-comet-bg/80 transition-all cursor-pointer group"
                        >
                          <div className="w-12 aspect-[2/3] relative rounded-lg bg-comet-surface-2 overflow-hidden shrink-0 border border-comet-border">
                            {result.coverUrl ? (
                              <Image
                                src={result.coverUrl}
                                alt={result.title}
                                fill
                                sizes="48px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-comet-text truncate group-hover:text-comet-accent transition-colors">
                              {result.title}
                            </h4>
                            <p className="text-xs text-comet-muted mt-0.5">
                              {result.series ? `${result.series}` : 'Standalone'}
                              {result.issue !== null && ` • Issue #${result.issue}`}
                              {result.year !== null && ` • ${result.year}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="bg-comet-accent/10 text-comet-accent border border-comet-accent/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest group-hover:bg-comet-accent group-hover:text-white transition-all"
                          >
                            Import
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-comet-muted">
                        <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Search to import accurate metadata and cover art.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Split Preview and Inputs */}
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Cover Preview */}
                    <div className="w-32 aspect-[2/3] relative rounded-2xl bg-comet-bg border border-comet-border overflow-hidden shrink-0 mx-auto md:mx-0 flex items-center justify-center">
                      {formData.coverUrl ? (
                        <Image
                          src={formData.coverUrl}
                          alt="Preview"
                          fill
                          sizes="128px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <Type size={32} className="text-comet-muted" />
                      )}
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 space-y-4">
                      {/* Title */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-comet-muted flex items-center gap-1.5 ml-1">
                          <Type size={10} /> Comic Title
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full bg-comet-bg/60 border border-comet-border rounded-xl py-2.5 px-4 text-sm text-comet-text placeholder-comet-muted focus:ring-2 focus:ring-comet-accent outline-none transition-all"
                          required
                        />
                      </div>

                      {/* Series */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-wider text-comet-muted flex items-center gap-1.5 ml-1">
                          <Sparkles size={10} /> Series Name
                        </label>
                        <input
                          type="text"
                          value={formData.series}
                          onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                          className="w-full bg-comet-bg/60 border border-comet-border rounded-xl py-2.5 px-4 text-sm text-comet-text placeholder-comet-muted focus:ring-2 focus:ring-comet-accent outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Issue */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-comet-muted flex items-center gap-1.5 ml-1">
                            <Hash size={10} /> Issue #
                          </label>
                          <input
                            type="number"
                            value={formData.issue}
                            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                            className="w-full bg-comet-bg/60 border border-comet-border rounded-xl py-2.5 px-4 text-sm text-comet-text placeholder-comet-muted focus:ring-2 focus:ring-comet-accent outline-none transition-all"
                          />
                        </div>

                        {/* Year */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-wider text-comet-muted flex items-center gap-1.5 ml-1">
                            <Calendar size={10} /> Release Year
                          </label>
                          <input
                            type="number"
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            className="w-full bg-comet-bg/60 border border-comet-border rounded-xl py-2.5 px-4 text-sm text-comet-text placeholder-comet-muted focus:ring-2 focus:ring-comet-accent outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-wider text-comet-muted ml-1">
                      Personal Rating (1-10)
                    </label>
                    <div className="flex bg-comet-bg/60 p-1 rounded-xl border border-comet-border">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: r })}
                          className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                            formData.rating === r
                              ? 'bg-comet-accent text-white shadow-lg shadow-comet-accent/20'
                              : 'text-comet-muted hover:text-comet-text'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cover URL (Manual edit if needed) */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-comet-muted ml-1">
                      Cover Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.coverUrl}
                      onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                      placeholder="https://example.com/cover.jpg"
                      className="w-full bg-comet-bg/60 border border-comet-border rounded-xl py-2.5 px-4 text-xs text-comet-text placeholder-comet-muted focus:ring-2 focus:ring-comet-accent outline-none transition-all"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4 border-t border-comet-border">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-comet-surface-2 text-comet-text py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-comet-surface-2/80 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateComic.isPending}
                      className="flex-[2] bg-comet-accent hover:bg-comet-accent-hover disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-comet-accent/20 flex items-center justify-center gap-2"
                    >
                      {updateComic.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
