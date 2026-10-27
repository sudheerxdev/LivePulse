export type QuestionStatus = 'active' | 'answered' | 'hidden';

export interface Question {
  id: string;
  sessionCode: string;
  text: string;
  authorName: string;
  isAnonymous: boolean;
  voterId: string;
  upvotes: number;
  upvoterIds: string[];
  status: QuestionStatus;
  createdAt: string;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export type PollStatus = 'draft' | 'active' | 'closed';

export interface Poll {
  id: string;
  sessionCode: string;
  question: string;
  options: PollOption[];
  status: PollStatus;
  totalVotes: number;
  voterChoices: Record<string, number>; // voterId -> optionId/index
  createdAt: string;
}

export interface Session {
  id: string;
  code: string;
  title: string;
  hostKey: string;
  isActive: boolean;
  activePollId: string | null;
  createdAt: string;
}

export interface SessionDetails {
  session: Session;
  questions: Question[];
  polls: Poll[];
  activePoll: Poll | null;
  participantCount?: number;
}
