import express from 'express';
import { store } from './store.js';

export const app = express();

app.use(express.json());

// Helper to broadcast socket events if io is attached
const broadcast = (req, room, event, data) => {
  const io = req.app.get('io');
  if (io) {
    io.to(room.toUpperCase().trim()).emit(event, data);
  }
};

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed endpoint
app.all('/api/seed', (_req, res) => {
  const session = store.seedDemo();
  const io = _req.app.get('io');
  if (io) {
    io.to('DEMO26').emit('session:updated', {
      session,
      questions: store.getQuestions('DEMO26'),
      polls: store.getPolls('DEMO26'),
      activePoll: store.getActivePoll('DEMO26')
    });
  }
  res.json({
    message: 'Demo session seeded successfully',
    code: 'DEMO26',
    title: session.title,
    hostKey: session.hostKey
  });
});

// 1. Create a new session
app.post('/api/sessions', (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Session title is required and cannot be empty.' });
  }

  const cleanTitle = title.trim();
  if (cleanTitle.length > 120) {
    return res.status(400).json({ error: 'Session title cannot exceed 120 characters.' });
  }

  const session = store.createSession(cleanTitle);

  res.status(201).json({
    message: 'Session created successfully',
    session: {
      id: session.id,
      code: session.code,
      title: session.title,
      hostKey: session.hostKey,
      createdAt: session.createdAt
    }
  });
});

// 2. Get session details
app.get('/api/sessions/:code', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const session = store.getSession(code);

  if (!session) {
    return res.status(404).json({ error: `Session with code "${code}" not found.` });
  }

  const questions = store.getQuestions(code);
  const polls = store.getPolls(code);
  const activePoll = store.getActivePoll(code);

  res.json({
    session,
    questions,
    polls,
    activePoll
  });
});

// 3. Join session validation
app.post('/api/sessions/:code/join', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const session = store.getSession(code);

  if (!session) {
    return res.status(404).json({ error: `Session "${code}" does not exist. Please check your join code.` });
  }

  res.json({
    valid: true,
    session: {
      code: session.code,
      title: session.title,
      createdAt: session.createdAt
    }
  });
});

// 4. Submit question
app.post('/api/sessions/:code/questions', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const session = store.getSession(code);

  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  const { text, authorName, isAnonymous, voterId } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Question text is required.' });
  }

  if (text.trim().length > 500) {
    return res.status(400).json({ error: 'Question text cannot exceed 500 characters.' });
  }

  const result = store.addQuestion(
    code,
    text,
    authorName || '',
    Boolean(isAnonymous),
    voterId || ''
  );

  if (result.error || !result.question) {
    return res.status(400).json({ error: result.error || 'Failed to submit question.' });
  }

  broadcast(req, code, 'question:created', result.question);

  res.status(201).json({
    message: 'Question submitted successfully',
    question: result.question
  });
});

// 5. Upvote a question (Strict duplicate prevention -> 409 Conflict)
app.post('/api/sessions/:code/questions/:questionId/upvote', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { questionId } = req.params;
  const { voterId } = req.body || {};

  if (!voterId || typeof voterId !== 'string') {
    return res.status(400).json({ error: 'voterId is required to register an upvote.' });
  }

  const result = store.upvoteQuestion(code, questionId, voterId.trim());

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  broadcast(req, code, 'question:upvoted', result.question);

  res.status(200).json({
    message: 'Upvote recorded successfully',
    question: result.question
  });
});

// 6. Update question status
app.patch('/api/sessions/:code/questions/:questionId', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { questionId } = req.params;
  const { status } = req.body || {};

  if (!['active', 'answered', 'hidden'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be active, answered, or hidden.' });
  }

  const result = store.updateQuestionStatus(code, questionId, status);
  if (result.error || !result.question) {
    return res.status(404).json({ error: result.error || 'Question not found.' });
  }

  broadcast(req, code, 'question:updated', result.question);

  res.json({
    message: 'Question status updated',
    question: result.question
  });
});

// 7. Delete question
app.delete('/api/sessions/:code/questions/:questionId', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { questionId } = req.params;

  const result = store.deleteQuestion(code, questionId);
  if (!result.success) {
    return res.status(404).json({ error: result.error || 'Question not found' });
  }

  broadcast(req, code, 'question:deleted', { questionId });

  res.json({ message: 'Question deleted successfully', questionId });
});

// 8. Create a poll
app.post('/api/sessions/:code/polls', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { question, options } = req.body || {};

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ error: 'Poll question is required.' });
  }

  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'At least 2 options are required for a poll.' });
  }

  const result = store.createPoll(code, question, options);
  if (result.error || !result.poll) {
    return res.status(400).json({ error: result.error || 'Failed to create poll.' });
  }

  broadcast(req, code, 'poll:created', result.poll);

  res.status(201).json({
    message: 'Poll created successfully',
    poll: result.poll
  });
});

// 9. Activate a poll
app.post('/api/sessions/:code/polls/:pollId/activate', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { pollId } = req.params;

  const result = store.activatePoll(code, pollId);
  if (result.error || !result.poll) {
    return res.status(404).json({ error: result.error || 'Poll not found.' });
  }

  broadcast(req, code, 'poll:activated', result.poll);

  res.json({
    message: 'Poll activated successfully',
    poll: result.poll
  });
});

// 10. Close a poll
app.post('/api/sessions/:code/polls/:pollId/close', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { pollId } = req.params;

  const result = store.closePoll(code, pollId);
  if (result.error || !result.poll) {
    return res.status(404).json({ error: result.error || 'Poll not found.' });
  }

  broadcast(req, code, 'poll:closed', result.poll);

  res.json({
    message: 'Poll closed successfully',
    poll: result.poll
  });
});

// 11. Vote in a poll (Strict duplicate prevention -> 409 Conflict)
app.post('/api/sessions/:code/polls/:pollId/vote', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const { pollId } = req.params;
  const { optionId, voterId } = req.body || {};

  if (typeof optionId !== 'number') {
    return res.status(400).json({ error: 'Valid optionId is required.' });
  }

  if (!voterId || typeof voterId !== 'string') {
    return res.status(400).json({ error: 'voterId is required to vote.' });
  }

  const result = store.voteInPoll(code, pollId, optionId, voterId.trim());

  if (result.error) {
    return res.status(result.status || 400).json({ error: result.error });
  }

  broadcast(req, code, 'poll:voted', result.poll);

  res.status(200).json({
    message: 'Vote counted successfully',
    poll: result.poll
  });
});

// 12. Export session data (JSON or CSV)
app.get('/api/sessions/:code/export', (req, res) => {
  const code = (req.params.code || '').toUpperCase().trim();
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const data = store.exportData(code);

  if (!data) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (format === 'csv') {
    let csv = `Session: ${data.session.title} (${data.session.code})\n\n`;
    csv += `QUESTIONS\nID,Text,Author,Anonymous,Upvotes,Status,Created At\n`;
    data.questions.forEach(q => {
      csv += `"${q.id}","${q.text.replace(/"/g, '""')}","${q.author}",${q.isAnonymous},${q.upvotes},${q.status},"${q.createdAt}"\n`;
    });
    csv += `\nPOLLS\nPoll ID,Question,Status,Total Votes,Option,Option Votes,Percentage\n`;
    data.polls.forEach(p => {
      p.options.forEach(o => {
        csv += `"${p.id}","${p.question.replace(/"/g, '""')}",${p.status},${p.totalVotes},"${o.text.replace(/"/g, '""')}",${o.votes},${o.percentage}%\n`;
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="livepulse-${code}-export.csv"`);
    return res.send(csv);
  }

  res.json(data);
});
