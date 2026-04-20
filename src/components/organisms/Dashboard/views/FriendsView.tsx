import React, { useState } from 'react';
import { ChevronLeft, MessageSquare, UserPlus, UserMinus, Globe, Search, UserCheck, X, Check, Loader2, Users } from 'lucide-react';
import Image from 'next/image';
import { 
  useFriends, 
  useFriendRequests, 
  useUserSearch, 
  useSendFriendRequest, 
  useHandleFriendRequest, 
  useRemoveFriend 
} from '@/hooks/useFriends';
import { useNotification } from '@/components/atoms/Toast';

interface FriendsViewProps {
  setActiveView: (view: string) => void;
}

type Tab = 'list' | 'pending' | 'discover';

export const FriendsView = ({ setActiveView }: FriendsViewProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const { triggerNotification } = useNotification();

  const { data: friends, isLoading: isLoadingFriends } = useFriends();
  const { data: requests, isLoading: isLoadingRequests } = useFriendRequests();
  const { data: searchResults, isLoading: isSearching } = useUserSearch(searchQuery);

  const sendRequest = useSendFriendRequest();
  const handleRequest = useHandleFriendRequest();
  const removeFriend = useRemoveFriend();

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest.mutateAsync(userId);
      triggerNotification('Friend request sent!', 'success');
    } catch (err: any) {
      triggerNotification(err.message, 'error');
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
        <div className="lg:col-span-12 space-y-8">
          
          {activeTab === 'discover' && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-8 max-w-4xl mx-auto w-full">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={24} />
                <input 
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-neutral-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-3xl outline-none transition-all font-bold text-lg"
                />
                {isSearching && (
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <Loader2 size={24} className="text-blue-500 animate-spin" />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {searchQuery.length >= 2 ? (
                  searchResults && searchResults.length > 0 ? (
                    searchResults.map(user => (
                      <div key={user.id} className="bg-neutral-50 p-6 rounded-[2rem] border border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-inner bg-white flex items-center justify-center">
                            {user.image ? (
                              <Image src={user.image} alt={user.name || ''} fill className="object-cover" />
                            ) : (
                              <Users className="text-neutral-300" size={32} />
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-neutral-900 tracking-tight">{user.name || 'Anonymous'}</h4>
                            <p className="text-sm font-bold text-neutral-400">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex sm:justify-end">
                          {user.status === 'FRIEND' ? (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-5 py-2.5 rounded-xl font-bold text-sm border border-green-100">
                              <UserCheck size={18} /> Friends
                            </div>
                          ) : user.status === 'REQUEST_SENT' ? (
                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-sm border border-blue-100">
                              <Loader2 size={18} className="animate-spin" /> Request Sent
                            </div>
                          ) : user.status === 'REQUEST_RECEIVED' ? (
                            <button 
                              onClick={() => handleAcceptRequest(user.requestId!)}
                              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg w-full sm:w-auto justify-center"
                            >
                              <Check size={18} /> Accept Request
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleSendRequest(user.id)}
                              disabled={sendRequest.isPending}
                              className="bg-black text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-50 w-full sm:w-auto justify-center"
                            >
                              <UserPlus size={18} /> Add Friend
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-neutral-50 rounded-[2.5rem] border border-dashed border-neutral-200">
                      <Users size={64} className="text-neutral-200 mx-auto mb-6" />
                      <h4 className="text-xl font-black text-neutral-400 tracking-tight italic">No users found matching "{searchQuery}"</h4>
                    </div>
                  )
                ) : (
                  <div className="text-center py-20 bg-neutral-50 rounded-[2.5rem] border border-dashed border-neutral-200">
                    <Globe size={64} className="text-neutral-200 mx-auto mb-6" />
                    <h4 className="text-xl font-black text-neutral-400 tracking-tight italic uppercase tracking-widest">Discover new readers</h4>
                    <p className="text-sm font-bold text-neutral-300 mt-2">Enter at least 2 characters to search</p>
                  </div>
                )}
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
                            {(friend.name || 'A')[0]}
                          </div>
                        )}
                      </div>
                      
                      <h4 className="text-xl font-black text-neutral-900 tracking-tight">{friend.name || 'Anonymous'}</h4>
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">{friend.email}</p>
                      
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
                              {(req.sender?.name || 'A')[0]}
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
                              {(req.receiver?.name || 'A')[0]}
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
