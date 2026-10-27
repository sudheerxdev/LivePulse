import React, { useState } from 'react';
import {
  BarChart2,
  CheckCircle,
  Play,
  Square,
  Lock,
  Vote,
  Users,
  ListFilter
} from 'lucide-react';
import { Poll } from '../types';
import { D3PollBarChart } from './D3PollBarChart';

interface PollCardProps {
  poll: Poll;
  voterId: string;
  isHost: boolean;
  onVote: (pollId: string, optionId: number) => Promise<void>;
  onActivate: (pollId: string) => Promise<void>;
  onClose: (pollId: string) => Promise<void>;
}

export const PollCard: React.FC<PollCardProps> = ({
  poll,
  voterId,
  isHost,
  onVote,
  onActivate,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayMode, setDisplayMode] = useState<'options' | 'chart'>('options');

  const hasVoted = poll.voterChoices && poll.voterChoices[voterId] !== undefined;
  const selectedOptionId = hasVoted ? poll.voterChoices[voterId] : null;
  const isActive = poll.status === 'active';
  const isClosed = poll.status === 'closed';

  const handleOptionVote = async (optionId: number) => {
    if (hasVoted || !isActive || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onVote(poll.id, optionId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 ${
        isActive
          ? 'bg-zinc-900/95 border-indigo-500/50 shadow-xl shadow-indigo-950/30'
          : 'bg-zinc-900/60 border-zinc-800'
      }`}
    >
      {/* Header with Status and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? 'bg-emerald-950 border border-emerald-700/60 text-emerald-400'
                : isClosed
                ? 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                : 'bg-amber-950 border border-amber-800 text-amber-400'
            }`}
          >
            {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
            {isActive ? 'LIVE POLL' : isClosed ? 'POLL CLOSED' : 'DRAFT'}
          </span>

          <span className="flex items-center gap-1 text-xs text-zinc-400 font-mono">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'total votes'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Interactive Options vs D3 Bar Chart */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setDisplayMode('options')}
              aria-label="Show vote options"
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'options'
                  ? 'bg-zinc-800 text-white font-medium shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ListFilter className="w-3 h-3 text-zinc-400" />
              <span>Options</span>
            </button>
            <button
              onClick={() => setDisplayMode('chart')}
              aria-label="Show D3 animated bar chart"
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'chart'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-200" />
              <span>D3 Chart</span>
            </button>
          </div>

          {/* Host action buttons */}
          {isHost && (
            <div className="flex items-center gap-2">
              {!isActive && (
                <button
                  onClick={() => onActivate(poll.id)}
                  className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Launch Live
                </button>
              )}
              {isActive && (
                <button
                  onClick={() => onClose(poll.id)}
                  className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 text-rose-400" />
                  End Poll
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Question Title */}
      <h3 className="text-base sm:text-lg font-bold text-white mb-4 leading-snug">
        {poll.question}
      </h3>

      {/* Chart View vs Options View */}
      {displayMode === 'chart' ? (
        <div className="p-4 sm:p-5 rounded-xl bg-zinc-950/70 border border-zinc-800/90 my-2">
          <D3PollBarChart
            options={poll.options}
            totalVotes={poll.totalVotes}
            selectedOptionId={selectedOptionId}
            isActive={isActive}
          />
        </div>
      ) : (
        /* Option List */
        <div className="space-y-3">
          {poll.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const percentage =
              poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;

            return (
              <div
                key={option.id}
                onClick={() => {
                  if (isActive && !hasVoted) {
                    handleOptionVote(option.id);
                  }
                }}
                className={`relative overflow-hidden rounded-xl border transition-all ${
                  isActive && !hasVoted
                    ? 'cursor-pointer hover:border-indigo-500/60 hover:bg-zinc-800/80'
                    : 'cursor-default'
                } ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/30'
                    : 'border-zinc-800 bg-zinc-950/60'
                } p-3.5`}
              >
                {/* Background Animated Progress Bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isSelected
                      ? 'bg-indigo-600/25 border-r-2 border-indigo-500'
                      : 'bg-zinc-800/40'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Foreground Content */}
                <div className="relative z-10 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-600 text-white'
                          : hasVoted
                          ? 'border-zinc-700 text-transparent'
                          : 'border-zinc-600 group-hover:border-zinc-400'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`font-medium truncate ${isSelected ? 'text-indigo-200 font-semibold' : 'text-zinc-200'}`}>
                      {option.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    <span className="text-zinc-400 font-normal">
                      {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-4 pt-3 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5">
          {hasVoted ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              You voted on this poll (1 vote recorded)
            </span>
          ) : isActive ? (
            <span className="text-indigo-400 font-medium flex items-center gap-1">
              <Vote className="w-3.5 h-3.5" />
              Click an option above to submit your vote
            </span>
          ) : (
            <span className="text-zinc-500 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Voting closed for this poll
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
