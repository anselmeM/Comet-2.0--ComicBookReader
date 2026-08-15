import { Search, Users, Loader2, UserCheck, Check, UserPlus, Globe, Sparkles, Mail, Send } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';
import { getErrorMessage } from '@/lib/errors';
import { useUserSearch, useSendFriendRequest, useHandleFriendRequest, useInviteFriend } from '@/hooks/useFriends';
import { useNotification } from '@/components/atoms/Toast';

/** TAB: Discover Readers — user search + invite, fully self-contained. */
export const DiscoverReaders = () => {
  const { triggerNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const { data: searchResults, isFetching: isSearching } = useUserSearch(searchQuery);
  const sendRequest = useSendFriendRequest();
  const handleRequest = useHandleFriendRequest();
  const inviteFriend = useInviteFriend();
  const isInviting = inviteFriend.isPending;

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

  const handleInviteEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await inviteFriend.mutateAsync(inviteEmail);
      setInviteEmail('');
      triggerNotification('Invitation sent!', 'success');
    } catch (err) {
      triggerNotification(getErrorMessage(err), 'error');
    }
  };

  return (
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
  );
};
