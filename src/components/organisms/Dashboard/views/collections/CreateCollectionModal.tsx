'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCollections } from '@/hooks/useCollections';
import { getErrorMessage } from '@/lib/errors';
import { useNotification } from '@/components/atoms/Toast';

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
}

/** New-collection modal — owns the name state + create mutation. */
export const CreateCollectionModal = ({ open, onClose }: CreateCollectionModalProps) => {
  const { createCollection } = useCollections();
  const { triggerNotification } = useNotification();
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCollection.mutateAsync({ name: newCollectionName });
      triggerNotification(`Collection "${newCollectionName}" created!`, 'success');
      setNewCollectionName('');
      onClose();
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to create collection', 'error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-neutral-50 flex items-center justify-between">
              <h3 className="text-2xl font-black text-neutral-900 tracking-tighter italic">
                New Collection
              </h3>

              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-50 rounded-xl transition-all text-neutral-400"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-1">
                  Collection Name
                </label>

                <input
                  type="text"
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Spider-Man Favorites"
                  className="w-full bg-neutral-50 border-none rounded-2xl py-4 px-6 text-base font-bold text-neutral-800 placeholder:text-neutral-300 focus:ring-4 focus:ring-comet-accent/5 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!newCollectionName.trim() || createCollection.isPending}
                className="w-full bg-comet-accent/100 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-comet-accent disabled:opacity-50 transition-all shadow-xl shadow-comet-accent/20"
              >
                {createCollection.isPending ? 'Creating...' : 'Create Collection'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
