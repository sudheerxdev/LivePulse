import React from 'react';
import {
  ThumbsUp,
  CheckCircle2,
  EyeOff,
  Trash2,
  User,
  ShieldCheck,
  Clock,
  MoreVertical
} from 'lucide-react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  voterId: string;
  isHost: boolean;
  onUpvote: (questionId: string) => Promise<void>;
  onUpdateStatus: (questionId: string, status: 'active' | 'answered' | 'hidden') => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
  rank?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  voterId,
  isHost,
  onUpvote,
  onUpdateStatus,
  onDelete,
  rank,
}) => {
  const [isSubmittingVote, setIsSubmittingVote] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const hasUpvoted = question.upvoterIds.includes(voterId);
  const isAnswered = question.status === 'answered';
  const isHidden = question.status === 'hidden';

  const handleVoteClick = async () => {
    if (isSubmittingVote) return;
    setIsSubmittingVote(true);
    try {
      await onUpvote(question.id);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const formattedTime = new Date(question.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        isAnswered
          ? 'bg-zinc-900/50 border-emerald-900/40 text-zinc-300'
          : isHidden
          ? 'bg-zinc-900/40 border-amber-900/30 opacity-70'
          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 shadow-md'
      } p-4 sm:p-5 flex gap-3 sm:gap-4`}
    >
      {/* Upvote Button with Detailed Vote Count Tooltip (Left Column) */}
      <div className="shrink-0 flex flex-col items-center relative group/upvote">
        <button
          onClick={handleVoteClick}
          disabled={isSubmittingVote}
          title={`${question.upvotes} ${question.upvotes === 1 ? 'vote' : 'votes'} received${hasUpvoted ? ' (You upvoted)' : ''}`}
          aria-label={hasUpvoted ? `Already upvoted. Total ${question.upvotes} votes received` : `Upvote question. Currently ${question.upvotes} votes received`}
          aria-describedby={`upvote-tooltip-${question.id}`}
          className={`flex flex-col items-center justify-center min-w-[52px] px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
            hasUpvoted
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-102 font-bold ring-2 ring-indigo-400'
              : 'bg-zinc-800/90 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700/80 active:scale-95'
          }`}
        >
          <ThumbsUp
            className={`w-4 h-4 transition-transform ${
              hasUpvoted ? 'fill-current scale-110' : 'group-hover/upvote:translate-y-[-1px]'
            }`}
          />
          <span className="font-mono text-sm font-bold mt-1">
            {question.upvotes}
          </span>
        </button>

        {/* Detailed Vote Count Tooltip */}
        <div
          role="tooltip"
          id={`upvote-tooltip-${question.id}`}
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 pointer-events-none group-hover/upvote:opacity-100 group-focus-within/upvote:opacity-100 translate-y-1 group-hover/upvote:translate-y-0 group-focus-within/upvote:translate-y-0 transition-all duration-150 z-30 whitespace-nowrap"
        >
          <div className="relative bg-zinc-900 border border-indigo-500/50 rounded-xl px-2.5 py-1.5 shadow-xl text-[11px] text-zinc-100 font-medium flex items-center gap-1.5 backdrop-blur-md">
            <ThumbsUp className={`w-3 h-3 ${hasUpvoted ? 'text-indigo-400 fill-current' : 'text-zinc-400'}`} />
            <span>
              {hasUpvoted ? (
                <span className="text-indigo-300 font-semibold">You upvoted</span>
              ) : (
                <span className="text-zinc-400">Click to upvote</span>
              )}{' '}
              •{' '}
              <strong className="text-white font-mono font-bold">
                {question.upvotes} {question.upvotes === 1 ? 'vote' : 'votes'} received
              </strong>
            </span>
            {/* Arrow pointing down */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-b border-r border-indigo-500/50 rotate-45" />
          </div>
        </div>

        {rank !== undefined && rank <= 3 && (
          <span
            className={`mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
              rank === 1
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : rank === 2
                ? 'bg-zinc-700/40 text-zinc-300 border border-zinc-600/30'
                : 'bg-amber-800/20 text-amber-400 border border-amber-700/30'
            }`}
          >
            #{rank}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {/* Author & Timestamp */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1 font-medium text-zinc-300">
              {question.isAnonymous ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Anonymous</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate max-w-[140px] sm:max-w-none">{question.authorName}</span>
                </>
              )}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
              <Clock className="w-3 h-3" />
              {formattedTime}
            </span>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-1.5">
            {isAnswered && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Answered
              </span>
            )}
            {isHidden && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 border border-amber-800 text-amber-300">
                <EyeOff className="w-3 h-3 text-amber-400" />
                Hidden
              </span>
            )}

            {/* Host Moderation Menu Toggle */}
            {isHost && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  aria-label="Moderation options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-30 text-xs"
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    <button
                      onClick={() => {
                        onUpdateStatus(question.id, isAnswered ? 'active' : 'answered');
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2 text-zinc-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {isAnswered ? 'Mark Unanswered' : 'Mark as Answered'}
                    </button>
                    <button
                      onClick={() => {
                        onUpdateStatus(question.id, isHidden ? 'active' : 'hidden');
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-zinc-800 flex items-center gap-2 text-zinc-200"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                      {isHidden ? 'Unhide Question' : 'Hide from Audience'}
                    </button>
                    <div className="border-t border-zinc-800 my-1" />
                    <button
                      onClick={() => {
                        onDelete(question.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-rose-950/50 text-rose-300 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Delete Question
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Question Text */}
        <p className="text-sm sm:text-base font-normal text-zinc-100 leading-relaxed break-words whitespace-pre-wrap">
          {question.text}
        </p>

        {/* Quick Host Action Buttons on Hover */}
        {isHost && (
          <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center gap-2 text-xs">
            <button
              onClick={() => onUpdateStatus(question.id, isAnswered ? 'active' : 'answered')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isAnswered
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              {isAnswered ? 'Mark Active' : 'Mark Answered'}
            </button>
            <button
              onClick={() => onUpdateStatus(question.id, isHidden ? 'active' : 'hidden')}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isHidden
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              {isHidden ? 'Unhide' : 'Hide'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
