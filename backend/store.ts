import { Question, Poll, Session, QuestionStatus } from './types.js';

class InMemoryStore {
  private sessions: Map<string, Session> = new Map();
  private questions: Map<string, Question[]> = new Map(); // sessionCode -> questions
  private polls: Map<string, Poll[]> = new Map(); // sessionCode -> polls

  constructor() {
    this.seedDemo();
  }

  // Generate 6-char uppercase alphanumeric code
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Helper for generating IDs
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  createSession(title: string): Session {
    let code = this.generateCode();
    // Ensure uniqueness
    while (this.sessions.has(code)) {
      code = this.generateCode();
    }

    const session: Session = {
      id: this.generateId('sess'),
      code,
      title: title.trim(),
      hostKey: this.generateId('host'),
      isActive: true,
      activePollId: null,
      createdAt: new Date().toISOString()
    };

    this.sessions.set(code, session);
    this.questions.set(code, []);
    this.polls.set(code, []);

    return session;
  }

  getSession(code: string): Session | undefined {
    return this.sessions.get(code.toUpperCase().trim());
  }

  getQuestions(sessionCode: string): Question[] {
    const list = this.questions.get(sessionCode.toUpperCase().trim()) || [];
    // Return sorted by upvotes descending, then by createdAt descending
    return [...list].sort((a, b) => {
      if (b.upvotes !== a.upvotes) {
        return b.upvotes - a.upvotes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  getPolls(sessionCode: string): Poll[] {
    return this.polls.get(sessionCode.toUpperCase().trim()) || [];
  }

  getActivePoll(sessionCode: string): Poll | null {
    const code = sessionCode.toUpperCase().trim();
    const session = this.sessions.get(code);
    if (!session || !session.activePollId) return null;
    const polls = this.polls.get(code) || [];
    return polls.find(p => p.id === session.activePollId) || null;
  }

  addQuestion(
    sessionCode: string,
    text: string,
    authorName: string,
    isAnonymous: boolean,
    voterId: string
  ): { question?: Question; error?: string } {
    const code = sessionCode.toUpperCase().trim();
    const session = this.sessions.get(code);
    if (!session) {
      return { error: 'Session not found' };
    }

    const cleanText = text.trim();
    if (!cleanText) {
      return { error: 'Question text is required' };
    }
    if (cleanText.length > 500) {
      return { error: 'Question text cannot exceed 500 characters' };
    }

    const question: Question = {
      id: this.generateId('q'),
      sessionCode: code,
      text: cleanText,
      authorName: isAnonymous ? 'Anonymous' : (authorName.trim() || 'Audience Member'),
      isAnonymous,
      voterId: voterId || 'anon',
      upvotes: 0,
      upvoterIds: [],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const qList = this.questions.get(code) || [];
    qList.push(question);
    this.questions.set(code, qList);

    return { question };
  }

  upvoteQuestion(
    sessionCode: string,
    questionId: string,
    voterId: string
  ): { question?: Question; error?: string; status?: number } {
    const code = sessionCode.toUpperCase().trim();
    const qList = this.questions.get(code);
    if (!qList) {
      return { error: 'Session not found', status: 404 };
    }

    const question = qList.find(q => q.id === questionId);
    if (!question) {
      return { error: 'Question not found', status: 404 };
    }

    if (!voterId) {
      return { error: 'Voter ID is required', status: 400 };
    }

    // Strict duplicate check
    if (question.upvoterIds.includes(voterId)) {
      return {
        error: 'You have already upvoted this question.',
        status: 409
      };
    }

    question.upvoterIds.push(voterId);
    question.upvotes += 1;

    return { question, status: 200 };
  }

  updateQuestionStatus(
    sessionCode: string,
    questionId: string,
    status: QuestionStatus
  ): { question?: Question; error?: string } {
    const code = sessionCode.toUpperCase().trim();
    const qList = this.questions.get(code);
    if (!qList) return { error: 'Session not found' };

    const question = qList.find(q => q.id === questionId);
    if (!question) return { error: 'Question not found' };

    question.status = status;
    return { question };
  }

  deleteQuestion(
    sessionCode: string,
    questionId: string
  ): { success: boolean; error?: string } {
    const code = sessionCode.toUpperCase().trim();
    const qList = this.questions.get(code);
    if (!qList) return { success: false, error: 'Session not found' };

    const index = qList.findIndex(q => q.id === questionId);
    if (index === -1) return { success: false, error: 'Question not found' };

    qList.splice(index, 1);
    return { success: true };
  }

  createPoll(
    sessionCode: string,
    questionText: string,
    options: string[]
  ): { poll?: Poll; error?: string } {
    const code = sessionCode.toUpperCase().trim();
    const session = this.sessions.get(code);
    if (!session) return { error: 'Session not found' };

    const cleanQuestion = questionText.trim();
    if (!cleanQuestion) return { error: 'Poll question text is required' };

    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      return { error: 'Poll must have at least 2 options' };
    }

    const poll: Poll = {
      id: this.generateId('poll'),
      sessionCode: code,
      question: cleanQuestion,
      options: validOptions.map((text, idx) => ({
        id: idx,
        text,
        votes: 0
      })),
      status: 'draft',
      totalVotes: 0,
      voterChoices: {},
      createdAt: new Date().toISOString()
    };

    const pList = this.polls.get(code) || [];
    pList.push(poll);
    this.polls.set(code, pList);

    // If no active poll exists, automatically activate this one
    if (!session.activePollId) {
      session.activePollId = poll.id;
      poll.status = 'active';
    }

    return { poll };
  }

  activatePoll(sessionCode: string, pollId: string): { poll?: Poll; error?: string } {
    const code = sessionCode.toUpperCase().trim();
    const session = this.sessions.get(code);
    if (!session) return { error: 'Session not found' };

    const pList = this.polls.get(code) || [];
    const poll = pList.find(p => p.id === pollId);
    if (!poll) return { error: 'Poll not found' };

    // Deactivate others
    pList.forEach(p => {
      if (p.status === 'active') p.status = 'closed';
    });

    poll.status = 'active';
    session.activePollId = poll.id;

    return { poll };
  }

  closePoll(sessionCode: string, pollId: string): { poll?: Poll; error?: string } {
    const code = sessionCode.toUpperCase().trim();
    const session = this.sessions.get(code);
    if (!session) return { error: 'Session not found' };

    const pList = this.polls.get(code) || [];
    const poll = pList.find(p => p.id === pollId);
    if (!poll) return { error: 'Poll not found' };

    poll.status = 'closed';
    if (session.activePollId === pollId) {
      session.activePollId = null;
    }

    return { poll };
  }

  voteInPoll(
    sessionCode: string,
    pollId: string,
    optionId: number,
    voterId: string
  ): { poll?: Poll; error?: string; status?: number } {
    const code = sessionCode.toUpperCase().trim();
    const pList = this.polls.get(code);
    if (!pList) return { error: 'Session not found', status: 404 };

    const poll = pList.find(p => p.id === pollId);
    if (!poll) return { error: 'Poll not found', status: 404 };

    if (poll.status !== 'active') {
      return { error: 'This poll is not currently active for voting.', status: 400 };
    }

    if (!voterId) {
      return { error: 'Voter ID is required', status: 400 };
    }

    // Strict duplicate check
    if (poll.voterChoices[voterId] !== undefined) {
      return {
        error: 'You have already voted in this poll.',
        status: 409
      };
    }

    const option = poll.options.find(o => o.id === optionId);
    if (!option) {
      return { error: 'Invalid poll option selected', status: 400 };
    }

    option.votes += 1;
    poll.totalVotes += 1;
    poll.voterChoices[voterId] = optionId;

    return { poll, status: 200 };
  }

  exportData(sessionCode: string) {
    const code = sessionCode.toUpperCase().trim();
    const session = this.sessions.get(code);
    if (!session) return null;

    const questions = this.getQuestions(code);
    const polls = this.getPolls(code);

    return {
      session: {
        code: session.code,
        title: session.title,
        createdAt: session.createdAt
      },
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        author: q.authorName,
        isAnonymous: q.isAnonymous,
        upvotes: q.upvotes,
        status: q.status,
        createdAt: q.createdAt
      })),
      polls: polls.map(p => ({
        id: p.id,
        question: p.question,
        status: p.status,
        totalVotes: p.totalVotes,
        options: p.options.map(o => ({
          text: o.text,
          votes: o.votes,
          percentage: p.totalVotes > 0 ? Math.round((o.votes / p.totalVotes) * 100) : 0
        }))
      }))
    };
  }

  seedDemo(): Session {
    const code = 'DEMO26';
    const session: Session = {
      id: 'sess_demo_2026',
      code,
      title: 'Tech Keynote 2026: The Future of Real-Time Apps',
      hostKey: 'host_demo_key_2026',
      isActive: true,
      activePollId: 'poll_demo_active',
      createdAt: new Date().toISOString()
    };

    this.sessions.set(code, session);

    const questions: Question[] = [
      {
        id: 'q_demo_1',
        sessionCode: code,
        text: 'How does Socket.IO handle automatic reconnection and dropped packets in poor network environments?',
        authorName: 'Elena Rostova',
        isAnonymous: false,
        voterId: 'voter_seeded_1',
        upvotes: 18,
        upvoterIds: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'v11', 'v12', 'v13', 'v14', 'v15', 'v16', 'v17', 'v18'],
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        id: 'q_demo_2',
        sessionCode: code,
        text: 'What is the recommended architecture for scaling WebSockets horizontally across server clusters?',
        authorName: 'Marcus Vance',
        isAnonymous: false,
        voterId: 'voter_seeded_2',
        upvotes: 14,
        upvoterIds: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10', 'v11', 'v12', 'v13', 'v14'],
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
      },
      {
        id: 'q_demo_3',
        sessionCode: code,
        text: 'Can we export the live audience questions and poll analytics as CSV after the keynote?',
        authorName: 'Sarah Jenkins',
        isAnonymous: false,
        voterId: 'voter_seeded_3',
        upvotes: 9,
        upvoterIds: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9'],
        status: 'answered',
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
      },
      {
        id: 'q_demo_4',
        sessionCode: code,
        text: 'Are duplicate votes prevented on the server if someone opens multiple browser tabs or scripts requests?',
        authorName: 'Anonymous',
        isAnonymous: true,
        voterId: 'voter_seeded_4',
        upvotes: 6,
        upvoterIds: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'],
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ];

    this.questions.set(code, questions);

    const poll: Poll = {
      id: 'poll_demo_active',
      sessionCode: code,
      question: 'What is your primary focus for full-stack engineering this year?',
      options: [
        { id: 0, text: 'Real-Time Sync & WebSockets', votes: 16 },
        { id: 1, text: 'AI Agents & Tool Orchestration', votes: 24 },
        { id: 2, text: 'TypeScript & High-Reliability APIs', votes: 11 },
        { id: 3, text: 'Edge Runtimes & Performance', votes: 7 }
      ],
      status: 'active',
      totalVotes: 58,
      voterChoices: {
        'seed_voter_1': 0,
        'seed_voter_2': 1
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    };

    this.polls.set(code, [poll]);

    return session;
  }
}

export const store = new InMemoryStore();
