import React, { useState } from 'react';
import { MessageSquarePlus, X, Shield, Send } from 'lucide-react';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, authorName: string, isAnonymous: boolean) => Promise<boolean>;
  defaultAuthorName: string;
}

export const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultAuthorName,
}) => {
  const [text, setText] = useState('');
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanText = text.trim();
    if (!cleanText) {
      setError('Please type your question.');
      return;
    }
    if (cleanText.length > 500) {
      setError('Question cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit(cleanText, authorName.trim(), isAnonymous);
      if (success) {
        setText('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-question-title"
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 relative text-zinc-100"
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ask-question-title" className="text-lg font-bold text-white">
                Ask the Speaker
              </h2>
              <p className="text-xs text-zinc-400">
                Your question will appear live and can be upvoted by everyone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="question-input" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Your Question *
            </label>
            <textarea
              id="question-input"
              rows={4}
              maxLength={500}
              placeholder="What would you like to ask the speaker?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
              autoFocus
            />
            <div className="flex justify-end mt-1 text-[11px] font-mono text-zinc-500">
              {text.length}/500
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <div className="flex-1">
              <label htmlFor="modal-author-name" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                Your Name <span className="text-zinc-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="modal-author-name"
                type="text"
                maxLength={35}
                disabled={isAnonymous}
                placeholder={isAnonymous ? 'Asking as Anonymous' : 'e.g. Maya Lin'}
                value={isAnonymous ? '' : authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <div className="sm:self-end">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950 hover:bg-zinc-800/80 cursor-pointer text-xs transition-colors">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-medium text-zinc-300">Ask Anonymously</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !text.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Posting...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Question</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
