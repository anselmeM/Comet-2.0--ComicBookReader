import React, { useState, useRef, useEffect } from 'react';

import { getErrorMessage } from '@/lib/errors';

import {
  ChevronLeft,
  MessageSquare,
  UserPlus,
  UserMinus,
  Check,
  X,
  Globe,
  Search,
  UserCheck,
  Loader2,
  Users,
  Mail,
  Send,
  Sparkles,
  Zap,
  BookOpen,
  MessageCircle,
  Trophy,
} from 'lucide-react';

import Image from 'next/image';

import { formatTimeAgo } from '@/lib/format';

import { motion, AnimatePresence } from 'framer-motion';

import { useSession } from 'next-auth/react';

import {
  useFriends,
  useFriendRequests,
  useUserSearch,
  useSendFriendRequest,
  useHandleFriendRequest,
  useRemoveFriend,
  useInviteFriend,
  useUserProfile,
  useDirectMessages,
  useSendDirectMessage,
} from '@/hooks/useFriends';

import { FriendsList } from './friends/FriendsList';

import { PendingRequests } from './friends/PendingRequests';

import { CommunityFeed } from './friends/CommunityFeed';

import { ReadingClubs } from './friends/ReadingClubs';
import { DiscoverReaders } from './friends/DiscoverReaders';

import { useNotification } from '@/components/atoms/Toast';

import { useComicComments, useReadingClubs } from '@/hooks/useSocialFeatures';

interface FriendsViewProps {
  setActiveView: (view: string) => void;
}

type Tab = 'list' | 'pending' | 'discover' | 'feed' | 'clubs';

export const FriendsView = ({ setActiveView }: FriendsViewProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  const [searchQuery, setSearchQuery] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');

  const [isInviting, setIsInviting] = useState(false);

  // Collaborative Chat states

  const [selectedClubComicId, setSelectedClubComicId] = useState<string | null>(null);

  const [selectedClubComicTitle, setSelectedClubComicTitle] = useState<string | null>(null);

  const [chatMessage, setChatMessage] = useState('');

  // Profile Drawer State

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // DM Drawer State

  const [selectedDMId, setSelectedDMId] = useState<string | null>(null);

  const [selectedDMName, setSelectedDMName] = useState<string | null>(null);

  const [dmMessage, setDmMessage] = useState('');

  const { data: session } = useSession();

  const { triggerNotification } = useNotification();

  const { data: friends } = useFriends();

  const { data: requests } = useFriendRequests();

  const { data: searchResults, isLoading: isSearching } = useUserSearch(searchQuery);

  const { data: clubs } = useReadingClubs();


  const sendRequest = useSendFriendRequest();
  const handleRequest = useHandleFriendRequest();

  const removeFriend = useRemoveFriend();

  const inviteFriend = useInviteFriend();

  const { comments, postComment } = useComicComments(selectedClubComicId || '');

  const { data: userProfile, isLoading: isLoadingProfile } = useUserProfile(selectedProfileId);

  const { data: directMessages, isLoading: isLoadingDMs } = useDirectMessages(selectedDMId);

  const sendDM = useSendDirectMessage();

  const chatEndRef = useRef<HTMLDivElement>(null);

  const dmEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  useEffect(() => {
    if (dmEndRef.current) {
      dmEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [directMessages]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest.mutateAsync(userId);
      triggerNotification('Friend request sent!', 'success');
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to send request', 'error');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await handleRequest.mutateAsync({ requestId, action: 'ACCEPT' });

      triggerNotification('Friend request accepted!', 'success');
    } catch (err) {
      triggerNotification(getErrorMessage(err), 'error');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await handleRequest.mutateAsync({ requestId, action: 'DECLINE' });

      triggerNotification('Friend request declined.', 'info');
    } catch (err) {
      triggerNotification(getErrorMessage(err), 'error');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      try {
        await removeFriend.mutateAsync(friendId);

        triggerNotification('Friend removed.', 'info');
      } catch (err) {
        triggerNotification(getErrorMessage(err), 'error');
      }
    }
  };





  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatMessage.trim() || !selectedClubComicId) return;

    try {
      await postComment.mutateAsync(chatMessage.trim());

      setChatMessage('');
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to post comment', 'error');
    }
  };

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dmMessage.trim() || !selectedDMId) return;

    try {
      await sendDM.mutateAsync({ friendId: selectedDMId, message: dmMessage.trim() });

      setDmMessage('');
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to send message', 'error');
    }
  };

  const pendingCount = (requests?.incoming.length || 0) + (requests?.outgoing.length || 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 relative flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-4 bg-comet-surface border border-comet-border rounded-2xl hover:bg-comet-surface-2 transition-all text-comet-muted hover:text-blue-500 shadow-sm cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>

          <div>
            <h2 className="text-3xl md:text-4xl font-black text-comet-text tracking-tighter italic">
              Friends & Community
            </h2>

            <p className="text-sm font-bold text-comet-muted uppercase tracking-widest mt-1">
              Manage your circle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-comet-surface-2 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'feed' ? 'bg-comet-surface text-blue-600 shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
          >
            Feed
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'clubs' ? 'bg-comet-surface text-blue-600 shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
          >
            Clubs {(clubs?.length || 0) > 0 && `(${clubs?.length})`}
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'list' ? 'bg-comet-surface text-blue-600 shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
          >
            Friends {(friends?.length || 0) > 0 && `(${friends?.length})`}
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all relative whitespace-nowrap cursor-pointer ${activeTab === 'pending' ? 'bg-comet-surface text-blue-600 shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
          >
            Pending
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('discover')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'discover' ? 'bg-comet-surface text-blue-600 shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
          >
            Discover
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12 space-y-12">
          {/* TAB 1: COMMUNITY FEED */}

          {activeTab === 'feed' && <CommunityFeed />}

          {/* TAB 2: READING CLUBS (Shared Reading Queues) */}

          {activeTab === 'clubs' && (
            <ReadingClubs
              onOpenDiscussion={(comicId, title) => {
                setSelectedClubComicId(comicId);

                setSelectedClubComicTitle(title);
              }}
            />
          )}

          {/* TAB 3: DISCOVER READERS */}
          {activeTab === 'discover' && <DiscoverReaders />}

          {/* TAB 4: FRIENDS LIST */}

          {activeTab === 'list' && (
            <FriendsList
              onOpenProfile={setSelectedProfileId}
              onOpenDM={(userId, name) => {
                setSelectedDMId(userId);

                setSelectedDMName(name);
              }}
              onGoToDiscover={() => setActiveTab('discover')}
            />
          )}

          {/* TAB 5: PENDING REQUESTS */}

          {activeTab === 'pending' && <PendingRequests />}
        </div>
      </div>

      {/* Collaborative Discussion Slide-over Drawer Panel */}

      <AnimatePresence>
        {selectedClubComicId && (
          <>
            {/* Backdrop */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedClubComicId(null);

                setSelectedClubComicTitle(null);
              }}
              className="fixed inset-0 bg-black z-[100] cursor-pointer"
            />

            {/* Slide-over panel */}

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-comet-surface z-[110] shadow-2xl border-l border-comet-border flex flex-col h-full"
            >
              {/* Header */}

              <div className="p-4 sm:p-6 border-b border-comet-border flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-comet-text tracking-tight italic">
                    Club Discussion
                  </h3>

                  <p className="text-xs font-bold text-comet-muted uppercase tracking-widest max-w-[280px] truncate mt-0.5">
                    {selectedClubComicTitle}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedClubComicId(null);

                    setSelectedClubComicTitle(null);
                  }}
                  className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface-2 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat bubbles list */}

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-comet-surface-2/50">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => {
                    const isSelf = comment.userId === session?.user?.id;

                    return (
                      <div
                        key={comment.id}
                        className={`flex gap-3 max-w-[85%] ${isSelf ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}

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

                        {/* Bubble */}

                        <div className="space-y-1">
                          <span
                            className={`text-[9px] font-bold text-comet-muted uppercase tracking-wider block ${isSelf ? 'text-right' : ''}`}
                          >
                            {comment.user.name || 'Anonymous'}
                          </span>

                          <div
                            className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                              isSelf
                                ? 'bg-blue-500 text-white rounded-tr-none'
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

              {/* Comment Input */}

              <form
                onSubmit={handlePostComment}
                className="p-4 sm:p-6 border-t border-comet-border bg-comet-surface flex gap-3"
              >
                <input
                  type="text"
                  placeholder="Type a club message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-comet-surface-2 px-4 py-3 rounded-xl border border-transparent focus:border-blue-500 focus:bg-comet-surface text-sm outline-none transition-all"
                  maxLength={500}
                />

                <button
                  type="submit"
                  disabled={!chatMessage.trim() || postComment.isPending}
                  className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
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

      {/* Public Profile Slide-over Drawer Panel */}

      <AnimatePresence>
        {selectedProfileId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProfileId(null)}
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
                  <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />

                  <p className="text-comet-muted font-bold text-sm">Loading profile...</p>
                </div>
              ) : userProfile ? (
                <div className="flex-1">
                  {/* Header & Avatar */}

                  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-indigo-800 flex items-end px-8 pb-8 pt-6 justify-between">
                    <button
                      onClick={() => setSelectedProfileId(null)}
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

                        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest drop-shadow-md">
                          Joined {new Date(userProfile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 pt-20 pb-8 space-y-10">
                    {/* Stats */}

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
                        <p className="text-2xl font-black text-blue-600">
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

                    {/* Action Buttons */}

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
                                setSelectedProfileId(null);

                                setSelectedDMId(userProfile.id);

                                setSelectedDMName(userProfile.name || 'Anonymous');
                              }}
                              className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all flex justify-center gap-2"
                            >
                              <MessageSquare size={16} /> Message
                            </button>

                            <button
                              onClick={() => {
                                setSelectedProfileId(null);

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

                    {/* Trophy Room */}

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

                    {/* Recent Activity */}

                    <div>
                      <h3 className="text-lg font-black text-comet-text flex items-center gap-2 uppercase tracking-widest mb-4">
                        <Zap className="text-blue-500" size={20} /> Recent Activity
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

      {/* Direct Messaging Slide-over Drawer Panel */}

      <AnimatePresence>
        {selectedDMId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDMId(null)}
              className="fixed inset-0 bg-black z-[100] cursor-pointer"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-comet-surface z-[110] shadow-2xl border-l border-comet-border flex flex-col h-full"
            >
              {/* Header */}

              <div className="p-4 sm:p-6 border-b border-comet-border flex items-center justify-between bg-comet-surface shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-inner">
                    {(selectedDMName || 'A')[0].toUpperCase()}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-comet-text tracking-tight">
                      {selectedDMName}
                    </h3>

                    <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest mt-0.5">
                      Direct Message
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDMId(null)}
                  className="p-2 text-comet-muted hover:text-comet-text hover:bg-comet-surface-2 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat bubbles list */}

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-comet-surface-2/50">
                {isLoadingDMs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={24} className="text-blue-500 animate-spin" />
                  </div>
                ) : directMessages && directMessages.length > 0 ? (
                  directMessages.map((msg) => {
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
                  })
                ) : (
                  <div className="text-center py-20">
                    <MessageSquare size={32} className="text-comet-muted mx-auto mb-3" />

                    <p className="text-comet-muted text-xs font-bold italic">
                      Say hi to {selectedDMName}!
                    </p>
                  </div>
                )}

                <div ref={dmEndRef} />
              </div>

              {/* Comment Input */}

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
    </div>
  );
};
