import { Check, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getErrorMessage } from '@/lib/errors';
import { useFriendRequests, useHandleFriendRequest } from '@/hooks/useFriends';
import { useNotification } from '@/components/atoms/Toast';

/** TAB: Pending Requests — incoming (accept/decline) and sent requests. */
export const PendingRequests = () => {
  const { data: requests } = useFriendRequests();
  const handleRequest = useHandleFriendRequest();
  const { triggerNotification } = useNotification();

  const handleAccept = async (requestId: string) => {
    try {
      await handleRequest.mutateAsync({ requestId, action: 'ACCEPT' });
      triggerNotification('Friend request accepted!', 'success');
    } catch (err) {
      triggerNotification(getErrorMessage(err), 'error');
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await handleRequest.mutateAsync({ requestId, action: 'DECLINE' });
      triggerNotification('Friend request declined.', 'info');
    } catch (err) {
      triggerNotification(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12">
      <div className="space-y-6">
        <h3 className="text-xl font-black text-comet-text tracking-tight flex items-center gap-3 uppercase tracking-widest">
          Incoming Requests
          {requests?.incoming.length === 0 && (
            <span className="text-comet-muted font-medium lowercase tracking-normal">(None)</span>
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
                  onClick={() => handleAccept(req.id)}
                  className="bg-green-500 text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                  title="Accept"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => handleDecline(req.id)}
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
            <span className="text-comet-muted font-medium lowercase tracking-normal">(None)</span>
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
  );
};
