'use client';

import React, { useState, useMemo } from 'react';
import { useBookmarks, Bookmark } from '@/hooks/useBookmarks';
import { useReaderStore } from '@/stores/readerStore';
import { X, Edit2, Trash2, Plus, Bookmark as BookmarkIcon, Search, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookmarkPanelProps {
  comicId: string;
  onClose: () => void;
}

export function BookmarkPanel({ comicId, onClose }: BookmarkPanelProps) {
  const { bookmarks, isLoading, error, addBookmark, updateBookmark, removeBookmark, isBookmarked } = useBookmarks({ comicId });
  const currentPage = useReaderStore((state) => state.currentPage);
  const setPage = useReaderStore((state) => state.setPage);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter bookmarks based on search query
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery) return bookmarks;
    const q = searchQuery.toLowerCase();
    return bookmarks.filter(b => 
      b.label?.toLowerCase().includes(q) || 
      (b.pageNumber + 1).toString().includes(q)
    );
  }, [bookmarks, searchQuery]);

  const handleAddBookmark = async () => {
    await addBookmark(currentPage, newLabel || `Page ${currentPage + 1}`);
    setNewLabel('');
    setIsAdding(false);
  };

  const handleEditStart = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label || `Page ${bookmark.pageNumber + 1}`);
  };

  const handleEditSave = async () => {
    if (editingId) {
      await updateBookmark(editingId, editLabel);
      setEditingId(null);
      setEditLabel('');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      await removeBookmark(id);
    }
  };

  const handleGoToPage = (pageNumber: number) => {
    setPage(pageNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#0F172A] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/5 backdrop-blur-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <BookmarkIcon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter italic">Bookmarks</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bookmarks.length} saved points</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
            aria-label="Close bookmarks"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scroll-smooth">
          {/* Search bar */}
          {bookmarks.length > 0 && (
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-bold"
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Loading...</p>
            </div>
          ) : error && bookmarks.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/5">
              <p className="text-white font-black italic">{error}</p>
              <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Local storage fallback active</p>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/5">
              <BookmarkIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" strokeWidth={1} />
              <h4 className="text-lg font-black text-slate-400 tracking-tighter italic">No bookmarks yet</h4>
              <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest leading-relaxed">
                Press <kbd className="bg-white/10 px-2 py-0.5 rounded text-white">B</kbd> or click the icon <br /> to save your current page
              </p>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-10">
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-800" strokeWidth={1} />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No matches found</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {filteredBookmarks.map((bookmark) => (
                <motion.div
                  layout
                  key={bookmark.id}
                  className={`group flex items-center gap-4 p-4 rounded-[1.8rem] transition-all border ${
                    bookmark.pageNumber === currentPage
                      ? 'bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5'
                      : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-white/5'
                  }`}
                >
                  {editingId === bookmark.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 bg-white/10 text-white px-4 py-2 rounded-xl outline-none border border-blue-500/50 font-bold text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={handleEditSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleGoToPage(bookmark.pageNumber)}
                        className="flex items-center gap-4 flex-1 min-w-0"
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg italic ${
                          bookmark.pageNumber === currentPage
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/10 text-slate-400'
                        }`}>
                          {bookmark.pageNumber + 1}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="text-white font-black tracking-tight truncate group-hover:text-blue-400 transition-colors">
                            {bookmark.label || `Page ${bookmark.pageNumber + 1}`}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={10} className="text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              {new Date(bookmark.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditStart(bookmark)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                          title="Edit label"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bookmark.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Delete bookmark"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/5 backdrop-blur-3xl">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Enter a label..."
                  className="flex-1 bg-white/10 text-white px-4 py-3 rounded-2xl outline-none border border-blue-500/30 font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddBookmark();
                    if (e.key === 'Escape') setIsAdding(false);
                  }}
                />
                <button
                  onClick={handleAddBookmark}
                  className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-3 bg-white/5 text-slate-400 rounded-2xl hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  if (isBookmarked(currentPage)) {
                    onClose();
                  } else {
                    setIsAdding(true);
                  }
                }}
                className={`w-full flex items-center justify-center gap-4 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-2xl ${
                  isBookmarked(currentPage)
                    ? 'bg-white/5 text-blue-400 border border-blue-500/20 cursor-default'
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20'
                }`}
              >
                {isBookmarked(currentPage) ? (
                  <>
                    <BookmarkIcon size={18} fill="currentColor" />
                    <span>Current Page Bookmarked</span>
                  </>
                ) : (
                  <>
                    <Plus size={20} strokeWidth={3} />
                    <span>Add Bookmark: Page {currentPage + 1}</span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
