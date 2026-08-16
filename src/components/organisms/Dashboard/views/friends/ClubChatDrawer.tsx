import { motion, AnimatePresence } from 'framer-motion';

import { X, MessageSquare, Loader2, Send } from 'lucide-react';

import Image from 'next/image';

import { useEffect, useRef, useState } from 'react';

import { useSession } from 'next-auth/react';

import { formatTimeAgo } from '@/lib/format';

import { getErrorMessage } from '@/lib/errors';

import { useComicComments } from '@/hooks/useSocialFeatures';

import { useNotification } from '@/components/atoms/Toast';

interface ClubChatDrawerProps {
  comicId: string | null;

  title: string | null;

  onClose: () => void;
}

/** Slide-over: shared-queue club discussion thread. */

export const ClubChatDrawer = ({ comicId, title, onClose }: ClubChatDrawerProps) => {
  const { data: session } = useSession();

  const { triggerNotification } = useNotification();

  const { comments, postComment } = useComicComments(comicId || '');

  const [chatMessage, setChatMessage] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatMessage.trim() || !comicId) return;

    try {
      await postComment.mutateAsync(chatMessage.trim());

      setChatMessage('');
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to post comment', 'error');
    }
  };

  return (
    <AnimatePresence>
      {comicId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[100] cursor-pointer"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-comet-surface z-[110] shadow-2xl border-l border-comet-border flex flex-col h-full"
          >
            <div className="p-4 sm:p-6 border-b border-comet-border flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-comet-text tracking-tight italic">
                  Club Discussion
                </h3>

                <p className="text-xs font-bold text-comet-muted uppercase tracking-widest max-w-[280px] truncate mt-0.5">
                  {title}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface-2 rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-comet-surface-2/50">
              {comments && comments.length > 0 ? (
                comments.map((comment) => {
                  const isSelf = comment.userId === session?.user?.id;

                  return (
                    <div
                      key={comment.id}
                      className={`flex gap-3 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
                        {comment.user.image ? (
                          <Image
                            src={comment.user.image}
                            alt={comment.user.name || ''}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-black absolute inset-0 m-auto flex items-center justify-center text-comet-muted">
                            {(comment.user.name || 'A')[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span
                          className={`text-[9px] font-bold text-comet-muted uppercase tracking-wider block ${isSelf ? 'text-right' : ''}`}
                        >
                          {comment.user.name || 'Anonymous'}
                        </span>

                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                            isSelf
                              ? 'bg-comet-accent/100 text-white rounded-tr-none'
                              : 'bg-comet-surface text-comet-text border border-comet-border rounded-tl-none shadow-sm'
                          }`}
                        >
                          <p>{comment.message}</p>
                        </div>

                        <span
                          className={`text-[8px] font-bold text-comet-muted uppercase block ${isSelf ? 'text-right' : ''}`}
                        >
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-20">
                  <MessageSquare size={32} className="text-comet-muted mx-auto mb-3" />

                  <p className="text-comet-muted text-xs font-bold italic">
                    No club comments yet. Start the discussion!
                  </p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <form
              onSubmit={handlePostComment}
              className="p-4 sm:p-6 border-t border-comet-border bg-comet-surface flex gap-3"
            >
              <input
                type="text"
                placeholder="Type a club message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-comet-surface-2 px-4 py-3 rounded-xl border border-transparent focus:border-comet-accent focus:bg-comet-surface text-sm outline-none transition-all"
                maxLength={500}
              />

              <button
                type="submit"
                disabled={!chatMessage.trim() || postComment.isPending}
                className="bg-comet-accent text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {postComment.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
