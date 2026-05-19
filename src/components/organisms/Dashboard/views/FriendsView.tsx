import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  useFriends, 
  useFriendRequests, 
  useUserSearch, 
  useSendFriendRequest, 
  useHandleFriendRequest, 
  useRemoveFriend,
  useInviteFriend
} from '@/hooks/useFriends';
import { useFeed, FeedActivity } from '@/hooks/useFeed';
import { useNotification } from '@/components/atoms/Toast';

interface FriendsViewProps {
  setActiveView: (view: string) => void;
}

type Tab = 'list' | 'pending' | 'discover' | 'feed';

export const FriendsView = ({ setActiveView }: FriendsViewProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const { triggerNotification } = useNotification();

  const { data: friends, isLoading: isLoadingFriends } = useFriends();
  const { data: requests, isLoading: isLoadingRequests } = useFriendRequests();
  const { data: searchResults, isLoading: isSearching } = useUserSearch(searchQuery);
  const { data: feed, isLoading: isLoadingFeed } = useFeed();

  const sendRequest = useSendFriendRequest();
  const handleRequest = useHandleFriendRequest();
  const removeFriend = useRemoveFriend();
  const inviteFriend = useInviteFriend();

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest.mutateAsync(userId);
      triggerNotification('Friend request sent!', 'success');
    } catch (err: any) {
      triggerNotification(err.message, 'error');
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
    } catch (err: any) {
      triggerNotification(err.message, 'error');
    } finally {
      setIsInviting(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await handleRequest.mutateAsync({ requestId, action: 'ACCEPT' });
      triggerNotification('Friend request accepted!', 'success');
    } catch (err: any) {
      triggerNotification(err.message, 'error');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await handleRequest.mutateAsync({ requestId, action: 'DECLINE' });
      triggerNotification('Friend request declined.', 'info');
    } catch (err: any) {
      triggerNotification(err.message, 'error');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      try {
        await removeFriend.mutateAsync(friendId);
        triggerNotification('Friend removed.', 'info');
      } catch (err: any) {
        triggerNotification(err.message, 'error');
      }
    }
  };

  const pendingCount = (requests?.incoming.length || 0) + (requests?.outgoing.length || 0);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="p-4 bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-all text-neutral-400 hover:text-blue-500 shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-4xl font-black text-neutral-900 tracking-tighter italic">Friends & Community</h2>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">Manage your circle</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'feed' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Feed
          </button>
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Friends {(friends?.length || 0) > 0 && `(${friends?.length})`}
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all relative whitespace-nowrap ${activeTab === 'pending' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
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
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'discover' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Discover
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-12 space-y-12">
          
          {activeTab === 'feed' && (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-neutral-800 tracking-tight flex items-center gap-3 uppercase tracking-widest">
                  <Zap size={20} className="text-blue-500" />
                  Live Community Feed
                </h3>
                {isLoadingFeed && <Loader2 size={16} className="text-blue-500 animate-spin" />}
              </div>

              <div className="space-y-4">
                {feed && feed.length > 0 ? (
                  feed.map((activity: FeedActivity) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all"
                    >
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-neutral-100">
                          {activity.userImage ? (
                            <Image src={activity.userImage} alt={activity.userName} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold">
                              {activity.userName[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-sm ${activity.type === 'FINISHED' ? 'bg-green-500' : 'bg-blue-500'}`}>
                          {activity.type === 'FINISHED' ? <Check size={12} className="text-white" /> : <BookOpen size={12} className="text-white" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-900 font-medium">
                          <span className="font-black tracking-tight">{activity.userName}</span>
                          {activity.type === 'FINISHED' ? ' finished ' : ' is reading '}
                          <span className="text-blue-600 font-bold italic tracking-tight">{activity.comicTitle}</span>
                        </p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
                          {activity.series && `${activity.series} `}
                          {activity.issue && `#${activity.issue} • `}
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>

                      <div className="shrink-0 w-16 h-20 rounded-xl overflow-hidden shadow-sm bg-neutral-50 relative group-hover:scale-105 transition-all">
                        {activity.comicCover ? (
                          <Image src={activity.comicCover} alt={activity.comicTitle} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-200">
                            <BookOpen size={20} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : !isLoadingFeed ? (
                  <div className="text-center py-20 bg-neutral-50 rounded-[2.5rem] border border-dashed border-neutral-200">
                    <Zap size={48} className="text-neutral-100 mx-auto mb-4" />
                    <p className="text-neutral-400 font-bold italic">The community is quiet right now...</p>
                  </div>
                ) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center gap-6 animate-pulse">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-neutral-100 rounded-lg w-2/3" />
                        <div className="h-2 bg-neutral-50 rounded-lg w-1/4" />
                      </div>
                      <div className="w-16 h-20 rounded-xl bg-neutral-100" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'discover' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto w-full">
              {/* Search Existing Users */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-8 h-full">
                <div>
                  <h3 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2 mb-2">
                    <Search className="text-blue-500" size={20} />
                    Search Readers
                  </h3>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Find people already on Comet</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                  <input 
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-neutral-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-base"
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
                      searchResults.map(user => (
                        <div key={user.id} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-100 flex items-center justify-between group hover:bg-white hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-inner bg-white flex items-center justify-center">
                              {user.image ? (
                                <Image src={user.image} alt={user.name || ''} fill className="object-cover" />
                              ) : (
                                <Users className="text-neutral-300" size={24} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-black text-neutral-900 tracking-tight truncate">{user.name || 'Anonymous'}</h4>
                              <p className="text-[10px] font-bold text-neutral-400 truncate">{user.email}</p>
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
                                className="bg-blue-600 text-white p-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md"
                                title="Accept Request"
                              >
                                <Check size={18} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleSendRequest(user.id)}
                                disabled={sendRequest.isPending}
                                className="bg-black text-white p-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50"
                                title="Add Friend"
                              >
                                <UserPlus size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                        <Users size={40} className="text-neutral-200 mx-auto mb-3" />
                        <h4 className="text-sm font-black text-neutral-400 italic">No matches for &quot;{searchQuery}&quot;</h4>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-10 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
                      <Globe size={40} className="text-neutral-200 mx-auto mb-3" />
                      <p className="text-xs font-bold text-neutral-300">Enter at least 2 characters</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invite via Email */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 rounded-[2.5rem] shadow-xl text-white space-y-8 flex flex-col justify-center relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative">
                  <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    <Sparkles className="text-white" size={32} />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight mb-2 italic">Expand the Community</h3>
                  <p className="text-indigo-100 font-medium leading-relaxed max-w-sm">
                    Invite your fellow comic book enthusiasts to join Comet. We&apos;ll automatically make you friends once they sign up!
                  </p>
                </div>

                <form onSubmit={handleInviteEmail} className="relative space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
                    <input 
                      type="email"
                      required
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-white/10 border-2 border-white/10 focus:border-white focus:bg-white/20 rounded-3xl outline-none transition-all font-bold text-white placeholder:text-indigo-200 backdrop-blur-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="w-full bg-white text-indigo-600 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50"
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

          {activeTab === 'list' && (
            <div className="space-y-6 max-w-6xl mx-auto w-full">
              {isLoadingFriends ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                  <p className="font-bold text-neutral-400 italic">Finding your circle...</p>
                </div>
              ) : friends && friends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {friends.map(friend => (
                    <div key={friend.id} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm flex flex-col items-center text-center group hover:shadow-xl transition-all relative">
                      <button 
                        onClick={() => handleRemoveFriend(friend.friendId)}
                        className="absolute top-6 right-6 p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Remove Friend"
                      >
                        <UserMinus size={20} />
                      </button>
                      
                      <div className="relative w-24 h-24 rounded-3xl overflow-hidden shadow-xl mb-6 bg-neutral-100 group-hover:scale-110 transition-all duration-500">
                        {friend.image ? (
                          <Image src={friend.image} alt={friend.name || ''} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-black text-neutral-300">
                            {(friend.name || friend.email || 'A')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      <h4 className="text-xl font-black text-neutral-900 tracking-tight truncate w-full">{friend.name || 'Anonymous'}</h4>
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1 truncate w-full">{friend.email}</p>
                      
                      <div className="w-full h-px bg-neutral-50 my-6"></div>
                      
                      <div className="flex items-center gap-4 w-full">
                        <button className="flex-1 bg-neutral-950 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">
                          View Profile
                        </button>
                        <button className="p-3 bg-neutral-50 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 rounded-2xl transition-all">
                          <MessageSquare size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-neutral-200">
                  <Users size={80} className="text-neutral-100 mx-auto mb-8" />
                  <h4 className="text-2xl font-black text-neutral-300 tracking-tighter italic">Your friends list is quiet...</h4>
                  <button 
                    onClick={() => setActiveTab('discover')}
                    className="mt-8 bg-black text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 mx-auto hover:scale-105 transition-all shadow-xl"
                  >
                    <UserPlus size={20} /> Discover Readers
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="max-w-4xl mx-auto w-full space-y-12">
              {/* Incoming */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-neutral-800 tracking-tight flex items-center gap-3 uppercase tracking-widest">
                  Incoming Requests
                  {requests?.incoming.length === 0 && <span className="text-neutral-300 font-medium lowercase tracking-normal">(None)</span>}
                </h3>
                <div className="space-y-4">
                  {requests?.incoming.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-neutral-100">
                          {req.sender?.image ? (
                            <Image src={req.sender.image} alt={req.sender.name || ''} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold">
                              {(req.sender?.name || req.sender?.email || 'A')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-neutral-900 tracking-tight">{req.sender?.name || 'Anonymous'}</h4>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{req.sender?.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleAcceptRequest(req.id)}
                          className="bg-green-500 text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
                          title="Accept"
                        >
                          <Check size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(req.id)}
                          className="bg-neutral-100 text-neutral-500 p-3 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                          title="Decline"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outgoing */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-neutral-800 tracking-tight flex items-center gap-3 uppercase tracking-widest">
                  Sent Requests
                  {requests?.outgoing.length === 0 && <span className="text-neutral-300 font-medium lowercase tracking-normal">(None)</span>}
                </h3>
                <div className="space-y-4">
                  {requests?.outgoing.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between group hover:border-neutral-200 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-neutral-100 opacity-60">
                          {req.receiver?.image ? (
                            <Image src={req.receiver.image} alt={req.receiver.name || ''} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold">
                              {(req.receiver?.name || req.receiver?.email || 'A')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-neutral-900 tracking-tight opacity-60">{req.receiver?.name || 'Anonymous'}</h4>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Awaiting response</p>
                        </div>
                      </div>
                      
                      <div className="px-5 py-2.5 bg-neutral-50 text-neutral-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-neutral-100 flex items-center gap-2">
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
    </div>
  );
};
