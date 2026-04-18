import React, { useState } from 'react';
import { ChevronLeft, MessageSquare, Heart, Bookmark, UserPlus, UserMinus, Globe, Shield } from 'lucide-react';
import Image from 'next/image';

interface Activity {
  id: string;
  userName: string;
  userImage?: string;
  type: 'READ' | 'FAV' | 'FOLLOW';
  targetName: string;
  timestamp: string;
}

const mockActivities: Activity[] = [
  { id: '1', userName: 'Alex Rivera', userImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80', type: 'READ', targetName: 'Batman: Year One', timestamp: '2h ago' },
  { id: '2', userName: 'Sarah Chen', userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80', type: 'FAV', targetName: 'The Sandman #1', timestamp: '5h ago' },
  { id: '3', userName: 'Mike Ross', userImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', type: 'FOLLOW', targetName: 'Melissa Doe', timestamp: 'Yesterday' },
  { id: '4', userName: 'Alex Rivera', userImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80', type: 'READ', targetName: 'Watchmen #4', timestamp: '2 days ago' },
];

interface FriendsViewProps {
  setActiveView: (view: string) => void;
}

export const FriendsView = ({ setActiveView }: FriendsViewProps) => {
  const [following, setFollowing] = useState<string[]>(['1', '2']);

  const toggleFollow = (id: string) => {
    setFollowing(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveView('dashboard')}
            className="p-4 bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-all text-neutral-400 hover:text-blue-500 shadow-sm"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-4xl font-black text-neutral-900 tracking-tighter italic">Friends & Community</h2>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">See what your circle is reading</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="bg-white border border-neutral-100 text-neutral-500 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:border-neutral-300 transition-all">
            <Globe size={18} /> Global Feed
          </button>
          <button className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
            <UserPlus size={18} /> Find Friends
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Activity Feed */}
        <div className="lg:col-span-8 space-y-8">
          <h3 className="text-xl font-black text-neutral-800 tracking-tight flex items-center gap-3">
            <MessageSquare size={20} className="text-blue-500" /> Recent Activity
          </h3>
          
          <div className="space-y-4">
            {mockActivities.map(activity => (
              <div key={activity.id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-5">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-neutral-100">
                    {activity.userImage ? (
                      <Image src={activity.userImage} alt={activity.userName} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold">
                        {activity.userName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">
                      <span className="hover:text-blue-600 cursor-pointer">{activity.userName}</span>
                      <span className="text-neutral-400 font-medium ml-2">
                        {activity.type === 'READ' && 'is reading'}
                        {activity.type === 'FAV' && 'favourited'}
                        {activity.type === 'FOLLOW' && 'started following'}
                      </span>
                    </p>
                    <h4 className="text-base font-black text-neutral-800 mt-0.5 tracking-tight group-hover:text-blue-500 transition-colors cursor-pointer">
                      {activity.targetName}
                    </h4>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1 block">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {activity.type === 'READ' && (
                    <div className="bg-blue-50 text-blue-500 p-3 rounded-xl">
                      <Bookmark size={18} />
                    </div>
                  )}
                  {activity.type === 'FAV' && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-xl">
                      <Heart size={18} fill="currentColor" />
                    </div>
                  )}
                  {activity.type === 'FOLLOW' && (
                    <div className="bg-purple-50 text-purple-500 p-3 rounded-xl">
                      <UserPlus size={18} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Following Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <h3 className="text-xl font-black text-neutral-800 tracking-tight flex items-center gap-3">
            <Shield size={20} className="text-blue-500" /> Suggested
          </h3>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
            {[
              { id: '5', name: 'James Wilson', role: 'Editor', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80' },
              { id: '6', name: 'Elena Kostic', role: 'Super-fan', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80' },
              { id: '7', name: 'Tom Holland', role: 'Friendly Neighbor', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80' },
            ].map(user => (
              <div key={user.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md relative">
                    <Image src={user.img} alt={user.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-neutral-800 tracking-tight">{user.name}</h4>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleFollow(user.id)}
                  className={`p-2 rounded-xl transition-all ${following.includes(user.id) ? 'bg-blue-50 text-blue-500' : 'bg-neutral-50 text-neutral-400 hover:bg-blue-500 hover:text-white'}`}
                >
                  {following.includes(user.id) ? <UserMinus size={18} /> : <UserPlus size={18} />}
                </button>
              </div>
            ))}
            
            <button className="w-full py-4 border-2 border-dashed border-neutral-100 rounded-2xl text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] hover:border-blue-500 hover:text-blue-500 transition-all mt-4">
              View Recommended
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
