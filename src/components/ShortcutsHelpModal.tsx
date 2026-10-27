import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigation' | 'Modals' | 'Moderation';
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
  isHost,
}) => {
  if (!isOpen) return null;

  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌥ Option' : 'Alt';

  const shortcuts: ShortcutItem[] = [
    {
      keys: ['Esc'],
      description: 'Close active modal / exit Presenter view',
      category: 'Modals',
    },
    {
      keys: [modKey, 'P'],
      description: 'Toggle Presenter view (projector mode)',
      category: 'Navigation',
    },
    {
      keys: [modKey, 'Q'],
      description: 'Open Audience QR Code modal',
      category: 'Navigation',
    },
    {
      keys: [modKey, 'N'],
      description: 'Open "Ask a Question" dialog',
      category: 'Navigation',
    },
    {
      keys: [modKey, 'E'],
      description: 'Open "Export Data" modal',
      category: 'Navigation',
    },
    {
      keys: [modKey, 'H'],
      description: 'Toggle Host moderation view',
      category: 'Moderation',
    },
    {
      keys: ['?'],
      description: 'Show this keyboard shortcuts cheat sheet',
      category: 'Navigation',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl p-6 relative text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-sm font-bold text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-[11px] text-zinc-400">Fast host navigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="my-4 divide-y divide-zinc-800/80">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="py-2.5 flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-zinc-300">{sc.description}</span>
              <div className="flex items-center gap-1 shrink-0 font-mono">
                {sc.keys.map((k, ki) => (
                  <React.Fragment key={ki}>
                    {ki > 0 && <span className="text-zinc-500 text-[10px]">+</span>}
                    <kbd className="px-2 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-semibold shadow-inner">
                      {k}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-[11px] text-zinc-400">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[10px]">Esc</kbd> anytime to dismiss</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
