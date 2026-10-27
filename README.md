# LivePulse - Live Q&A and Real-Time Polling Platform

LivePulse is a production-ready, full-stack live Q&A and polling application designed for conferences, meetups, webinars, and all-hands events. A host opens a session and shares a 6-character short alphanumeric join code (e.g., `DEMO26`). The audience joins with zero friction (no login or registration required) using any device, asks questions, upvotes peer inquiries, and votes in live polls with instantaneous animated result sync via WebSockets.

---

## 🚀 Live Demo & Quick Start

- **Live App URL**: Pre-configured and running on port 3000.
- **Seeded Demo Event**: Code `DEMO26` ("Tech Keynote 2026: The Future of Real-Time Apps").
- **Quick Demo Launcher**: Click the **"Launch Pre-Loaded Demo Session (DEMO26)"** button on the home screen to test all features instantly.

---

## 📋 Features

### 1. Session Management
- **Host Session Creation**: Hosts generate a new session with a title and receive a unique 6-character code (e.g., `TECH26`).
- **Zero-Friction Audience Onboarding**: Audience members join instantly using the code and an optional display name (no passwords, signup forms, or app installation).
- **Persistent Voter ID**: Every participant receives a persistent UUID stored in `localStorage` across reloads.
- **Direct Link Sharing**: Attendees can join directly via `/?code=XXXXXX` or copy the join link with one click.

### 2. Live Audience Q&A
- **Live Question Submission**: Audience members post questions with real-time character limit validation (500 chars).
- **Anonymous Questions**: Toggleable "Ask Anonymously" option for sensitive queries.
- **Dynamic Upvoting & Sorting**: Questions automatically re-order in real time based on upvote count in descending order.
- **Strict Server-Side Duplicate Vote Enforcement**: The backend rejects duplicate upvotes from the same `voterId` on the same question, returning **HTTP 409 Conflict** with an informative error message. The UI displays an inline toast notification and visual badge.
- **Host Moderation**: Hosts can mark questions as **"Answered"**, **"Hide"** them from the audience view, or permanently delete inappropriate entries.

### 3. Live Polling
- **Single-Choice Poll Creation**: Hosts define questions and dynamic options (2 to 6 choices) and launch them live.
- **Real-Time Animated Percentage Bars**: As audience members vote, percentage progress bars and vote counts update across all connected devices in real time with smooth CSS transitions.
- **Strict Server-Side Duplicate Poll Vote Enforcement**: Exactly 1 vote per `voterId` per poll is enforced by the backend API. Duplicate attempts are rejected with **HTTP 409 Conflict**.
- **Poll State Control**: Hosts can activate draft polls, close voting to lock results, and review past closed polls.

### 4. Dedicated Presenter View
- **Auditorium Projector Optimized**: Accessible via `/presenter/:code` or by clicking **"Presenter View"** in the top navigation bar.
- **High-Contrast Dark Theme**: Large, high-visibility typography designed to be readable from the back row of an auditorium or keynote hall.
- **Prominent Join Banner**: Massive 6-character join code and direct URL indicator.
- **Top Question Spotlight**: Displays the #1 highest-upvoted active question prominently with author info, vote tally, and an "Up Next" preview of runner-up questions.
- **Real-Time Poll Visualizer**: Live color-coded animated bars with instant vote count tickers.
- **Fullscreen Mode**: Toggle standard or native browser fullscreen.

### 5. Data Export (Bonus Stretch Goal)
- **Instant CSV & JSON Export**: Hosts can download a complete CSV spreadsheet or JSON archive containing all questions, authors, upvotes, status, and poll option breakdowns with percentage distributions.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js + Express 4 + Socket.IO for bi-directional WebSocket room management.
- **Frontend**: React 19 + Vite 8 + Tailwind CSS 4 + Lucide React icons.
- **Testing**: Jest + Supertest (integration testing) + Node's built-in `node:test` test runner.
- **Persistence**: Authoritative In-Memory store handling sessions, questions, upvotes, and polls with duplicate check sets.

---

## 💾 Data Model & Design Decisions

### Data Model Schema
```typescript
interface Session {
  id: string;               // e.g. "sess_1729000_abc"
  code: string;             // 6-char alphanumeric, e.g. "DEMO26"
  title: string;            // 1-120 characters
  hostKey: string;          // Secret token for host moderation
  isActive: boolean;
  activePollId: string | null;
  createdAt: string;        // ISO timestamp
}

interface Question {
  id: string;
  sessionCode: string;
  text: string;             // 1-500 characters
  authorName: string;
  isAnonymous: boolean;
  voterId: string;          // Author's voterId
  upvotes: number;
  upvoterIds: string[];     // Set/Array of voterIds who upvoted
  status: 'active' | 'answered' | 'hidden';
  createdAt: string;
}

interface PollOption {
  id: number;               // 0, 1, 2, ...
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  sessionCode: string;
  question: string;
  options: PollOption[];
  status: 'draft' | 'active' | 'closed';
  totalVotes: number;
  voterChoices: Record<string, number>; // voterId -> optionId
  createdAt: string;
}
```

### Key Design Decisions
1. **Server as Single Source of Truth**:
   Client state is strictly driven by the server. Mutations are validated by Express endpoints and broadcast to the session room (`io.to(sessionCode).emit(...)`).
2. **Strict Duplicate Vote Enforcement (HTTP 409 Conflict)**:
   Instead of relying on client-side disable flags alone (which can be bypassed by inspecting or scripting `curl` requests), the server checks `question.upvoterIds.includes(voterId)` and `poll.voterChoices[voterId] !== undefined`. If a duplicate is detected, it returns HTTP 409 Conflict.
3. **Socket.IO Room Partitioning**:
   Clients join dedicated rooms based on `sessionCode` (`socket.join(sessionCode)`). Updates for session `ALPHA1` never leak into session `BETA2`.
4. **Voter Identity Without Account Barrier**:
   Audience members shouldn't need Google/email sign-in to ask a question at an event. A persistent UUID is generated in `localStorage` on first access and reused.

---

## 🧪 Automated Testing

The project includes 5 passing automated tests using Jest and Supertest in `backend/app.test.js` covering critical backend logic:

1. **Session Creation**: Creates session and returns a valid 6-character code matching `/^[A-Z0-9]{6}$/`.
2. **Input Validation**: Rejects empty, missing, or invalid session titles with HTTP 400.
3. **Question Submission**: Submits questions with author and anonymous options.
4. **Duplicate Upvote Enforcement**: Rejects duplicate upvotes from the same `voterId` with HTTP 409 Conflict.
5. **Duplicate Poll Vote Enforcement**: Rejects duplicate votes from the same `voterId` on active polls with HTTP 409 Conflict.

### Running the Tests

To run Jest and Supertest:
```bash
npm test
```

To run the Node.js built-in test runner:
```bash
npm run test:unit
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js 20+ installed
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Copy the example configuration:
```bash
cp .env.example .env
```
Settings available in `.env.example`:
- `PORT=3000`
- `NODE_ENV=development`
- `APP_URL=http://localhost:3000`

### 4. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000` with Express handling API routes and WebSockets, and Vite middleware serving the frontend.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📈 What is Finished & Future Work

### Finished
- Full session lifecycle (create, join, leave, share).
- Real-time Q&A with live upvote counter, dynamic sorting, and anonymous mode.
- Host moderation (answered, hidden, delete).
- Real-time live polling with animated percentage bars and state controls.
- Server-side duplicate vote rejection returning HTTP 409 Conflict.
- Projector-optimized Presenter View (`/presenter/:code`).
- Seed endpoint (`/api/seed`) and one-click demo launcher for code `DEMO26`.
- CSV and JSON session export.
- 5 automated Jest & Supertest tests.

### What I Would Do With More Time
- **Word Clouds**: Add live audience word cloud polling for open-ended questions.
- **Profanity Filter**: Automatic moderation filter for inappropriate language using a lightweight classifier.
- **Persistent Database Storage**: Swap the in-memory store for PostgreSQL / SQLite using Drizzle ORM for multi-day conferences.
- **Multiple Simultaneous Polls**: Group polls into structured agendas with speaker timer integration.

---

## 🤖 AI Tools Used

- **Google AI Studio Build & Gemini Models**: Used for scaffolding the unified full-stack architecture, validating edge-case unit test scenarios for HTTP 409 Conflict prevention, and refining accessible projector high-contrast UI design.
# LivePulse
