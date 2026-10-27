import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Tv,
  Maximize2,
  Minimize2,
  ThumbsUp,
  BarChart3,
  Users,
  Radio,
  Flame,
  ArrowLeft,
  QrCode,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { SessionData, Question, Poll } from '../types';

interface PresenterViewProps {
  sessionData: SessionData;
  participantCount: number;
  onExit: () => void;
}

export const PresenterView: React.FC<PresenterViewProps> = ({
  sessionData,
  participantCount,
  onExit,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'both' | 'qa' | 'poll'>('both');
  const [presenterQr, setPresenterQr] = useState<string>('');

  const { session, questions, activePoll } = sessionData;

  // Filter to active questions and sort by upvotes descending
  const activeQuestions = questions
    .filter((q) => q.status === 'active')
    .sort((a, b) => b.upvotes - a.upvotes);

  const topQuestion: Question | undefined = activeQuestions[0];
  const runnerUps: Question[] = activeQuestions.slice(1, 4);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?code=${session.code}`
      : `http://localhost:3000/?code=${session.code}`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#09090b', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then(setPresenterQr)
      .catch(() => {});
  }, [joinUrl]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Top Projector Banner */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & Session Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            aria-label="Exit Presenter View"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Presenter</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Auditorium Live Display
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 text-xs flex items-center gap-1 font-mono">
                <Users className="w-3.5 h-3.5" />
                {participantCount} audience members
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-100 truncate max-w-xl">
              {session.title}
            </h1>
          </div>
        </div>

        {/* Center: Massive Join Code Box with QR Thumbnail */}
        <div className="flex items-center gap-4 bg-zinc-950/80 border-2 border-indigo-500/50 rounded-2xl px-5 py-2 shadow-xl shadow-indigo-950/40">
          {presenterQr && (
            <div className="p-1 bg-white rounded-xl shadow-md shrink-0">
              <img
                src={presenterQr}
                alt="Scan to join on phone"
                className="w-12 h-12 object-contain"
              />
            </div>
          )}
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Scan or Visit
            </p>
            <p className="text-xs font-mono text-indigo-300 truncate max-w-[180px]">
              {joinUrl}
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">CODE:</span>
            <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-violet-400">
              {session.code}
            </span>
          </div>
        </div>

        {/* Right: View mode controls */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/60 text-xs">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'both' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'qa' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Q&A Only
            </button>
            <button
              onClick={() => setActiveTab('poll')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'poll' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Poll Only
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            aria-label="Toggle Fullscreen"
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Toggle projector fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Top Questions Spotlight */}
        {(activeTab === 'both' || activeTab === 'qa') && (
          <section
            aria-label="Top Audience Questions"
            className={`${
              activeTab === 'qa' ? 'lg:col-span-12' : activeTab === 'both' && !activePoll ? 'lg:col-span-12' : 'lg:col-span-6 xl:col-span-7'
            } space-y-6`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-amber-400 animate-bounce" />
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-amber-400">
                  Highest Upvoted Question
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full">
                {activeQuestions.length} Active Questions
              </span>
            </div>

            {topQuestion ? (
              <div className="relative rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-2 border-indigo-500/40 p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
                {/* Spotlight Header */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs sm:text-sm font-black font-mono tracking-wider">
                      #1 MOST POPULAR
                    </span>
                    <span className="text-zinc-400 text-xs sm:text-sm">
                      by <strong className="text-zinc-200">{topQuestion.authorName}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 text-white font-mono font-black text-xl sm:text-2xl shadow-lg shadow-indigo-600/40">
                    <ThumbsUp className="w-5 h-5 fill-current" />
                    <span>{topQuestion.upvotes}</span>
                  </div>
                </div>

                {/* Big Readable Question Text */}
                <p className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight mt-3">
                  "{topQuestion.text}"
                </p>

                {/* Runner-up queue preview */}
                {runnerUps.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-zinc-800/80">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                      Up Next on Queue:
                    </p>
                    <div className="space-y-2.5">
                      {runnerUps.map((q, idx) => (
                        <div
                          key={q.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-sm"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-zinc-500 shrink-0">
                              #{idx + 2}
                            </span>
                            <span className="text-zinc-200 truncate font-medium">
                              {q.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-mono font-bold text-indigo-400 shrink-0">
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{q.upvotes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/30">
                <p className="text-lg font-semibold text-zinc-400">
                  Waiting for audience questions...
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  Use code <span className="font-mono font-bold text-indigo-400">{session.code}</span> to ask
                  the first question!
                </p>
              </div>
            )}
          </section>
        )}

        {/* Right Column: Live Active Poll Visualizer */}
        {(activeTab === 'both' || activeTab === 'poll') && (
          <section
            aria-label="Live Audience Poll"
            className={`${
              activeTab === 'poll' ? 'lg:col-span-12' : activeTab === 'both' && !topQuestion ? 'lg:col-span-12' : 'lg:col-span-6 xl:col-span-5'
            } space-y-6`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-violet-400" />
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-violet-400">
                  Live Active Poll
                </h2>
              </div>
              {activePoll && (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {activePoll.totalVotes} Total Votes
                </span>
              )}
            </div>

            {activePoll ? (
              <div className="rounded-3xl bg-zinc-900/90 border-2 border-violet-500/40 p-6 sm:p-8 shadow-2xl shadow-violet-950/40 backdrop-blur-xl">
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-6">
                  {activePoll.question}
                </h3>

                <div className="space-y-4">
                  {activePoll.options.map((option, idx) => {
                    const percentage =
                      activePoll.totalVotes > 0
                        ? Math.round((option.votes / activePoll.totalVotes) * 100)
                        : 0;

                    const barColors = [
                      'from-indigo-600 to-indigo-500',
                      'from-violet-600 to-violet-500',
                      'from-emerald-600 to-emerald-500',
                      'from-amber-600 to-amber-500',
                      'from-rose-600 to-rose-500',
                      'from-sky-600 to-sky-500',
                    ];
                    const gradient = barColors[idx % barColors.length];

                    return (
                      <div key={option.id} className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                        {/* Dynamic Progress Bar with animated transition */}
                        <div
                          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient} opacity-30 transition-all duration-700 ease-out`}
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-zinc-300 shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="text-base sm:text-lg font-semibold text-zinc-100 truncate">
                              {option.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 font-mono">
                            <span className="text-xs text-zinc-400">
                              {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                            </span>
                            <span className="text-xl sm:text-2xl font-black text-white min-w-[56px] text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/30">
                <BarChart3 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-zinc-400">
                  No active poll running right now
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  The speaker will launch a live poll during the session.
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer Instructions for Big Screen */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/80 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Real-time audience responses sync automatically via WebSockets.</span>
        </div>
        <div className="font-mono">
          LivePulse • Projector Mode
        </div>
      </footer>
    </div>
  );
};
