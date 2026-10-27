import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  BarChart2,
  Plus,
  Tv,
  Users,
  Search,
  Filter,
  Flame,
  CheckCircle2,
  EyeOff,
  Sparkles,
  Shield,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

import { SessionData, Question, Poll, QuestionStatus } from './types';
import {
  getOrCreateVoterId,
  getSavedDisplayName,
  saveDisplayName,
  getHostKey,
  saveHostKey,
} from './utils/voterId';
import { getSocket, joinSessionRoom, leaveSessionRoom } from './utils/socket';
import { Header } from './components/Header';
import { JoinCreateModal } from './components/JoinCreateModal';
import { QuestionCard } from './components/QuestionCard';
import { AskQuestionModal } from './components/AskQuestionModal';
import { PollCard } from './components/PollCard';
import { CreatePollModal } from './components/CreatePollModal';
import { PresenterView } from './components/PresenterView';
import { ExportModal } from './components/ExportModal';
import { QRCodeModal } from './components/QRCodeModal';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [voterId] = useState<string>(() => getOrCreateVoterId());
  const [displayName, setDisplayName] = useState<string>(() => getSavedDisplayName());
  const [isHost, setIsHost] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Active view: 'main' or 'presenter'
  const [viewMode, setViewMode] = useState<'main' | 'presenter'>('main');

  // Tabs on main screen: 'qa' or 'polls'
  const [activeTab, setActiveTab] = useState<'qa' | 'polls'>('qa');

  // Filters for Q&A
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'answered'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isCreatePollModalOpen, setIsCreatePollModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (type: 'error' | 'success' | 'info', message: string, title?: string) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
      setToasts((prev) => [...prev, { id, type, message, title }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Global Keyboard Shortcuts (Alt+P, Esc, Alt+Q, Alt+N, Alt+E, Alt+H, ?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // 1. Esc: Close active modals or exit presenter mode
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        if (isQRModalOpen) {
          setIsQRModalOpen(false);
          return;
        }
        if (isExportModalOpen) {
          setIsExportModalOpen(false);
          return;
        }
        if (isAskModalOpen) {
          setIsAskModalOpen(false);
          return;
        }
        if (isCreatePollModalOpen) {
          setIsCreatePollModalOpen(false);
          return;
        }
        if (viewMode === 'presenter') {
          setViewMode('main');
          return;
        }
      }

      // 2. Alt + P: Toggle Presenter View
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        if (sessionData) {
          setViewMode((prev) => {
            const next = prev === 'presenter' ? 'main' : 'presenter';
            showToast(
              'info',
              next === 'presenter'
                ? 'Presenter view opened (Alt+P)'
                : 'Exited Presenter view (Alt+P)'
            );
            return next;
          });
          setIsAskModalOpen(false);
          setIsCreatePollModalOpen(false);
          setIsExportModalOpen(false);
          setIsQRModalOpen(false);
          setIsShortcutsModalOpen(false);
        }
        return;
      }

      // 3. Alt + Q: Toggle Audience QR Code modal
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        if (sessionData) {
          setIsQRModalOpen((prev) => !prev);
        }
        return;
      }

      // 4. Alt + N: Open Ask a Question modal
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (sessionData && viewMode === 'main') {
          setIsAskModalOpen(true);
        }
        return;
      }

      // 5. Alt + E: Open Export modal
      if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        if (sessionData) {
          setIsExportModalOpen(true);
        }
        return;
      }

      // 6. Alt + H: Toggle Host View
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setIsHost((prev) => {
          const next = !prev;
          showToast(
            'info',
            next ? 'Host controls enabled (Alt+H)' : 'Switched to audience view (Alt+H)'
          );
          return next;
        });
        return;
      }

      // 7. ?: Show keyboard shortcuts help cheat sheet (when not in an input)
      if (e.key === '?' && !isInput && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    sessionData,
    viewMode,
    isAskModalOpen,
    isCreatePollModalOpen,
    isExportModalOpen,
    isQRModalOpen,
    isShortcutsModalOpen,
    showToast,
  ]);

  // Fetch session data
  const loadSession = useCallback(
    async (code: string, asHostKey?: string): Promise<boolean> => {
      setIsLoadingSession(true);
      setSessionError(null);
      try {
        const res = await fetch(`/api/sessions/${code.toUpperCase().trim()}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Session ${code} not found.`);
        }

        const data: SessionData = await res.json();
        setSessionData(data);

        // Check if user is host
        const savedKey = asHostKey || getHostKey(data.session.code);
        if (savedKey && savedKey === data.session.hostKey) {
          setIsHost(true);
        }

        // Join socket room
        joinSessionRoom(data.session.code);

        // Update URL query without full reload
        const url = new URL(window.location.href);
        url.searchParams.set('code', data.session.code);
        window.history.replaceState({}, '', url.toString());

        return true;
      } catch (err: any) {
        setSessionError(err.message || 'Failed to connect to session.');
        return false;
      } finally {
        setIsLoadingSession(false);
      }
    },
    []
  );

  // Initialize from URL parameters on first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const viewParam = params.get('view');
    const path = window.location.pathname;

    // Check if path is /presenter/:code
    const presenterMatch = path.match(/\/presenter\/([A-Za-z0-9]{4,8})/);
    if (presenterMatch) {
      loadSession(presenterMatch[1]).then((success) => {
        if (success) setViewMode('presenter');
      });
      return;
    }

    if (codeParam) {
      loadSession(codeParam).then((success) => {
        if (success && viewParam === 'presenter') {
          setViewMode('presenter');
        }
      });
    }
  }, [loadSession]);

  // Wire Socket.IO Real-time listeners
  useEffect(() => {
    if (!sessionData) return;

    const socket = getSocket();
    const currentCode = sessionData.session.code;

    const handleSessionUpdated = (data: SessionData) => {
      if (data.session.code === currentCode) {
        setSessionData(data);
        showToast('info', 'Session data refreshed.');
      }
    };

    const handleQuestionCreated = (question: Question) => {
      if (question.sessionCode === currentCode) {
        setSessionData((prev) => {
          if (!prev) return prev;
          // Avoid duplicate insertion
          if (prev.questions.some((q) => q.id === question.id)) return prev;
          return {
            ...prev,
            questions: [question, ...prev.questions].sort((a, b) => b.upvotes - a.upvotes),
          };
        });
      }
    };

    const handleQuestionUpvoted = (question: Question) => {
      if (question.sessionCode === currentCode) {
        setSessionData((prev) => {
          if (!prev) return prev;
          const updated = prev.questions.map((q) => (q.id === question.id ? question : q));
          return {
            ...prev,
            questions: updated.sort((a, b) => b.upvotes - a.upvotes),
          };
        });
      }
    };

    const handleQuestionUpdated = (question: Question) => {
      if (question.sessionCode === currentCode) {
        setSessionData((prev) => {
          if (!prev) return prev;
          const updated = prev.questions.map((q) => (q.id === question.id ? question : q));
          return { ...prev, questions: updated };
        });
      }
    };

    const handleQuestionDeleted = ({ questionId }: { questionId: string }) => {
      setSessionData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.filter((q) => q.id !== questionId),
        };
      });
    };

    const handlePollCreated = (poll: Poll) => {
      if (poll.sessionCode === currentCode) {
        setSessionData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            polls: [poll, ...prev.polls.filter((p) => p.id !== poll.id)],
            activePoll: poll.status === 'active' ? poll : prev.activePoll,
          };
        });
        showToast('info', `New poll created: "${poll.question}"`);
      }
    };

    const handlePollActivated = (poll: Poll) => {
      if (poll.sessionCode === currentCode) {
        setSessionData((prev) => {
          if (!prev) return prev;
          const polls = prev.polls.map((p) => (p.id === poll.id ? poll : p.status === 'active' ? { ...p, status: 'closed' as const } : p));
          return {
            ...prev,
            polls,
            activePoll: poll,
          };
        });
        showToast('info', `Live poll launched: "${poll.question}"`);
      }
    };

    const handlePollVoted = (poll: Poll) => {
      if (poll.sessionCode === currentCode) {
        setSessionData((prev) => {
          if (!prev) return prev;
          const polls = prev.polls.map((p) => (p.id === poll.id ? poll : p));
          return {
            ...prev,
            polls,
            activePoll: prev.activePoll?.id === poll.id ? poll : prev.activePoll,
          };
        });
      }
    };

    const handlePollClosed = (poll: Poll) => {
      if (poll.sessionCode === currentCode) {
        setSessionData((prev) => {
          if (!prev) return prev;
          const polls = prev.polls.map((p) => (p.id === poll.id ? poll : p));
          return {
            ...prev,
            polls,
            activePoll: prev.activePoll?.id === poll.id ? null : prev.activePoll,
          };
        });
      }
    };

    const handleAudienceCount = ({ count }: { count: number }) => {
      setParticipantCount(count || 1);
    };

    socket.on('session:updated', handleSessionUpdated);
    socket.on('question:created', handleQuestionCreated);
    socket.on('question:upvoted', handleQuestionUpvoted);
    socket.on('question:updated', handleQuestionUpdated);
    socket.on('question:deleted', handleQuestionDeleted);
    socket.on('poll:created', handlePollCreated);
    socket.on('poll:activated', handlePollActivated);
    socket.on('poll:voted', handlePollVoted);
    socket.on('poll:closed', handlePollClosed);
    socket.on('audience:count', handleAudienceCount);

    return () => {
      socket.off('session:updated', handleSessionUpdated);
      socket.off('question:created', handleQuestionCreated);
      socket.off('question:upvoted', handleQuestionUpvoted);
      socket.off('question:updated', handleQuestionUpdated);
      socket.off('question:deleted', handleQuestionDeleted);
      socket.off('poll:created', handlePollCreated);
      socket.off('poll:activated', handlePollActivated);
      socket.off('poll:voted', handlePollVoted);
      socket.off('poll:closed', handlePollClosed);
      socket.off('audience:count', handleAudienceCount);
    };
  }, [sessionData, showToast]);

  // Join Session action
  const handleJoin = async (code: string, name: string): Promise<boolean> => {
    if (name) {
      setDisplayName(name);
      saveDisplayName(name);
    }
    return await loadSession(code);
  };

  // Create Session action
  const handleCreate = async (title: string, hostName: string): Promise<boolean> => {
    setIsLoadingSession(true);
    setSessionError(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create session');
      }

      const { session } = await res.json();
      saveHostKey(session.code, session.hostKey);
      setIsHost(true);
      if (hostName) {
        setDisplayName(hostName);
        saveDisplayName(hostName);
      }

      showToast('success', `Session "${session.title}" created with code ${session.code}!`);
      return await loadSession(session.code, session.hostKey);
    } catch (err: any) {
      setSessionError(err.message || 'Error creating session');
      return false;
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Seed Demo Session
  const handleSeedDemo = async () => {
    setIsLoadingSession(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed demo');
      const data = await res.json();
      saveHostKey(data.code, data.hostKey);
      setIsHost(true);
      showToast('success', 'Demo session DEMO26 seeded and loaded!');
      await loadSession('DEMO26', data.hostKey);
    } catch (err: any) {
      showToast('error', err.message || 'Seed failed');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Leave Session
  const handleLeaveSession = () => {
    if (sessionData) {
      leaveSessionRoom(sessionData.session.code);
    }
    setSessionData(null);
    setIsHost(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('view');
    window.history.replaceState({}, '', url.pathname);
  };

  // Submit Question
  const handleSubmitQuestion = async (
    text: string,
    authorName: string,
    isAnonymous: boolean
  ): Promise<boolean> => {
    if (!sessionData) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionData.session.code}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          authorName: isAnonymous ? 'Anonymous' : authorName || displayName || 'Audience Member',
          isAnonymous,
          voterId,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to submit question');
      }

      showToast('success', 'Your question has been posted live!');
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Failed to post question');
      return false;
    }
  };

  // Upvote Question with Strict 409 Conflict Handling
  const handleUpvoteQuestion = async (questionId: string) => {
    if (!sessionData) return;
    try {
      const res = await fetch(
        `/api/sessions/${sessionData.session.code}/questions/${questionId}/upvote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voterId }),
        }
      );

      if (res.status === 409) {
        // Strict duplicate vote attempt!
        const err = await res.json().catch(() => ({}));
        showToast(
          'error',
          err.error || 'You have already upvoted this question.',
          'HTTP 409 Conflict'
        );
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to record upvote');
      }

      showToast('success', 'Upvote registered!');
    } catch (err: any) {
      showToast('error', err.message || 'Error voting');
    }
  };

  // Moderation: Update Question Status
  const handleUpdateQuestionStatus = async (
    questionId: string,
    status: QuestionStatus
  ) => {
    if (!sessionData) return;
    try {
      const res = await fetch(
        `/api/sessions/${sessionData.session.code}/questions/${questionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update status');
      }

      showToast('info', `Question marked as ${status}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update status');
    }
  };

  // Moderation: Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!sessionData) return;
    try {
      const res = await fetch(
        `/api/sessions/${sessionData.session.code}/questions/${questionId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete question');
      }

      showToast('info', 'Question removed.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete question');
    }
  };

  // Vote in Poll with Strict 409 Conflict Handling
  const handleVoteInPoll = async (pollId: string, optionId: number) => {
    if (!sessionData) return;
    try {
      const res = await fetch(
        `/api/sessions/${sessionData.session.code}/polls/${pollId}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionId, voterId }),
        }
      );

      if (res.status === 409) {
        // Strict duplicate vote attempt!
        const err = await res.json().catch(() => ({}));
        showToast(
          'error',
          err.error || 'You have already voted in this poll.',
          'HTTP 409 Conflict'
        );
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to record vote');
      }

      showToast('success', 'Your vote has been counted!');
    } catch (err: any) {
      showToast('error', err.message || 'Error voting');
    }
  };

  // Create Poll
  const handleCreatePoll = async (question: string, options: string[]): Promise<boolean> => {
    if (!sessionData) return false;
    try {
      const res = await fetch(`/api/sessions/${sessionData.session.code}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, options }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create poll');
      }

      showToast('success', 'Poll launched live to audience!');
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create poll');
      return false;
    }
  };

  // Activate Poll
  const handleActivatePoll = async (pollId: string) => {
    if (!sessionData) return;
    try {
      const res = await fetch(
        `/api/sessions/${sessionData.session.code}/polls/${pollId}/activate`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error('Failed to activate poll');
    } catch (err: any) {
      showToast('error', err.message || 'Error activating poll');
    }
  };

  // Close Poll
  const handleClosePoll = async (pollId: string) => {
    if (!sessionData) return;
    try {
      const res = await fetch(
        `/api/sessions/${sessionData.session.code}/polls/${pollId}/close`,
        { method: 'POST' }
      );
      if (!res.ok) throw new Error('Failed to close poll');
      showToast('info', 'Poll has been closed.');
    } catch (err: any) {
      showToast('error', err.message || 'Error closing poll');
    }
  };

  // Filtered Questions computation
  const filteredQuestions = useMemo(() => {
    if (!sessionData) return [];
    return sessionData.questions.filter((q) => {
      // Filter out hidden questions for audience members (unless host)
      if (q.status === 'hidden' && !isHost) return false;

      // Status filter
      if (filterStatus === 'active' && q.status !== 'active') return false;
      if (filterStatus === 'answered' && q.status !== 'answered') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.text.toLowerCase().includes(query) ||
          q.authorName.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [sessionData, filterStatus, searchQuery, isHost]);

  // If user is not yet connected to a session, show landing
  if (!sessionData) {
    return (
      <>
        <JoinCreateModal
          onJoin={handleJoin}
          onCreate={handleCreate}
          onSeedDemo={handleSeedDemo}
          isLoading={isLoadingSession}
          error={sessionError}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // If presenter mode is active, render dedicated high-contrast presenter screen
  if (viewMode === 'presenter') {
    return (
      <>
        <PresenterView
          sessionData={sessionData}
          participantCount={participantCount}
          onExit={() => setViewMode('main')}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sticky Header with Join Code, Presenter Mode, and Controls */}
      <Header
        session={sessionData.session}
        isHost={isHost}
        participantCount={participantCount}
        onOpenQRCode={() => setIsQRModalOpen(true)}
        onOpenPresenter={() => setViewMode('presenter')}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onLeaveSession={handleLeaveSession}
        onToggleHostMode={() => {
          setIsHost(!isHost);
          showToast('info', !isHost ? 'Host controls enabled (Alt+H)' : 'Switched to audience view (Alt+H)');
        }}
        onToast={showToast}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Navigation Tabs (Live Q&A vs Live Polls) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('qa')}
              aria-label="View Q&A questions"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'qa'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Questions</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  activeTab === 'qa' ? 'bg-indigo-700 text-indigo-100' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {sessionData.questions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('polls')}
              aria-label="View Live Polls"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'polls'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span>Live Polls</span>
              {sessionData.activePoll && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2.5">
            {activeTab === 'qa' ? (
              <button
                onClick={() => setIsAskModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ask a Question</span>
              </button>
            ) : isHost ? (
              <button
                onClick={() => setIsCreatePollModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Poll</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* TAB 1: Q&A Section */}
        {activeTab === 'qa' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions or speakers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All ({sessionData.questions.length})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterStatus === 'active'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Unanswered
                </button>
                <button
                  onClick={() => setFilterStatus('answered')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    filterStatus === 'answered'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Answered
                </button>
              </div>
            </div>

            {/* Questions List */}
            {filteredQuestions.length > 0 ? (
              <div className="space-y-3">
                {filteredQuestions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    voterId={voterId}
                    isHost={isHost}
                    rank={index + 1}
                    onUpvote={handleUpvoteQuestion}
                    onUpdateStatus={handleUpdateQuestionStatus}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center bg-zinc-900/40">
                <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-zinc-300">
                  {searchQuery ? 'No matching questions found' : 'No questions submitted yet'}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search terms.'
                    : 'Be the first to ask the speaker a question! Click below to post.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsAskModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ask First Question</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Live Polls Section */}
        {activeTab === 'polls' && (
          <div className="space-y-6">
            {/* Active Poll Spotlight */}
            {sessionData.activePoll ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Currently Active Poll
                  </h2>
                </div>
                <PollCard
                  poll={sessionData.activePoll}
                  voterId={voterId}
                  isHost={isHost}
                  onVote={handleVoteInPoll}
                  onActivate={handleActivatePoll}
                  onClose={handleClosePoll}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center bg-zinc-900/40">
                <BarChart2 className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-zinc-300">
                  No active poll running at the moment
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  The presenter will open a poll when ready. Results sync live.
                </p>
                {isHost && (
                  <button
                    onClick={() => setIsCreatePollModalOpen(true)}
                    className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Launch a Poll</span>
                  </button>
                )}
              </div>
            )}

            {/* Closed / Other Polls */}
            {sessionData.polls.filter((p) => p.id !== sessionData.activePoll?.id).length > 0 && (
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Past Poll Results
                </h3>
                <div className="space-y-4">
                  {sessionData.polls
                    .filter((p) => p.id !== sessionData.activePoll?.id)
                    .map((poll) => (
                      <PollCard
                        key={poll.id}
                        poll={poll}
                        voterId={voterId}
                        isHost={isHost}
                        onVote={handleVoteInPoll}
                        onActivate={handleActivatePoll}
                        onClose={handleClosePoll}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button on Mobile */}
      <div className="sm:hidden fixed bottom-6 right-6 z-30">
        <button
          onClick={() => (activeTab === 'qa' ? setIsAskModalOpen(true) : setIsCreatePollModalOpen(true))}
          className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-600/50 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          aria-label="New action"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modals */}
      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        onSubmit={handleSubmitQuestion}
        defaultAuthorName={displayName}
      />

      <CreatePollModal
        isOpen={isCreatePollModalOpen}
        onClose={() => setIsCreatePollModalOpen(false)}
        onCreate={handleCreatePoll}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sessionData={sessionData}
      />

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        sessionCode={sessionData.session.code}
        sessionTitle={sessionData.session.title}
        onToast={showToast}
      />

      <ShortcutsHelpModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        isHost={isHost}
      />

      {/* Toast Manager */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
