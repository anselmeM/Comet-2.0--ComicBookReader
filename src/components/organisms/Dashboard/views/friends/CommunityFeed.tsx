import { Zap, Loader2, Check, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { formatTimeAgo } from '@/lib/format';
import { getErrorMessage } from '@/lib/errors';
import { useFeed } from '@/hooks/useFeed';
import { useReactToActivity } from '@/hooks/useSocialFeatures';
import { useNotification } from '@/components/atoms/Toast';

const reactionEmojis: Record<string, string> = {
  FIRE: '🔥',
  HEART: '❤️',
  LIKE: '👍',
  TROPHY: '🏆',
};

type ReactionType = 'FIRE' | 'HEART' | 'LIKE' | 'TROPHY';

function getReactionCount(
  reactions: { reactionType: string; userId: string }[] = [],
  type: string,
) {
  return reactions.filter((r) => r.reactionType === type).length;
}

function hasUserReacted(
  reactions: { reactionType: string; userId: string }[] = [],
  type: string,
  currentUserId?: string,
) {
  return reactions.some((r) => r.reactionType === type && r.userId === currentUserId);
}

/** TAB: Live Community Feed — reading activity with emoji reactions. */
export const CommunityFeed = () => {
  const { data: feed, isLoading: isLoadingFeed } = useFeed();
  const reactToActivity = useReactToActivity();
  const { triggerNotification } = useNotification();
  const { data: session } = useSession();

  const handleToggleReaction = async (activityId: string, type: ReactionType) => {
    try {
      await reactToActivity.mutateAsync({ activityId, reactionType: type });
    } catch (err) {
      triggerNotification(getErrorMessage(err) || 'Failed to toggle reaction', 'error');
    }
  };

  return (
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
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-2 border-white shadow-sm ${
                      activity.type === 'FINISHED' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
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
                <div className="flex flex-wrap gap-2">
                  {Object.entries(reactionEmojis).map(([type, emoji]) => {
                    const count = getReactionCount(activity.reactions, type);
                    const reacted = hasUserReacted(activity.reactions, type, session?.user?.id);
                    if (count === 0) return null;
                    return (
                      <button
                        key={type}
                        onClick={() => handleToggleReaction(activity.id, type as ReactionType)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm border cursor-pointer ${
                          reacted
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

                <div className="flex gap-1 items-center bg-comet-surface-2 border border-comet-border px-3 py-1 rounded-full shadow-inner select-none">
                  {Object.entries(reactionEmojis).map(([type, emoji]) => {
                    const reacted = hasUserReacted(activity.reactions, type, session?.user?.id);
                    return (
                      <button
                        key={type}
                        onClick={() => handleToggleReaction(activity.id, type as ReactionType)}
                        className={`p-1 text-base hover:scale-125 transition-all cursor-pointer ${
                          reacted ? 'grayscale-0 scale-105' : 'grayscale hover:grayscale-0'
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
            <p className="text-comet-muted font-bold italic">The community is quiet right now...</p>
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
  );
};
