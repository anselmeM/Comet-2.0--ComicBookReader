'use client';

import { useState } from 'react';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  {
    key: 'Page Navigation',
    keys: ['Space', '◀', '▶', 'a', 'A', 'd', 'D', 'ArrowRight', 'ArrowLeft'],
    label: 'Page Turns',
    desc: 'Space / ArrowRight / D to go forward; ArrowLeft / A to go backward.',
  },
  {
    key: 'Fullscreen Toggle',
    keys: ['F', 'f'],
    label: 'Fullscreen Toggle',
    desc: 'F key toggles the PWA fullscreen view.',
  },
  {
    key: 'Bookmarks Toggle',
    keys: ['B', 'b'],
    label: 'Toggle Bookmark',
    desc: 'B key bookmarks/unbookmarks current page.',
  },
  {
    key: 'Zoom Controls',
    keys: ['+', '-', '0', '='],
    label: 'Zoom Controls',
    desc: '+ / - to zoom in/out, 0 to reset zoom.',
  },
];

/** Interactive keyboard cheat sheet — hover a keycap or an action to cross-highlight. */
export const KeyboardShortcutsSettings = () => {
  const [activeShortcut, setActiveShortcut] = useState<string | null>(null);

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-comet-text flex items-center gap-2 border-b border-comet-border pb-2">
        <Keyboard className="text-comet-muted" />
        Interactive Keyboard Cheat Sheet
      </h2>

      <div className="bg-comet-surface border border-comet-border rounded-2xl p-8 space-y-8">
        <div>
          <h3 className="text-lg font-bold text-comet-text mb-2">Desktop Shortcuts</h3>
          <p className="text-comet-muted text-sm">
            Hover over a keycap on the mockup to view its associated reading action, or hover over
            an action list item to see the keycaps light up.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="w-full lg:w-3/5 bg-comet-surface-2 border border-comet-border rounded-2xl p-6 shadow-2xl overflow-x-auto custom-scrollbar flex flex-col gap-2 min-w-[500px]">
            {(() => {
              const keyboardRows = [
                [
                  { label: 'Esc', width: 'w-10' },
                  { label: '1' },
                  { label: '2' },
                  { label: '3' },
                  { label: '4' },
                  { label: '5' },
                  { label: '6' },
                  { label: '7' },
                  { label: '8' },
                  { label: '9' },
                  { label: '0' },
                  { label: '-' },
                  { label: '+' },
                  { label: 'Del', width: 'w-10' },
                ],
                [
                  { label: 'Tab', width: 'w-10' },
                  { label: 'Q' },
                  { label: 'W' },
                  { label: 'E' },
                  { label: 'R' },
                  { label: 'T' },
                  { label: 'Y' },
                  { label: 'U' },
                  { label: 'I' },
                  { label: 'O' },
                  { label: 'P' },
                  { label: '[' },
                  { label: ']' },
                  { label: '\\', width: 'w-10' },
                ],
                [
                  { label: 'Caps', width: 'w-12' },
                  { label: 'A' },
                  { label: 'S' },
                  { label: 'D' },
                  { label: 'F' },
                  { label: 'G' },
                  { label: 'H' },
                  { label: 'J' },
                  { label: 'K' },
                  { label: 'L' },
                  { label: ';' },
                  { label: "'" },
                  { label: 'Enter', width: 'w-12' },
                ],
                [
                  { label: 'Shift', width: 'w-16' },
                  { label: 'Z' },
                  { label: 'X' },
                  { label: 'C' },
                  { label: 'V' },
                  { label: 'B' },
                  { label: 'N' },
                  { label: 'M' },
                  { label: ',' },
                  { label: '.' },
                  { label: '/' },
                  { label: '▲', width: 'w-9' },
                ],
                [
                  { label: 'Ctrl', width: 'w-9' },
                  { label: 'Opt', width: 'w-9' },
                  { label: 'Cmd', width: 'w-9' },
                  { label: 'Space', width: 'w-36' },
                  { label: '◀', width: 'w-9' },
                  { label: '▼', width: 'w-9' },
                  { label: '▶', width: 'w-9' },
                ],
              ];

              return keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-start gap-1">
                  {row.map((key) => {
                    const widthClass = key.width || 'w-9';
                    const keyLabel = key.label;

                    let isHighlighted = false;
                    if (activeShortcut) {
                      const activeItem = shortcuts.find((s) => s.key === activeShortcut);
                      if (activeItem?.keys.includes(keyLabel)) {
                        isHighlighted = true;
                      }
                    }

                    return (
                      <div
                        key={keyLabel}
                        onMouseEnter={() => {
                          const found = shortcuts.find((s) => s.keys.includes(keyLabel));
                          if (found) {
                            setActiveShortcut(found.key);
                          }
                        }}
                        onMouseLeave={() => setActiveShortcut(null)}
                        className={`h-9 flex items-center justify-center rounded-md border font-mono text-[10px] select-none transition-all duration-200 cursor-pointer ${widthClass} ${
                          isHighlighted
                            ? 'bg-comet-accent/25 border-comet-accent text-comet-accent shadow-[0_0_12px_rgba(124,106,247,0.5)] scale-105 z-10'
                            : 'bg-comet-surface border-comet-border text-comet-muted hover:border-comet-accent hover:text-comet-text hover:bg-comet-surface-2'
                        }`}
                      >
                        {keyLabel}
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
          </div>

          <div className="w-full lg:w-2/5 space-y-3">
            {shortcuts.map((shortcut) => {
              const isActive = activeShortcut === shortcut.key;
              return (
                <div
                  key={shortcut.key}
                  onMouseEnter={() => setActiveShortcut(shortcut.key)}
                  onMouseLeave={() => setActiveShortcut(null)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-comet-accent/5 border-comet-accent/30 shadow-[0_0_15px_rgba(124,106,247,0.05)]'
                      : 'bg-comet-surface/50 border-comet-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-comet-accent' : 'text-comet-text'}`}
                    >
                      {shortcut.label}
                    </span>
                    <div className="flex gap-1">
                      {shortcut.keys
                        .filter((k) => k.length <= 5)
                        .map((k) => (
                          <kbd
                            key={k}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                              isActive
                                ? 'bg-comet-accent/20 border-comet-accent/40 text-comet-accent'
                                : 'bg-comet-surface-2 border-comet-border text-comet-muted'
                            }`}
                          >
                            {k}
                          </kbd>
                        ))}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-450 leading-relaxed">{shortcut.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
