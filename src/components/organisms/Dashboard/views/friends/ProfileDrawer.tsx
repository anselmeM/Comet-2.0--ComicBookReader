import { motion, AnimatePresence } from 'framer-motion';

import {
  X,
  Loader2,
  UserPlus,
  UserMinus,
  MessageSquare,
  Trophy,
  Zap,
  BookOpen,
} from 'lucide-react';

import Image from 'next/image';

import { formatTimeAgo } from '@/lib/format';

import { getErrorMessage } from '@/lib/errors';

import { useUserProfile } from '@/hooks/useFriends';

import { useSendFriendRequest } from '@/hooks/useFriends';

import { useRemoveFriend } from '@/hooks/useFriends';

import { useNotification } from '@/components/atoms/Toast';

interface ProfileDrawerProps {
  userId: string | null;

  onClose: () => void;

  onMessage: (userId: string, name: string) => void;
}

/** Slide-over: public profile (stats, badges, activity, friend actions). */

export const ProfileDrawer = ({ userId, onClose, onMessage }: ProfileDrawerProps) => {
  const { triggerNotification } = useNotification();

  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(userId);

  const sendRequest = useSendFriendRequest();

  const removeFriend = useRemoveFriend();

  const handleSendRequest = async (id: string) => {
    try {
      await sendRequest.mutateAsync(id);

      triggerNotification('Friend request sent!', 'success');
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to send request', 'error');
    }
  };

  const handleRemoveFriend = async (id: string) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      try {
        await removeFriend.mutateAsync(id);

        triggerNotification('Friend removed.', 'info');
      } catch (err) {
        triggerNotification(getErrorMessage(err), 'error');
      }
    }
  };

  return (
    <AnimatePresence>
      {userId && (
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
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-comet-surface z-[110] shadow-2xl border-l border-comet-border flex flex-col h-full overflow-y-auto"
          >
            {isLoadingProfile ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <Loader2 size={40} className="text-comet-accent animate-spin mb-4" />

                <p className="text-comet-muted font-bold text-sm">Loading profile...</p>
              </div>
            ) : userProfile ? (
              <div className="flex-1">
                <div className="relative h-48 bg-gradient-to-br from-comet-accent to-comet-accent-hover flex items-end px-8 pb-8 pt-6 justify-between">
                  <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-black/20 text-white hover:bg-black/40 rounded-full transition-all cursor-pointer backdrop-blur-md"
                  >
                    <X size={20} />
                  </button>

                  <div className="flex items-end gap-6">
                    <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-comet-surface shrink-0 -mb-12">
                      {userProfile.image ? (
                        <Image
                          src={userProfile.image}
                          alt={userProfile.name || ''}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-comet-muted">
                          {(userProfile.name || 'A')[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="text-white pb-2">
                      <h2 className="text-2xl font-black tracking-tight drop-shadow-md">
                        {userProfile.name || 'Anonymous'}
                      </h2>

                      <p className="text-xs font-bold text-white/85 uppercase tracking-widest drop-shadow-md">
                        Joined {new Date(userProfile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-8 pt-20 pb-8 space-y-10">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-comet-surface-2 rounded-2xl p-4 text-center border border-comet-border">
                      <p className="text-2xl font-black text-comet-text">
                        {userProfile.stats.libraryCount}
                      </p>

                      <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest mt-1">
                        Comics
                      </p>
                    </div>

                    <div className="bg-comet-surface-2 rounded-2xl p-4 text-center border border-comet-border">
                      <p className="text-2xl font-black text-comet-accent">
                        {userProfile.stats.completedCount}
                      </p>

                      <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest mt-1">
                        Finished
                      </p>
                    </div>

                    <div className="bg-comet-surface-2 rounded-2xl p-4 text-center border border-comet-border">
                      <p className="text-xl font-black text-comet-text">
                        {Math.round(userProfile.stats.totalTimeSpent / 3600)}h
                      </p>

                      <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest mt-1">
                        Read Time
                      </p>
                    </div>
                  </div>

                  {!userProfile.isSelf && (
                    <div className="flex gap-4">
                      {!userProfile.isFriend ? (
                        <button
                          onClick={() => handleSendRequest(userProfile.id)}
                          className="flex-1 bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-neutral-800 transition-all flex justify-center gap-2"
                        >
                          <UserPlus size={16} /> Add Friend
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              onClose();

                              onMessage(userProfile.id, userProfile.name || 'Anonymous');
                            }}
                            className="flex-1 bg-comet-accent text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-comet-accent-hover transition-all flex justify-center gap-2"
                          >
                            <MessageSquare size={16} /> Message
                          </button>

                          <button
                            onClick={() => {
                              onClose();

                              handleRemoveFriend(userProfile.id);
                            }}
                            className="px-6 bg-comet-surface-2 text-comet-muted py-4 rounded-2xl font-black shadow-inner hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <UserMinus size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-black text-comet-text flex items-center gap-2 uppercase tracking-widest mb-4">
                      <Trophy className="text-yellow-500" size={20} /> Trophy Room
                    </h3>

                    {userProfile.badges && userProfile.badges.length > 0 ? (
                      <div className="grid grid-cols-4 gap-3">
                        {userProfile.badges.map((b) => (
                          <div
                            key={b.badgeId}
                            className="aspect-square bg-gradient-to-br from-yellow-100 to-yellow-300 rounded-2xl shadow-inner border border-yellow-200 flex items-center justify-center p-2 text-center"
                            title={`Badge ${b.badgeId} earned on ${b.earnedAt ? new Date(b.earnedAt).toLocaleDateString() : 'unknown date'}`}
                          >
                            <span className="text-2xl drop-shadow-md">🏆</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 sm:p-6 bg-comet-surface-2 rounded-2xl border border-dashed border-comet-border text-center">
                        <p className="text-sm font-bold text-comet-muted italic">
                          No badges earned yet.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-comet-text flex items-center gap-2 uppercase tracking-widest mb-4">
                      <Zap className="text-comet-accent" size={20} /> Recent Activity
                    </h3>

                    {userProfile.recentActivity && userProfile.recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {userProfile.recentActivity.map((activity) => (
                          <div
                            key={activity.comicId}
                            className="flex gap-4 items-center bg-comet-surface border border-comet-border p-4 rounded-2xl shadow-sm"
                          >
                            <div className="w-12 h-16 bg-comet-surface-2 rounded-lg shrink-0 relative overflow-hidden shadow-sm">
                              {activity.coverUrl ? (
                                <Image
                                  src={activity.coverUrl ?? ''}
                                  alt={activity.title ?? 'Comic activity'}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <BookOpen
                                  className="absolute inset-0 m-auto text-comet-muted"
                                  size={20}
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-comet-text text-sm truncate">
                                {activity.title}
                              </h4>

                              <p className="text-[10px] font-bold text-comet-muted uppercase mt-0.5">
                                {activity.readStatus === 'COMPLETED'
                                  ? 'Finished'
                                  : `Read ${activity.percent}%`}{' '}
                                • {formatTimeAgo(activity.lastReadAt ?? new Date())}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 sm:p-6 bg-comet-surface-2 rounded-2xl border border-dashed border-comet-border text-center">
                        <p className="text-sm font-bold text-comet-muted italic">
                          No recent reading activity.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-red-500 font-bold">
                Failed to load profile.
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
