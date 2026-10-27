import React, { useState } from 'react';
import { Radio, Sparkles, ArrowRight, PlusCircle, LogIn, Users } from 'lucide-react';

interface JoinCreateModalProps {
  initialCode?: string;
  onJoin: (code: string, displayName: string) => Promise<boolean>;
  onCreate: (title: string, hostName: string) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const JoinCreateModal: React.FC<JoinCreateModalProps> = ({
  initialCode = '',
  onJoin,
  onCreate,
  onSeedDemo,
  isLoading,
  error,
}) => {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [displayName, setDisplayName] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createHostName, setCreateHostName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setLocalError('Please enter a 6-character join code.');
      return;
    }
    if (code.length !== 6) {
      setLocalError('Join code must be exactly 6 characters.');
      return;
    }

    const success = await onJoin(code, displayName.trim());
    if (!success) {
      // Parent handles error or passes prop
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const title = createTitle.trim();
    if (!title) {
      setLocalError('Please enter a session title.');
      return;
    }
    await onCreate(title, createHostName.trim());
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* App Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/25 mb-4">
            <Radio className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">LivePulse</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Real-time interactive Q&A and live polling for events & meetups
          </p>
        </div>

        {/* Tab Selection */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex bg-zinc-950 p-1 rounded-xl mb-6 border border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                setMode('join');
                setLocalError(null);
              }}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'join'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Join Session
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('create');
                setLocalError(null);
              }}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'create'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Host Event
            </button>
          </div>

          {(localError || error) && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs sm:text-sm">
              {localError || error}
            </div>
          )}

          {mode === 'join' ? (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label htmlFor="join-code" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  6-Character Event Code
                </label>
                <input
                  id="join-code"
                  type="text"
                  maxLength={6}
                  placeholder="e.g. DEMO26"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-center font-mono text-2xl font-bold tracking-widest text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-600 placeholder:text-base placeholder:font-normal"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="display-name" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Your Display Name <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="display-name"
                  type="text"
                  maxLength={30}
                  placeholder="e.g. Alex M. or leave blank"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span>Connecting to room...</span>
                ) : (
                  <>
                    <span>Enter Live Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label htmlFor="event-title" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Event / Presentation Title *
                </label>
                <input
                  id="event-title"
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Annual Engineering All-Hands 2026"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="host-name" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Host Name <span className="text-zinc-500 font-normal lowercase">(optional)</span>
                </label>
                <input
                  id="host-name"
                  type="text"
                  maxLength={30}
                  placeholder="e.g. Sarah Jenkins (Host)"
                  value={createHostName}
                  onChange={(e) => setCreateHostName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span>Generating session code...</span>
                ) : (
                  <>
                    <span>Create Session & Get Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Launch */}
          <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-400 mb-3">Want to preview the tool immediately?</p>
            <button
              type="button"
              onClick={onSeedDemo}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 hover:text-white border border-zinc-700 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Launch Pre-Loaded Demo Session (DEMO26)</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs text-zinc-500">
          <div className="p-2">
            <p className="font-semibold text-zinc-400">Zero Friction</p>
            <p className="text-[11px] mt-0.5">No login required</p>
          </div>
          <div className="p-2 border-x border-zinc-800/80">
            <p className="font-semibold text-zinc-400">Real-Time Sync</p>
            <p className="text-[11px] mt-0.5">Bi-directional WebSockets</p>
          </div>
          <div className="p-2">
            <p className="font-semibold text-zinc-400">Strict Anti-Duplicate</p>
            <p className="text-[11px] mt-0.5">1 vote per person</p>
          </div>
        </div>
      </div>
    </div>
  );
};
