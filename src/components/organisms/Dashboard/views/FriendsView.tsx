import React, { useState, useRef, useEffect } from 'react';
import { getErrorMessage } from '@/lib/errors';
import {
  ChevronLeft,
  MessageSquare,
  UserPlus,
  UserMinus,
  Globe,
  Search,
  UserCheck,
  X,
  Check,
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
import { useFeed, FeedActivity } from '@/hooks/useFeed';
import { useNotification } from '@/components/atoms/Toast';
import {
  useReactToActivity,
  useComicComments,
  useReadingClubs,
  ReadingClub,
} from '@/hooks/useSocialFeatures';

interface FriendsViewProps {
  setActiveView: (view: string) => void;
}

type Tab = 'list' | 'pending' | 'discover' | 'feed' | 'clubs';

const reactionEmojis: { [key: string]: string } = {
  FIRE: '🔥',
  HEART: '❤️',
  LIKE: '👍',
  TROPHY: '🏆',
};

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

  const { data: friends, isLoading: isLoadingFriends } = useFriends();
  const { data: requests, isLoading: isLoadingRequests } = useFriendRequests();
  const { data: searchResults, isLoading: isSearching } = useUserSearch(searchQuery);
  const { data: feed, isLoading: isLoadingFeed } = useFeed();
  const { data: clubs, isLoading: isLoadingClubs } = useReadingClubs();

  const sendRequest = useSendFriendRequest();
  const handleRequest = useHandleFriendRequest();
  const removeFriend = useRemoveFriend();
  const inviteFriend = useInviteFriend();
  const reactToActivity = useReactToActivity();
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
      triggerNotification(getErrorMessage(err), 'error');
    }
  };

  const handleInviteEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await inviteFriend.mutateAsync(inviteEmail.trim());
      triggerNotification(`Invitation sent to ${inviteEmail}`, 'success');
      setInviteEmail('');
    } catch (err) {
      triggerNotification(getErrorMessage(err), 'error');
    } finally {
      setIsInviting(false);
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

  const handleToggleReaction = async (
    activityId: string,
    type: 'FIRE' | 'HEART' | 'LIKE' | 'TROPHY',
  ) => {
    try {
      await reactToActivity.mutateAsync({ activityId, reactionType: type });
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to toggle reaction', 'error');
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

  // Helper reaction helpers
  const getReactionCount = (reactions: { reactionType: string; userId: string }[] = [], type: string) => {
    return reactions.filter((r) => r.reactionType === type).length;
  };

  const hasUserReacted = (reactions: { reactionType: string; userId: string }[] = [], type: string, currentUserId?: string) => {
    return reactions.some((r) => r.reactionType === type && r.userId === currentUserId);
  };

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
          {activeTab === 'feed' && (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-comet-text tracking-tight flex items-center gap-3 uppercase tracking-widest">
                  <Zap size={20} className="text-blue-500" />
                  Live Community Feed
                </h3>
                {isLoadingFeed && <Loader2 size={16} className="text-blue-500 animate-spin" />}
              </div>

              <div className="space-y-6">
                {feed && feed.length > 0 ? (
                  feed.map((activity) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-comet-surface p-4 sm:p-6 rounded-[2.5rem] border border-comet-border shadow-sm flex flex-col gap-4 group hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center gap-6 w-full">
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-comet-surface-2">
                            {activity.userImage ? (
                              <Image
                                src={activity.userImage}
                                alt={activity.userName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-comet-muted font-bold">
                                {activity.userName[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-sm ${activity.type === 'FINISHED' ? 'bg-green-500' : 'bg-blue-500'}`}
                          >
                            {activity.type === 'FINISHED' ? (
                              <Check size={12} className="text-white" />
                            ) : (
                              <BookOpen size={12} className="text-white" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-comet-text font-medium">
                            <span className="font-black tracking-tight">{activity.userName}</span>
                            {activity.type === 'FINISHED' ? ' finished ' : ' is reading '}
                            <span className="text-blue-600 font-bold italic tracking-tight">
                              {activity.comicTitle}
                            </span>
                          </p>
                          <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest mt-1">
                            {activity.series && `${activity.series} `}
                            {activity.issue !== null && `#${activity.issue} • `}
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>

                        <div className="shrink-0 w-16 h-20 rounded-xl overflow-hidden shadow-sm bg-comet-surface-2 relative group-hover:scale-105 transition-all">
                          {activity.comicCover ? (
                            <Image
                              src={activity.comicCover}
                              alt={activity.comicTitle}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-comet-muted">
                              <BookOpen size={20} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reactions Bar */}
                      <div className="flex items-center justify-between border-t border-comet-border pt-4 mt-2">
                        {/* Left: Current Active Reactions */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(reactionEmojis).map(([type, emoji]) => {
                            const count = getReactionCount(activity.reactions, type);
                            const hasReacted = hasUserReacted(
                              activity.reactions,
                              type,
                              session?.user?.id,
                            );
                            if (count === 0) return null;
                            return (
                              <button
                                key={type}
                                onClick={() => handleToggleReaction(activity.id, type as 'FIRE' | 'HEART' | 'LIKE' | 'TROPHY')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm border cursor-pointer ${
                                  hasReacted
                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 scale-105'
                                    : 'bg-comet-surface-2 border-comet-border text-comet-muted hover:bg-comet-surface-2'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{count}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Right: Slack-style reaction emojis picker */}
                        <div className="flex gap-1 items-center bg-comet-surface-2 border border-comet-border px-3 py-1 rounded-full shadow-inner select-none">
                          {Object.entries(reactionEmojis).map(([type, emoji]) => {
                            const hasReacted = hasUserReacted(
                              activity.reactions,
                              type,
                              session?.user?.id,
                            );
                            return (
                              <button
                                key={type}
                                onClick={() => handleToggleReaction(activity.id, type as 'FIRE' | 'HEART' | 'LIKE' | 'TROPHY')}
                                className={`p-1 text-base hover:scale-125 transition-all cursor-pointer ${
                                  hasReacted
                                    ? 'grayscale-0 scale-105'
                                    : 'grayscale hover:grayscale-0'
                                }`}
                                title={`React with ${type.toLowerCase()}`}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : !isLoadingFeed ? (
                  <div className="text-center py-20 bg-comet-surface-2 rounded-[2.5rem] border border-dashed border-comet-border">
                    <Zap size={48} className="text-comet-muted mx-auto mb-4" />
                    <p className="text-comet-muted font-bold italic">
                      The community is quiet right now...
                    </p>
                  </div>
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-comet-surface p-4 sm:p-6 rounded-[2rem] border border-comet-border shadow-sm flex items-center gap-6 animate-pulse"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-comet-surface-2" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-comet-surface-2 rounded-lg w-2/3" />
                        <div className="h-2 bg-comet-surface-2 rounded-lg w-1/4" />
                      </div>
                      <div className="w-16 h-20 rounded-xl bg-comet-surface-2" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: READING CLUBS (Shared Reading Queues) */}
          {activeTab === 'clubs' && (
            <div className="max-w-5xl mx-auto w-full space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-comet-text tracking-tight flex items-center gap-3 uppercase tracking-widest">
                  <Users size={20} className="text-blue-500" />
                  Shared Reading Clubs
                </h3>
                {isLoadingClubs && <Loader2 size={16} className="text-blue-500 animate-spin" />}
              </div>

              {clubs && clubs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {clubs.map((club: ReadingClub) => (
                    <div
                      key={club.key}
                      className="bg-comet-surface p-4 sm:p-6 lg:p-8 rounded-[2.5rem] border border-comet-border shadow-sm flex gap-6 hover:shadow-xl hover:border-blue-100 transition-all"
                    >
                      {/* Comic Cover */}
                      <div className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 shadow-md bg-comet-surface-2">
                        {club.coverUrl ? (
                          <Image
                            src={club.coverUrl}
                            alt={club.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <BookOpen
                            size={28}
                            className="text-comet-muted absolute inset-0 m-auto"
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                        <div className="space-y-1">
                          <h4 className="text-xl font-black text-comet-text tracking-tighter truncate leading-tight">
                            {club.title}
                          </h4>
                          <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest">
                            {club.series} {club.issue !== null && `#${club.issue}`}
                          </p>
                        </div>

                        {/* Progress summaries */}
                        <div className="space-y-3 pt-2">
                          <div className="flex flex-wrap gap-2 items-center">
                            {club.userProgress && (
                              <div className="bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                You: {club.userProgress.percent}%
                              </div>
                            )}
                            {club.activeReaders.map((r) => (
                              <div
                                key={r.userId}
                                className="bg-comet-surface-2 border border-comet-border text-comet-muted px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5"
                                title={`${r.userName} is on page ${r.lastPage + 1}`}
                              >
                                <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 bg-neutral-200">
                                  {r.userImage ? (
                                    <Image
                                      src={r.userImage}
                                      alt={r.userName}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <span className="text-[8px] font-black absolute inset-0 m-auto flex items-center justify-center text-comet-muted">
                                      {r.userName[0].toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span>
                                  {r.userName}: {r.percent}%
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              if (club.userComicId) {
                                setSelectedClubComicId(club.userComicId);
                                setSelectedClubComicTitle(club.title);
                              } else {
                                triggerNotification(
                                  'You must have this comic in your library to join the discussion.',
                                  'error',
                                );
                              }
                            }}
                            className="bg-black text-white w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2.5 hover:bg-blue-500 hover:shadow-lg transition-all cursor-pointer shadow-sm"
                          >
                            <MessageCircle size={14} />
                            <span>
                              Discuss Issue (
                              {club.activeReaders.length + (club.userProgress ? 1 : 0)} Readers)
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !isLoadingClubs ? (
                <div className="text-center py-32 bg-comet-surface rounded-[3rem] border border-dashed border-comet-border">
                  <Users size={80} className="text-comet-muted mx-auto mb-8" />
                  <h4 className="text-2xl font-black text-comet-muted tracking-tighter italic">
                    No active reading clubs
                  </h4>
                  <p className="text-comet-muted text-sm mt-2 max-w-sm mx-auto font-bold">
                    When you and your friends read the same issues simultaneously, they will show up
                    here as shared queues!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-comet-surface p-4 sm:p-6 lg:p-8 rounded-[2.5rem] border border-comet-border shadow-sm flex gap-6 animate-pulse"
                    >
                      <div className="w-24 h-36 bg-comet-surface-2 rounded-2xl shrink-0" />
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-6 bg-comet-surface-2 rounded-lg w-3/4" />
                        <div className="h-4 bg-comet-surface-2 rounded-lg w-1/3" />
                        <div className="h-10 bg-comet-surface-2 rounded-xl w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DISCOVER READERS */}
          {activeTab === 'discover' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
              <div className="bg-comet-surface p-4 sm:p-6 lg:p-8 rounded-[2.5rem] border border-comet-border shadow-sm space-y-8 h-full">
                <div>
                  <h3 className="text-xl font-black text-comet-text tracking-tight flex items-center gap-2 mb-2">
                    <Search className="text-blue-500" size={20} />
                    Search Readers
                  </h3>
                  <p className="text-xs font-bold text-comet-muted uppercase tracking-widest">
                    Find people already on Comet
                  </p>
                </div>

                <div className="relative">
                  <Search
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-comet-muted"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-comet-surface-2 border-2 border-transparent focus:border-blue-500 focus:bg-comet-surface rounded-2xl outline-none transition-all font-bold text-base"
                  />
                  {isSearching && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <Loader2 size={20} className="text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {searchQuery.length >= 2 ? (
                    searchResults && searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="bg-comet-surface-2 p-5 rounded-2xl border border-comet-border flex items-center justify-between group hover:bg-comet-surface hover:border-blue-200 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner bg-comet-surface flex items-center justify-center">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || ''}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <Users className="text-comet-muted" size={24} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-comet-text tracking-tight truncate">
                                {user.name || 'Anonymous'}
                              </h4>
                              <p className="text-[10px] font-bold text-comet-muted truncate">
                                {user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0">
                            {user.status === 'FRIEND' ? (
                              <div className="text-green-600 p-2" title="Friends">
                                <UserCheck size={20} />
                              </div>
                            ) : user.status === 'REQUEST_SENT' ? (
                              <div className="text-blue-600 p-2" title="Request Sent">
                                <Loader2 size={20} className="animate-spin" />
                              </div>
                            ) : user.status === 'REQUEST_RECEIVED' ? (
                              <button
                                onClick={() => handleAcceptRequest(user.requestId!)}
                                className="bg-blue-600 text-white p-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                                title="Accept Request"
                              >
                                <Check size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSendRequest(user.id)}
                                disabled={sendRequest.isPending}
                                className="bg-black text-white p-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                                title="Add Friend"
                              >
                                <UserPlus size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-comet-surface-2 rounded-2xl border border-dashed border-comet-border">
                        <Users size={40} className="text-comet-muted mx-auto mb-3" />
                        <h4 className="text-sm font-black text-comet-muted italic">
                          No matches for &quot;{searchQuery}&quot;
                        </h4>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-10 bg-comet-surface-2 rounded-2xl border border-dashed border-comet-border">
                      <Globe size={40} className="text-comet-muted mx-auto mb-3" />
                      <p className="text-xs font-bold text-comet-muted">
                        Enter at least 2 characters
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[2.5rem] shadow-xl text-white space-y-8 flex flex-col justify-center relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-comet-surface/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative">
                  <div className="bg-comet-surface/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    <Sparkles className="text-white" size={32} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight mb-2 italic">
                    Expand the Community
                  </h3>
                  <p className="text-indigo-100 font-medium leading-relaxed max-w-sm">
                    Invite your fellow comic book enthusiasts to join Comet. We&apos;ll
                    automatically make you friends once they sign up!
                  </p>
                </div>

                <form onSubmit={handleInviteEmail} className="relative space-y-4">
                  <div className="relative">
                    <Mail
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300"
                      size={20}
                    />
                    <input
                      type="email"
                      required
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-comet-surface/10 border-2 border-white/10 focus:border-white focus:bg-comet-surface/20 rounded-3xl outline-none transition-all font-bold text-white placeholder:text-indigo-200 backdrop-blur-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="w-full bg-comet-surface text-indigo-600 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50 cursor-pointer"
                  >
                    {isInviting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Send size={18} />
                        Send Invitation
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: FRIENDS LIST */}
          {activeTab === 'list' && (
            <div className="space-y-6 max-w-6xl mx-auto w-full">
              {isLoadingFriends ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                  <p className="font-bold text-comet-muted italic">Finding your circle...</p>
                </div>
              ) : friends && friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="bg-comet-surface p-4 sm:p-6 lg:p-8 rounded-[2.5rem] border border-comet-border shadow-sm flex flex-col items-center text-center group hover:shadow-xl transition-all relative"
                    >
                      <button
                        onClick={() => handleRemoveFriend(friend.friendId)}
                        className="absolute top-6 right-6 p-2 text-comet-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Remove Friend"
                      >
                        <UserMinus size={20} />
                      </button>

                      <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-xl mb-6 bg-comet-surface-2 group-hover:scale-110 transition-all duration-500">
                        {friend.image ? (
                          <Image
                            src={friend.image}
                            alt={friend.name || ''}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-black text-comet-muted">
                            {(friend.name || friend.email || 'A')[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      <h4 className="text-xl font-black text-comet-text tracking-tight truncate w-full">
                        {friend.name || 'Anonymous'}
                      </h4>
                      <p className="text-xs font-bold text-comet-muted uppercase tracking-widest mt-1 truncate w-full">
                        {friend.email}
                      </p>

                      <div className="w-full h-px bg-comet-surface-2 my-6"></div>

                      <div className="flex items-center gap-4 w-full">
                        <button
                          onClick={() => setSelectedProfileId(friend.friendId)}
                          className="flex-1 bg-comet-surface-2 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all cursor-pointer"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDMId(friend.friendId);
                            setSelectedDMName(friend.name || 'Anonymous');
                          }}
                          className="p-3 bg-comet-surface-2 text-comet-muted hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all cursor-pointer"
                        >
                          <MessageSquare size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-comet-surface rounded-[3rem] border border-dashed border-comet-border">
                  <Users size={80} className="text-comet-muted mx-auto mb-8" />
                  <h4 className="text-2xl font-black text-comet-muted tracking-tighter italic">
                    Your friends list is quiet...
                  </h4>
                  <button
                    onClick={() => setActiveTab('discover')}
                    className="mt-8 bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 mx-auto hover:scale-105 transition-all shadow-xl cursor-pointer"
                  >
                    <UserPlus size={20} /> Discover Readers
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PENDING REQUESTS */}
          {activeTab === 'pending' && (
            <div className="max-w-4xl mx-auto w-full space-y-12">
              <div className="space-y-6">
                <h3 className="text-xl font-black text-comet-text tracking-tight flex items-center gap-3 uppercase tracking-widest">
                  Incoming Requests
                  {requests?.incoming.length === 0 && (
                    <span className="text-comet-muted font-medium lowercase tracking-normal">
                      (None)
                    </span>
                  )}
                </h3>
                <div className="space-y-4">
                  {requests?.incoming.map((req) => (
                    <div
                      key={req.id}
                      className="bg-comet-surface p-4 sm:p-6 rounded-[2rem] border border-comet-border shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-comet-surface-2">
                          {req.sender?.image ? (
                            <Image
                              src={req.sender.image}
                              alt={req.sender.name || ''}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-comet-muted font-bold">
                              {(req.sender?.name || req.sender?.email || 'A')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-comet-text tracking-tight">
                            {req.sender?.name || 'Anonymous'}
                          </h4>
                          <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest">
                            {req.sender?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          className="bg-green-500 text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                          title="Accept"
                        >
                          <Check size={20} />
                        </button>
                        <button
                          onClick={() => handleDeclineRequest(req.id)}
                          className="bg-comet-surface-2 text-comet-muted p-3 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                          title="Decline"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black text-comet-text tracking-tight flex items-center gap-3 uppercase tracking-widest">
                  Sent Requests
                  {requests?.outgoing.length === 0 && (
                    <span className="text-comet-muted font-medium lowercase tracking-normal">
                      (None)
                    </span>
                  )}
                </h3>
                <div className="space-y-4">
                  {requests?.outgoing.map((req) => (
                    <div
                      key={req.id}
                      className="bg-comet-surface p-4 sm:p-6 rounded-[2rem] border border-comet-border shadow-sm flex items-center justify-between group hover:border-comet-border transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-comet-surface-2 opacity-60">
                          {req.receiver?.image ? (
                            <Image
                              src={req.receiver.image}
                              alt={req.receiver.name || ''}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-comet-muted font-bold">
                              {(req.receiver?.name || req.receiver?.email || 'A')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-comet-text tracking-tight opacity-60">
                            {req.receiver?.name || 'Anonymous'}
                          </h4>
                          <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest">
                            Awaiting response
                          </p>
                        </div>
                      </div>

                      <div className="px-5 py-2.5 bg-comet-surface-2 text-comet-muted rounded-xl font-black text-[10px] uppercase tracking-widest border border-comet-border flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Pending
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
