import request from 'supertest';
import { app } from './app.js';
import { store } from './store.js';

describe('Live Q&A and Polls Backend API Tests', () => {
  let sessionCode;
  const testVoterA = 'voter_test_alpha_111';
  const testVoterB = 'voter_test_beta_222';

  beforeAll(async () => {
    // Re-seed demo data to start fresh
    store.seedDemo();
  });

  // Test 1: Creates session and returns a valid 6-character code
  test('1. Creates session and returns a valid 6-character code', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Global Dev Summit 2026' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('session');
    expect(res.body.session).toHaveProperty('code');
    expect(res.body.session.title).toBe('Global Dev Summit 2026');
    expect(res.body.session.code).toMatch(/^[A-Z0-9]{6}$/);

    sessionCode = res.body.session.code;
  });

  // Test 2: Validates session title input on server
  test('2. Validates session title input on server', async () => {
    // Empty title
    const resEmpty = await request(app)
      .post('/api/sessions')
      .send({ title: '   ' });

    expect(resEmpty.status).toBe(400);
    expect(resEmpty.body).toHaveProperty('error');
    expect(resEmpty.body.error).toContain('Session title is required');

    // Missing title field
    const resMissing = await request(app)
      .post('/api/sessions')
      .send({});

    expect(resMissing.status).toBe(400);
    expect(resMissing.body).toHaveProperty('error');

    // Non-string title
    const resNonString = await request(app)
      .post('/api/sessions')
      .send({ title: 12345 });

    expect(resNonString.status).toBe(400);
  });

  // Test 3: Submits a new question successfully
  test('3. Submits a new question successfully', async () => {
    const res = await request(app)
      .post(`/api/sessions/${sessionCode}/questions`)
      .send({
        text: 'What are the best practices for low-latency WebSocket clusters?',
        authorName: 'Ada Lovelace',
        isAnonymous: false,
        voterId: testVoterA
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('question');
    expect(res.body.question.text).toBe('What are the best practices for low-latency WebSocket clusters?');
    expect(res.body.question.authorName).toBe('Ada Lovelace');
    expect(res.body.question.upvotes).toBe(0);
    expect(res.body.question.status).toBe('active');
  });

  // Test 4: Enforces strict single-vote on questions (rejects duplicate vote with 409)
  test('4. Enforces strict single-vote on questions (rejects duplicate vote with 409)', async () => {
    // First, submit a question to vote on
    const qRes = await request(app)
      .post(`/api/sessions/${sessionCode}/questions`)
      .send({
        text: 'Can we test duplicate vote rejection?',
        authorName: 'Security Tester',
        isAnonymous: false,
        voterId: testVoterA
      });

    const questionId = qRes.body.question.id;

    // First upvote from voter B -> Should succeed (200)
    const firstVoteRes = await request(app)
      .post(`/api/sessions/${sessionCode}/questions/${questionId}/upvote`)
      .send({ voterId: testVoterB });

    expect(firstVoteRes.status).toBe(200);
    expect(firstVoteRes.body.question.upvotes).toBe(1);

    // Second upvote from SAME voter B -> MUST return 409 Conflict
    const duplicateVoteRes = await request(app)
      .post(`/api/sessions/${sessionCode}/questions/${questionId}/upvote`)
      .send({ voterId: testVoterB });

    expect(duplicateVoteRes.status).toBe(409);
    expect(duplicateVoteRes.body).toHaveProperty('error');
    expect(duplicateVoteRes.body.error).toBe('You have already upvoted this question.');
  });

  // Test 5: Enforces strict single-vote on active polls (rejects duplicate vote with 409)
  test('5. Enforces strict single-vote on active polls (rejects duplicate vote with 409)', async () => {
    // Create a new poll in this session
    const createPollRes = await request(app)
      .post(`/api/sessions/${sessionCode}/polls`)
      .send({
        question: 'Which frontend framework do you prefer for high-performance dashboards?',
        options: ['React', 'Vue', 'Svelte', 'Solid']
      });

    expect(createPollRes.status).toBe(201);
    const pollId = createPollRes.body.poll.id;

    // Activate poll if not active
    await request(app).post(`/api/sessions/${sessionCode}/polls/${pollId}/activate`);

    // First vote from voter A on option 0 -> Should succeed (200)
    const firstVoteRes = await request(app)
      .post(`/api/sessions/${sessionCode}/polls/${pollId}/vote`)
      .send({
        pollId,
        optionId: 0,
        voterId: testVoterA
      });

    expect(firstVoteRes.status).toBe(200);
    expect(firstVoteRes.body.poll.totalVotes).toBe(1);
    expect(firstVoteRes.body.poll.options[0].votes).toBe(1);

    // Second vote attempt from SAME voter A -> MUST return 409 Conflict
    const duplicateVoteRes = await request(app)
      .post(`/api/sessions/${sessionCode}/polls/${pollId}/vote`)
      .send({
        pollId,
        optionId: 1, // trying to vote on another option or same option
        voterId: testVoterA
      });

    expect(duplicateVoteRes.status).toBe(409);
    expect(duplicateVoteRes.body).toHaveProperty('error');
    expect(duplicateVoteRes.body.error).toBe('You have already voted in this poll.');
  });
});
