import React, { useState } from 'react';
import {
  Radio,
  Tv,
  Share2,
  Download,
  Users,
  LogOut,
  Shield,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import { Session } from '../types';

interface HeaderProps {
  session: Session;
  isHost: boolean;
  participantCount: number;
  onOpenQRCode: () => void;
  onOpenPresenter: () => void;
  onOpenExport: () => void;
  onOpenShortcuts?: () => void;
  onLeaveSession: () => void;
  onToggleHostMode: () => void;
  onToast: (type: 'error' | 'success' | 'info', message: string, title?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  isHost,
  participantCount,
  onOpenQRCode,
  onOpenPresenter,
  onOpenExport,
  onOpenShortcuts,
  onLeaveSession,
  onToggleHostMode,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(session.code);
      setCopied(true);
      onToast('success', `Session code ${session.code} copied to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('info', `Join code: ${session.code}`);
    }
  };

  const handleShareLink = async () => {
    const url = `${window.location.origin}/?code=${session.code}`;
    try {
      await navigator.clipboard.writeText(url);
      onToast('success', 'Direct session link copied to clipboard!');
    } catch {
      onToast('info', url);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
          </div>
          <div className="min-w-0 max-w-[130px] sm:max-w-xs md:max-w-md">
            <h1 className="text-xs sm:text-sm md:text-base font-semibold truncate text-zinc-100">
              {session.title}
            </h1>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-400">
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-zinc-300">
                <Users className="w-3 h-3 text-zinc-400" />
                <span>{participantCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: Code Badge & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={handleCopyCode}
            aria-label={`Copy session code ${session.code}`}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-xs font-mono font-bold tracking-wider text-indigo-300 transition-colors cursor-pointer group"
          >
            <span className="text-zinc-400 text-[10px] font-sans font-normal hidden sm:inline">CODE:</span>
            <span className="text-indigo-400 group-hover:text-white transition-colors">{session.code}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 shrink-0" />
            )}
          </button>

          {/* QR Code Generator with Pulse and 'Scan Me' Tooltip */}
          <div className="relative group">
            <button
              onClick={onOpenQRCode}
              aria-label="Show session QR code to scan with mobile"
              className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-600/50 hover:border-indigo-500 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-indigo-500/20"
            >
              {/* Pulsing icon wrapper */}
              <div className="relative flex items-center justify-center">
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                <QrCode className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>

              {/* Text & 'Scan Me' badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5">
                <span className="font-semibold">QR</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 animate-pulse">
                  Scan Me
                </span>
              </span>
            </button>

            {/* Discoverability Tooltip */}
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-50 whitespace-nowrap">
              <div className="relative bg-zinc-900 border border-indigo-500/50 rounded-xl px-2.5 py-1.5 shadow-2xl text-[11px] text-zinc-200 flex items-center gap-1.5">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-t border-l border-indigo-500/50 rotate-45" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                <span>Scan with phone camera to join</span>
              </div>
            </div>
          </div>

          {/* Share */}
          <button
            onClick={handleShareLink}
            aria-label="Share direct join link"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy join link"
          >
            <Share2 className="w-4 h-4 text-zinc-400" />
            <span className="hidden xl:inline">Share</span>
          </button>

          {/* Presenter Mode */}
          <button
            onClick={onOpenPresenter}
            aria-label="Open Presenter View (Alt+P)"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open projector presenter view (Alt + P)"
          >
            <Tv className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Presenter</span>
          </button>

          {/* Export */}
          <button
            onClick={onOpenExport}
            aria-label="Export session data (Alt+E)"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export Q&A and Poll results (Alt + E)"
          >
            <Download className="w-4 h-4 text-zinc-400" />
            <span className="hidden xl:inline">Export</span>
          </button>

          {/* Host Toggle */}
          <button
            onClick={onToggleHostMode}
            aria-label={isHost ? "Switch to Audience view (Alt+H)" : "Switch to Host view (Alt+H)"}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isHost
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isHost ? "Host mode active (Alt + H)" : "Enable Host moderation controls (Alt + H)"}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">{isHost ? 'Host Mode' : 'Host View'}</span>
          </button>

          {/* Keyboard Shortcuts Help */}
          {onOpenShortcuts && (
            <button
              onClick={onOpenShortcuts}
              aria-label="Keyboard Shortcuts (Press ?)"
              className="p-1.5 px-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-mono font-bold transition-colors cursor-pointer hidden sm:flex items-center gap-1 border border-zinc-800 hover:border-zinc-700"
              title="Keyboard shortcuts (?)"
            >
              <span>?</span>
            </button>
          )}

          {/* Exit */}
          <button
            onClick={onLeaveSession}
            aria-label="Exit session"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Leave session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
