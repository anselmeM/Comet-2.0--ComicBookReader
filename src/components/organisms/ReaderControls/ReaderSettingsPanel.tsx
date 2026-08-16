'use client';

import { useReaderStore } from '@/stores/readerStore';

interface ReaderSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

/** Reader preferences popover — visual filters, guided-view camera, autoplay. */
export const ReaderSettingsPanel = ({ open, onClose }: ReaderSettingsPanelProps) => {
  const sepia = useReaderStore((state) => state.sepia);
  const setSepia = useReaderStore((state) => state.setSepia);
  const grayscale = useReaderStore((state) => state.grayscale);
  const setGrayscale = useReaderStore((state) => state.setGrayscale);
  const contrast = useReaderStore((state) => state.contrast);
  const setContrast = useReaderStore((state) => state.setContrast);
  const sharpen = useReaderStore((state) => state.sharpen);
  const setSharpen = useReaderStore((state) => state.setSharpen);
  const panSpeed = useReaderStore((state) => state.panSpeed);
  const setPanSpeed = useReaderStore((state) => state.setPanSpeed);
  const panEase = useReaderStore((state) => state.panEase);
  const setPanEase = useReaderStore((state) => state.setPanEase);
  const isAutoplayActive = useReaderStore((state) => state.isAutoplayActive);
  const toggleAutoplay = useReaderStore((state) => state.toggleAutoplay);
  const autoplayDelay = useReaderStore((state) => state.autoplayDelay);
  const setAutoplayDelay = useReaderStore((state) => state.setAutoplayDelay);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 mx-auto max-w-lg bg-comet-surface/95 backdrop-blur-xl border border-comet-border rounded-3xl p-6 text-comet-text shadow-2xl z-50 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
      <div className="flex items-center justify-between border-b border-comet-border pb-3 mb-4">
        <h3 className="font-semibold text-sm tracking-wide uppercase text-comet-muted">
          Reader Preferences
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-comet-muted hover:text-comet-text text-xs font-medium bg-comet-surface-2 hover:bg-comet-surface-2/80 px-2.5 py-1 rounded-full transition-colors"
        >
          Done
        </button>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-comet-muted uppercase tracking-wider">
            Visual Enhancements
          </h4>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-comet-text min-w-[70px]">Sepia Overlay</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={sepia}
              onChange={(e) => setSepia(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-comet-surface-2 rounded-full appearance-none accent-comet-accent cursor-pointer"
            />
            <span className="text-xs font-mono text-comet-muted w-8 text-right">
              {Math.round(sepia * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-comet-text min-w-[70px]">Grayscale</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={grayscale}
              onChange={(e) => setGrayscale(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-comet-surface-2 rounded-full appearance-none accent-comet-accent cursor-pointer"
            />
            <span className="text-xs font-mono text-comet-muted w-8 text-right">
              {Math.round(grayscale * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-comet-text min-w-[70px]">Contrast</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={contrast}
              onChange={(e) => setContrast(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-comet-surface-2 rounded-full appearance-none accent-comet-accent cursor-pointer"
            />
            <span className="text-xs font-mono text-comet-muted w-8 text-right">
              {contrast.toFixed(1)}x
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-comet-text">Sharpen Scans (SVG filter)</span>
            <button
              type="button"
              onClick={() => setSharpen(!sharpen)}
              className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${sharpen ? 'bg-comet-accent' : 'bg-comet-surface-2'}`}
            >
              <span
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${sharpen ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-comet-border">
          <h4 className="text-xs font-bold text-comet-muted uppercase tracking-wider">
            Guided View Camera
          </h4>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-comet-text min-w-[70px]">Pan Duration</span>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={panSpeed}
              onChange={(e) => setPanSpeed(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-comet-surface-2 rounded-full appearance-none accent-comet-accent cursor-pointer"
            />
            <span className="text-xs font-mono text-comet-muted w-8 text-right">
              {panSpeed.toFixed(1)}s
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-comet-text">Camera Easing</span>
            <select
              value={panEase}
              onChange={(e) => setPanEase(e.target.value)}
              className="bg-comet-surface-2 text-xs text-comet-text border border-comet-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-comet-accent cursor-pointer"
            >
              <option value="linear">Linear</option>
              <option value="easeIn">Ease In</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeInOut">Ease In Out</option>
            </select>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-comet-border">
          <h4 className="text-xs font-bold text-comet-muted uppercase tracking-wider">
            Smart Autoplay
          </h4>

          <div className="flex items-center justify-between">
            <span className="text-xs text-comet-text">Enable Autoplay</span>
            <button
              type="button"
              onClick={() => toggleAutoplay()}
              className={`w-10 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${isAutoplayActive ? 'bg-comet-accent' : 'bg-comet-surface-2'}`}
            >
              <span
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${isAutoplayActive ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-comet-text min-w-[70px]">Page Hold</span>
            <input
              type="range"
              min="1500"
              max="10000"
              step="500"
              value={autoplayDelay}
              onChange={(e) => setAutoplayDelay(parseInt(e.target.value, 10))}
              disabled={!isAutoplayActive}
              className="flex-1 h-1 bg-comet-surface-2 rounded-full appearance-none accent-comet-accent cursor-pointer disabled:opacity-30"
            />
            <span className="text-xs font-mono text-comet-muted w-8 text-right">
              {(autoplayDelay / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
