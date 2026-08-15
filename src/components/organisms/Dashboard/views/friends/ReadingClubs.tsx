import { Users, Loader2, BookOpen, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useReadingClubs } from '@/hooks/useSocialFeatures';
import { useNotification } from '@/components/atoms/Toast';

interface ReadingClubsProps {
  onOpenDiscussion: (comicId: string, title: string) => void;
}

/** TAB: Shared Reading Clubs — group progress + discussion entry points. */
export const ReadingClubs = ({ onOpenDiscussion }: ReadingClubsProps) => {
  const { data: clubs, isLoading: isLoadingClubs } = useReadingClubs();
  const { triggerNotification } = useNotification();

  return (
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
          {clubs.map((club) => (
            <div
              key={club.key}
              className="bg-comet-surface p-4 sm:p-6 lg:p-8 rounded-[2.5rem] border border-comet-border shadow-sm flex gap-6 hover:shadow-xl hover:border-blue-100 transition-all"
            >
              <div className="relative w-24 h-36 rounded-2xl overflow-hidden shrink-0 shadow-md bg-comet-surface-2">
                {club.coverUrl ? (
                  <Image src={club.coverUrl} alt={club.title} fill className="object-cover" />
                ) : (
                  <BookOpen size={28} className="text-comet-muted absolute inset-0 m-auto" />
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-comet-text tracking-tighter truncate leading-tight">
                    {club.title}
                  </h4>
                  <p className="text-[10px] font-bold text-comet-muted uppercase tracking-widest">
                    {club.series} {club.issue !== null && `#${club.issue}`}
                  </p>
                </div>

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
                        onOpenDiscussion(club.userComicId, club.title);
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
                      Discuss Issue ({club.activeReaders.length + (club.userProgress ? 1 : 0)}{' '}
                      Readers)
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
            When you and your friends read the same issues simultaneously, they will show up here as
            shared queues!
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
  );
};
