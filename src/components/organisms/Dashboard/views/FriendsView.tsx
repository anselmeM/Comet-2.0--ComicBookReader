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

import { ClubChatDrawer } from './friends/ClubChatDrawer';

import { ProfileDrawer } from './friends/ProfileDrawer';

import { DirectMessageDrawer } from './friends/DirectMessageDrawer';

import { useNotification } from '@/components/atoms/Toast';

import { useComicComments, useReadingClubs } from '@/hooks/useSocialFeatures';

interface FriendsViewProps {
  setActiveView: (view: string) => void;
}

type Tab = 'list' | 'pending' | 'discover' | 'feed' | 'clubs';

export const FriendsView = ({ setActiveView }: FriendsViewProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  // Collaborative Chat states

  const [selectedClubComicId, setSelectedClubComicId] = useState<string | null>(null);

  const [selectedClubComicTitle, setSelectedClubComicTitle] = useState<string | null>(null);

  // Profile Drawer State

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // DM Drawer State

  const [selectedDMId, setSelectedDMId] = useState<string | null>(null);

  const [selectedDMName, setSelectedDMName] = useState<string | null>(null);

  const { data: session } = useSession();

  const { triggerNotification } = useNotification();

  const { data: friends } = useFriends();

  const { data: requests } = useFriendRequests();

  const { data: clubs } = useReadingClubs();

  const pendingCount = (requests?.incoming.length || 0) + (requests?.outgoing.length || 0);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 relative flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-4 bg-comet-surface border border-comet-border rounded-2xl hover:bg-comet-surface-2 transition-all text-comet-muted hover:text-comet-accent shadow-sm cursor-pointer"
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
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'feed' ? 'bg-comet-surface text-comet-accent shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
          >
            Feed
          </button>

          <button
            onClick={() => setActiveTab('clubs')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'clubs' ? 'bg-comet-surface text-comet-accent shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
          >
            Clubs {(clubs?.length || 0) > 0 && `(${clubs?.length})`}
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'list' ? 'bg-comet-surface text-comet-accent shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
          >
            Friends {(friends?.length || 0) > 0 && `(${friends?.length})`}
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all relative whitespace-nowrap cursor-pointer ${activeTab === 'pending' ? 'bg-comet-surface text-comet-accent shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
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
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === 'discover' ? 'bg-comet-surface text-comet-accent shadow-sm' : 'text-comet-muted hover:text-comet-text'}`}
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

      <ClubChatDrawer
        comicId={selectedClubComicId}
        title={selectedClubComicTitle}
        onClose={() => {
          setSelectedClubComicId(null);

          setSelectedClubComicTitle(null);
        }}
      />

      {/* Public Profile Slide-over Drawer Panel */}

      <ProfileDrawer
        userId={selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        onMessage={(id: string, name: string) => {
          setSelectedDMId(id);

          setSelectedDMName(name);
        }}
      />

      {/* Direct Messaging Slide-over Drawer Panel */}

      <DirectMessageDrawer
        friendId={selectedDMId}
        friendName={selectedDMName}
        onClose={() => setSelectedDMId(null)}
      />
    </div>
  );
};
