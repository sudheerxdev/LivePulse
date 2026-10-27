import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X, Check, BarChart2, MessageSquare } from 'lucide-react';
import { SessionData } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: SessionData;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  sessionData,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const totalQuestions = sessionData.questions.length;
  const totalUpvotes = sessionData.questions.reduce((acc, q) => acc + q.upvotes, 0);
  const totalPolls = sessionData.polls.length;
  const totalPollVotes = sessionData.polls.reduce((acc, p) => acc + p.totalVotes, 0);

  const handleDownload = async (format: 'json' | 'csv') => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionData.session.code}/export?format=${format}`);
      if (!response.ok) throw new Error('Failed to fetch export');

      if (format === 'json') {
        const json = await response.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `livepulse-${sessionData.session.code}-export.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `livepulse-${sessionData.session.code}-export.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 relative text-zinc-100"
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-dialog-title" className="text-lg font-bold text-white">
                Export Session Data
              </h2>
              <p className="text-xs text-zinc-400">
                Download all audience questions, upvotes, and poll results
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

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Questions & Upvotes</span>
            </div>
            <p className="text-xl font-bold font-mono text-zinc-100 mt-1">
              {totalQuestions} <span className="text-xs font-sans text-zinc-500">({totalUpvotes} votes)</span>
            </p>
          </div>
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2 text-zinc-400 text-xs">
              <BarChart2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Polls & Answers</span>
            </div>
            <p className="text-xl font-bold font-mono text-zinc-100 mt-1">
              {totalPolls} <span className="text-xs font-sans text-zinc-500">({totalPollVotes} votes)</span>
            </p>
          </div>
        </div>

        {/* Export Formats */}
        <div className="space-y-3">
          <button
            onClick={() => handleDownload('csv')}
            disabled={downloading}
            className="w-full p-4 bg-zinc-950 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100 group-hover:text-white">
                  CSV Spreadsheet (.csv)
                </p>
                <p className="text-xs text-zinc-400">
                  Ready for Excel, Google Sheets, or keynote post-mortem
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
          </button>

          <button
            onClick={() => handleDownload('json')}
            disabled={downloading}
            className="w-full p-4 bg-zinc-950 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100 group-hover:text-white">
                  Full JSON Archive (.json)
                </p>
                <p className="text-xs text-zinc-400">
                  Raw structured dataset with options and timestamps
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-300 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
