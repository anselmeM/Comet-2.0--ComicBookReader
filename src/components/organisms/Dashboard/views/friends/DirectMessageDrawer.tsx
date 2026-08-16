import { motion, AnimatePresence } from 'framer-motion';

import { X, MessageSquare, Loader2, Send } from 'lucide-react';

import Image from 'next/image';

import { useEffect, useRef, useState } from 'react';

import { useSession } from 'next-auth/react';

import { formatTimeAgo } from '@/lib/format';

import { getErrorMessage } from '@/lib/errors';

import {
  useDirectMessages,
  useLoadOlderMessages,
  useSendDirectMessage,
  type DirectMessage,
} from '@/hooks/useFriends';

import { useNotification } from '@/components/atoms/Toast';

interface DirectMessageDrawerProps {
  friendId: string | null;

  friendName: string | null;

  onClose: () => void;
}

/** Slide-over: one-on-one direct message thread. */

export const DirectMessageDrawer = ({
  friendId,

  friendName,

  onClose,
}: DirectMessageDrawerProps) => {
  const { data: session } = useSession();

  const { triggerNotification } = useNotification();

  const {
    data: directMessages,
    isLoading: isLoadingDMs,
    nextCursor,
    refetch,
  } = useDirectMessages(friendId);

  const loadOlder = useLoadOlderMessages(friendId);

  const sendDM = useSendDirectMessage();

  const [olderMessages, setOlderMessages] = useState<DirectMessage[]>([]);

  const [olderNextCursor, setOlderNextCursor] = useState<string | null>(null);

  // Reset the paged older-history when switching threads

  useEffect(() => {
    setOlderMessages([]);

    setOlderNextCursor(null);
  }, [friendId]);

  const canLoadOlder = olderMessages.length === 0 ? nextCursor !== null : olderNextCursor !== null;

  const handleLoadOlder = async () => {
    const cursor = olderMessages.length === 0 ? nextCursor : olderNextCursor;

    if (!cursor || loadOlder.isPending) return;

    try {
      const page = await loadOlder.mutateAsync(cursor);

      setOlderMessages((prev) => [...[...page.messages].reverse(), ...prev]);

      setOlderNextCursor(page.nextCursor);
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to load older messages', 'error');
    }
  };

  const [dmMessage, setDmMessage] = useState('');

  const dmEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dmEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [directMessages]);

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dmMessage.trim() || !friendId) return;

    try {
      await sendDM.mutateAsync({ friendId, message: dmMessage.trim() });

      setDmMessage('');
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to send message', 'error');
    }
  };

  return (
    <AnimatePresence>
      {friendId && (
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
            <div className="p-4 sm:p-6 border-b border-comet-border flex items-center justify-between bg-comet-surface shadow-sm z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-inner">
                  {(friendName || 'A')[0].toUpperCase()}
                </div>

                <div>
                  <h3 className="text-lg font-black text-comet-text tracking-tight">
                    {friendName}
                  </h3>

                  <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest mt-0.5">
                    Direct Message
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface-2 rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-comet-surface-2/50">
              {isLoadingDMs ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="text-blue-500 animate-spin" />
                </div>
              ) : directMessages && directMessages.length > 0 ? (
                <>
                  {canLoadOlder && (
                    <button
                      onClick={handleLoadOlder}
                      disabled={loadOlder.isPending}
                      className="mx-auto flex items-center gap-2 px-4 py-2 rounded-full bg-comet-surface border border-comet-border text-[10px] font-black uppercase tracking-widest text-comet-muted hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loadOlder.isPending ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <span>↑</span>
                      )}
                      Load earlier messages
                    </button>
                  )}

                  {[...olderMessages, ...directMessages].map((msg) => {
                    const isSelf = msg.senderId === session?.user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-200">
                          {msg.sender.image ? (
                            <Image
                              src={msg.sender.image}
                              alt={msg.sender.name || ''}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black absolute inset-0 m-auto flex items-center justify-center text-comet-muted">
                              {(msg.sender.name || 'A')[0].toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div
                            className={`px-4 py-3 text-sm leading-relaxed ${
                              isSelf
                                ? 'bg-blue-600 text-white rounded-[1.2rem] rounded-tr-sm shadow-md'
                                : 'bg-comet-surface text-comet-text border border-comet-border rounded-[1.2rem] rounded-tl-sm shadow-sm'
                            }`}
                          >
                            <p>{msg.message}</p>
                          </div>

                          <span
                            className={`text-[9px] font-bold text-comet-muted uppercase block tracking-wider ${isSelf ? 'text-right' : ''}`}
                          >
                            {formatTimeAgo(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-20">
                  <MessageSquare size={32} className="text-comet-muted mx-auto mb-3" />

                  <p className="text-comet-muted text-xs font-bold italic">
                    Say hi to {friendName}!
                  </p>
                </div>
              )}

              <div ref={dmEndRef} />
            </div>

            <form
              onSubmit={handleSendDM}
              className="p-4 sm:p-6 border-t border-comet-border bg-comet-surface flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-10"
            >
              <input
                type="text"
                placeholder="Type a message..."
                value={dmMessage}
                onChange={(e) => setDmMessage(e.target.value)}
                className="flex-1 bg-comet-surface-2 px-5 py-3.5 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-comet-surface text-sm outline-none transition-all font-medium"
                maxLength={1000}
              />

              <button
                type="submit"
                disabled={!dmMessage.trim() || sendDM.isPending}
                className="bg-black text-white px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 cursor-pointer"
              >
                {sendDM.isPending ? (
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
