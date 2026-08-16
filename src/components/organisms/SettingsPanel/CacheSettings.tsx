'use client';

import { HardDrive, Trash2, RefreshCw, BookOpen } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { formatBytes } from '@/lib/format';
import { useStorage } from '@/hooks/useStorage';
import { useSettingsStore } from '@/stores/settingsStore';
import { evictCachedComic } from '@/lib/idb';

/** Offline Storage section — cache usage, health, budget slider, eviction. */
export const CacheSettings = () => {
  const { data: session } = useSession();
  const { info, clearCache, refresh } = useStorage(session?.user?.id);
  const cacheLimitGB = useSettingsStore((state) => state.cacheLimitGB);
  const setCacheLimitGB = useSettingsStore((state) => state.setCacheLimitGB);

  const handleClear = async () => {
    if (
      confirm(
        'Are you sure you want to clear your local comic cache? You will need to re-download or re-parse comics to read them offline.',
      )
    ) {
      await clearCache();
      alert('Cache cleared!');
    }
  };

  const handleEvictSingle = async (comicId: string) => {
    if (confirm('Remove this comic from local storage?')) {
      await evictCachedComic(comicId, session?.user?.id);
      await refresh();
    }
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
        <HardDrive className="text-comet-muted" />
        Offline Storage
      </h2>

      <div className="bg-comet-surface border border-comet-border rounded-2xl p-8 shadow-inner overflow-hidden relative">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-8">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-comet-text">Local Library Cache</h3>
            <p className="text-comet-muted text-sm max-w-lg">
              Comics you open are parsed and stored locally for instant, offline access.
            </p>
          </div>

          <button
            onClick={handleClear}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 active:scale-95 transition-all shrink-0 font-semibold"
          >
            <Trash2 size={20} />
            <span>Clear Cache</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-comet-muted text-xs font-bold uppercase tracking-wider">
                Used Space
              </span>
              <div className="text-3xl font-black text-comet-text">
                {info.loading ? '...' : formatBytes(info.idbCustomUsage)}
              </div>
            </div>

            {(() => {
              const limitBytes = cacheLimitGB * 1024 * 1024 * 1024;
              const isNearLimit = info.idbCustomUsage / limitBytes > 0.8;
              return (
                <div className="text-right space-y-1">
                  <span className="text-comet-muted text-xs font-bold uppercase tracking-wider text-right block">
                    Storage Health
                  </span>
                  <div
                    className={`text-sm font-bold flex items-center gap-2 ${
                      isNearLimit ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        isNearLimit
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      }`}
                    />
                    {isNearLimit ? 'Near Capacity' : 'Healthy'}
                  </div>
                </div>
              );
            })()}
          </div>

          {(() => {
            const limitBytes = cacheLimitGB * 1024 * 1024 * 1024;
            const usagePercent = Math.min(100, (info.idbCustomUsage / limitBytes) * 100);
            const isNearLimit = usagePercent > 80;
            return (
              <>
                <div className="relative w-full h-4 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      isNearLimit
                        ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-comet-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    }`}
                    style={{
                      width: `${Math.max(2, usagePercent)}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs text-comet-muted">
                  <span>
                    Limit: {formatBytes(limitBytes)} (Browser Quota:{' '}
                    {info.quota > 0 ? formatBytes(info.quota) : 'Unlimited'})
                  </span>
                  <div className="flex items-center gap-3">
                    <span>* Estimated usage for parsed pages.</span>
                    <button
                      onClick={refresh}
                      className="text-comet-accent hover:text-comet-text transition-colors flex items-center gap-1 font-bold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                </div>
              </>
            );
          })()}

          <div className="mt-6 pt-6 border-t border-comet-border space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="cache-limit-slider" className="text-sm font-semibold text-comet-text">
                Auto-Cache Budget
              </label>
              <span className="text-comet-text font-mono font-bold text-sm bg-comet-surface-2 px-3 py-1 rounded-lg border border-comet-border">
                {cacheLimitGB.toFixed(1)} GB
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="cache-limit-slider"
                type="range"
                min="0.5"
                max="10.0"
                step="0.5"
                value={cacheLimitGB}
                onChange={(e) => setCacheLimitGB(parseFloat(e.target.value))}
                className="w-full h-2 bg-comet-surface-2 rounded-lg appearance-none cursor-pointer accent-comet-accent"
              />
            </div>
            <p className="text-xs text-comet-muted leading-relaxed">
              Comet will automatically evict the least recently read comics when cached comic files
              exceed this limit to keep your local storage clean.
            </p>
          </div>

          {info.cachedComics && info.cachedComics.length > 0 && (
            <div className="mt-8 pt-6 border-t border-comet-border">
              <h4 className="text-sm font-semibold text-comet-muted uppercase tracking-wider mb-4">
                Downloaded Comics
              </h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {info.cachedComics
                  .sort((a, b) => b.sizeBytes - a.sizeBytes)
                  .map((comic) => (
                    <div
                      key={comic.comicId}
                      className="flex items-center justify-between p-3 bg-comet-surface/50 border border-comet-border rounded-xl hover:bg-comet-surface-2 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {comic.coverUrl ? (
                          <div className="w-10 h-14 rounded bg-comet-surface-2 overflow-hidden shrink-0 border border-comet-border">
                            <img
                              src={comic.coverUrl}
                              alt="Cover"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-14 rounded bg-comet-surface-2 flex items-center justify-center shrink-0 border border-comet-border">
                            <BookOpen size={16} className="text-comet-muted" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-comet-text truncate w-full">
                            {comic.title || 'Unknown Title'}
                          </p>
                          <p className="text-xs text-comet-muted font-mono">
                            {formatBytes(comic.sizeBytes)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleEvictSingle(comic.comicId)}
                        className="p-2 text-comet-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0 ml-4"
                        title="Remove from device"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
