'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, Hash, Type, Sparkles } from 'lucide-react';
import { DashboardComic } from '@/components/molecules/DashboardComicCard';
import { useUpdateComic } from '@/hooks/useLibrary';
import { useNotification } from '@/components/atoms/Toast';

interface MetadataModalProps {
  comic: DashboardComic;
  isOpen: boolean;
  onClose: () => void;
}

export function MetadataModal({ comic, isOpen, onClose }: MetadataModalProps) {
  const updateComic = useUpdateComic();
  const { triggerNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    title: comic.title || '',
    series: comic.author || '', // DashboardComic uses 'author' for series
    issue: comic.issue?.toString() || '',
    year: comic.year?.toString() || '',
    rating: comic.rating || 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateComic.mutateAsync({
        id: comic.id,
        data: {
          title: formData.title,
          series: formData.series,
          issue: formData.issue ? parseInt(formData.issue) : null,
          year: formData.year ? parseInt(formData.year) : null,
          rating: formData.rating
        }
      });
      triggerNotification('Metadata updated successfully!', 'success');
      onClose();
    } catch (err) {
      triggerNotification('Failed to update metadata', 'error');
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-neutral-50 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">Edit Metadata</h3>
                  <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Manual Entry</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all text-neutral-400 shadow-sm border border-transparent hover:border-neutral-100">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1 flex items-center gap-2">
                    <Type size={12} /> Comic Title
                  </label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. The Amazing Spider-Man"
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3.5 px-6 text-sm font-bold text-neutral-800 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    required
                  />
                </div>

                {/* Series */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1 flex items-center gap-2">
                    <Sparkles size={12} /> Series Name
                  </label>
                  <input 
                    type="text"
                    value={formData.series}
                    onChange={e => setFormData({ ...formData, series: e.target.value })}
                    placeholder="e.g. Spider-Man"
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3.5 px-6 text-sm font-bold text-neutral-800 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Issue */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1 flex items-center gap-2">
                      <Hash size={12} /> Issue #
                    </label>
                    <input 
                      type="number"
                      value={formData.issue}
                      onChange={e => setFormData({ ...formData, issue: e.target.value })}
                      placeholder="e.g. 300"
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3.5 px-6 text-sm font-bold text-neutral-800 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    />
                  </div>

                  {/* Year */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1 flex items-center gap-2">
                      <Calendar size={12} /> Release Year
                    </label>
                    <input 
                      type="number"
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: e.target.value })}
                      placeholder="e.g. 1988"
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3.5 px-6 text-sm font-bold text-neutral-800 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">Rating (1-10)</label>
                  <div className="flex bg-neutral-50 p-1.5 rounded-2xl border border-neutral-100">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: r })}
                        className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${
                          formData.rating === r 
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                            : 'text-neutral-400 hover:text-neutral-600'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-neutral-100 text-neutral-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updateComic.isPending}
                  className="flex-[2] bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 disabled:opacity-50 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                >
                  {updateComic.isPending ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
