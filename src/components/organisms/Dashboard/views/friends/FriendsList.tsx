import { UserMinus, UserPlus, Users, MessageSquare, Loader2 } from 'lucide-react';

import Image from 'next/image';

import { getErrorMessage } from '@/lib/errors';

import { useFriends, useRemoveFriend } from '@/hooks/useFriends';

import { useNotification } from '@/components/atoms/Toast';

interface FriendsListProps {
  onOpenProfile: (userId: string) => void;

  onOpenDM: (userId: string, name: string) => void;

  onGoToDiscover: () => void;
}

/** TAB: Friends List — the user's accepted friends with profile/DM actions. */

export const FriendsList = ({ onOpenProfile, onOpenDM, onGoToDiscover }: FriendsListProps) => {
  const { data: friends, isLoading: isLoadingFriends } = useFriends();

  const removeFriend = useRemoveFriend();

  const { triggerNotification } = useNotification();

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      {isLoadingFriends ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={48} className="text-comet-accent animate-spin mb-4" />

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
                  <Image src={friend.image} alt={friend.name || ''} fill className="object-cover" />
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
                  onClick={() => onOpenProfile(friend.friendId)}
                  className="flex-1 bg-comet-surface-2 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-comet-accent transition-all cursor-pointer"
                >
                  View Profile
                </button>

                <button
                  onClick={() => onOpenDM(friend.friendId, friend.name || 'Anonymous')}
                  className="p-3 bg-comet-surface-2 text-comet-muted hover:text-comet-accent hover:bg-comet-accent/10 rounded-2xl transition-all cursor-pointer"
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
            onClick={onGoToDiscover}
            className="mt-8 bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 mx-auto hover:scale-105 transition-all shadow-xl cursor-pointer"
          >
            <UserPlus size={20} /> Discover Readers
          </button>
        </div>
      )}
    </div>
  );
};
