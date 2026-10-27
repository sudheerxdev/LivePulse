import React, { useState } from 'react';
import { BarChart3, Plus, Trash2, X, Play } from 'lucide-react';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (question: string, options: string[]) => Promise<boolean>;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setError('Please enter a poll question.');
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('Please provide at least 2 non-empty choices.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onCreate(cleanQuestion, validOptions);
      if (success) {
        setQuestion('');
        setOptions(['', '']);
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
        aria-labelledby="create-poll-title"
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 relative text-zinc-100"
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-poll-title" className="text-lg font-bold text-white">
                Create Live Poll
              </h2>
              <p className="text-xs text-zinc-400">
                Audience can vote live from their phones in real-time
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
            <label htmlFor="poll-question-input" className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Poll Question *
            </label>
            <input
              id="poll-question-input"
              type="text"
              maxLength={200}
              placeholder="e.g. Which API architecture do you prefer in 2026?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
              Options (Min 2, Max 6) *
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-mono font-bold text-zinc-500 text-center">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-zinc-950 border border-zinc-750 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      aria-label={`Remove option ${idx + 1}`}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2.5 text-xs font-medium text-violet-400 hover:text-violet-300 flex items-center gap-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-violet-950/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another option</span>
              </button>
            )}
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
              disabled={isSubmitting || !question.trim()}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Creating...</span>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Launch Poll</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
