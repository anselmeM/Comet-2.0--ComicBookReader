'use client';

import React, { useState } from 'react';
import { useBookmarks, Bookmark } from '@/hooks/useBookmarks';
import { useReaderStore } from '@/stores/readerStore';
import { X, Edit2, Trash2, Plus, ChevronRight, Bookmark as BookmarkIcon, ExternalLink } from 'lucide-react';

interface BookmarkPanelProps {
  comicId: string;
  onClose: () => void;
}

export function BookmarkPanel({ comicId, onClose }: BookmarkPanelProps) {
  const { bookmarks, isLoading, error, addBookmark, updateBookmark, removeBookmark, isBookmarked } = useBookmarks({ comicId });
  const currentPage = useReaderStore((state) => state.currentPage);
  const totalPages = useReaderStore((state) => state.totalPages);
  const setPage = useReaderStore((state) => state.setPage);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <BookmarkIcon className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-white">Bookmarks</h2>
            <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
              {bookmarks.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Close bookmarks"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error && bookmarks.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              <p>{error}</p>
              <p className="text-sm mt-2">Bookmarks will be stored locally.</p>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-8">
              <BookmarkIcon className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-neutral-400">No bookmarks yet</p>
              <p className="text-sm text-neutral-500 mt-1">
                Press B or click the bookmark icon to add one
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    bookmark.pageNumber === currentPage
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-neutral-800/50 hover:bg-neutral-800 border border-transparent'
                  }`}
                >
                  {editingId === bookmark.id ? (
                    // Edit mode
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="flex-1 bg-neutral-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Bookmark label"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={handleEditSave}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Page indicator */}
                      <button
                        onClick={() => handleGoToPage(bookmark.pageNumber)}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          bookmark.pageNumber === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-neutral-700 text-neutral-300'
                        }`}>
                          {bookmark.pageNumber + 1}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-white font-medium truncate">
                            {bookmark.label || `Page ${bookmark.pageNumber + 1}`}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-neutral-500" />
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditStart(bookmark)}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                          title="Edit bookmark"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bookmark.id)}
                          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded-lg transition-colors"
                          title="Delete bookmark"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Add bookmark */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
          {isAdding ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder={`Page ${currentPage + 1}`}
                className="flex-1 bg-neutral-700 text-white px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-yellow-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddBookmark();
                  if (e.key === 'Escape') setIsAdding(false);
                }}
              />
              <button
                onClick={handleAddBookmark}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (isBookmarked(currentPage)) {
                  // Already bookmarked, just close and show message
                  onClose();
                } else {
                  setIsAdding(true);
                }
              }}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
                isBookmarked(currentPage)
                  ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isBookmarked(currentPage) ? (
                <>
                  <BookmarkIcon size={18} />
                  <span>Current Page Already Bookmarked</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Add Bookmark for Page {currentPage + 1}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
