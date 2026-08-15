'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  ExternalLink, 
  UserCheck, 
  MessageCircle, 
  Heart, 
  AlertTriangle, 
  Sparkles,
  Clock,
  Circle
} from 'lucide-react';
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead, 
  useDeleteNotification, 
  useClearNotifications,
  Notification
} from '@/hooks/useNotifications';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/format';

interface NotificationDropdownProps {
  onClose: () => void;
}

export const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const clearAll = useClearNotifications();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST_ACCEPTED':
        return <UserCheck className="text-green-500" size={18} />;
      case 'NEW_MESSAGE':
        return <MessageCircle className="text-blue-500" size={18} />;
      case 'CONTENT_LIKE':
        return <Heart className="text-red-500" size={18} fill="currentColor" />;
      case 'CONTENT_COMMENT':
        return <MessageCircle className="text-purple-500" size={18} />;
      case 'NEW_CONTENT':
        return <Sparkles className="text-amber-500" size={18} />;
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="text-rose-500" size={18} />;
      default:
        return <Bell className="text-neutral-400" size={18} />;
    }
  };

  const handleMarkRead = async (id: string) => {
    await markRead.mutateAsync(id);
  };

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotif.mutateAsync(id);
  };

  const handleClearAll = async () => {
    if (confirm('Clear all notifications?')) {
      await clearAll.mutateAsync();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-full right-0 mt-4 w-[400px] bg-white rounded-[2rem] shadow-2xl border border-neutral-100 overflow-hidden z-[200] flex flex-col"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Header */}
      <div className="p-6 border-b border-neutral-50 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                {unreadCount} NEW
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="p-2 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
              title="Mark all as read"
            >
              <Check size={18} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[100px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          <AnimatePresence initial={false}>
            {notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  notif.isRead 
                    ? 'bg-white border-neutral-50 opacity-60 grayscale-[0.5]' 
                    : 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    notif.isRead ? 'bg-neutral-100' : 'bg-white shadow-sm'
                  }`}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={`text-sm font-bold truncate ${notif.isRead ? 'text-neutral-600' : 'text-neutral-900'}`}>
                        {notif.title}
                      </h4>
                      {!notif.isRead && <Circle size={8} fill="currentColor" className="text-blue-500 shrink-0 mt-1.5" />}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${notif.isRead ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {notif.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                      
                      {notif.link && (
                        <Link 
                          href={notif.link}
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                          }}
                          className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => handleDelete(e, notif.id)}
                  className="absolute top-2 right-2 p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="py-20 text-center space-y-4">
            <Bell size={48} className="mx-auto text-neutral-100" />
            <div>
              <p className="text-neutral-400 font-bold italic tracking-tight uppercase text-xs">All caught up!</p>
              <p className="text-[10px] text-neutral-300 font-medium mt-1">No new notifications for you.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 bg-neutral-50/50 border-t border-neutral-50 shrink-0">
          <button 
            onClick={handleClearAll}
            className="w-full py-3 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] hover:text-red-500 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={14} /> Clear All Notifications
          </button>
        </div>
      )}
    </motion.div>
  );
};
