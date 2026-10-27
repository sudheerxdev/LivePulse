import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../../backend/app.js';
import { store } from '../../backend/store.js';

describe('Live Q&A and Polls Unit & Integration Tests (node:test)', () => {
  let sessionCode = '';
  const testVoter1 = 'voter_unit_test_alpha';
  const testVoter2 = 'voter_unit_test_beta';

  test('1. Creates session and returns a valid 6-character code', async () => {
    store.seedDemo();
    const res = await request(app)
      .post('/api/sessions')
      .send({ title: 'Autonomous AI Conference 2026' });

    assert.equal(res.status, 201);
    assert.ok(res.body.session);
    assert.equal(res.body.session.title, 'Autonomous AI Conference 2026');
    assert.match(res.body.session.code, /^[A-Z0-9]{6}$/);

    sessionCode = res.body.session.code;
  });

  test('2. Validates session title input on server', async () => {
    const resEmpty = await request(app)
      .post('/api/sessions')
      .send({ title: '   ' });

    assert.equal(resEmpty.status, 400);
    assert.ok(resEmpty.body.error);
    assert.match(resEmpty.body.error, /required/i);

    const resMissing = await request(app)
      .post('/api/sessions')
      .send({});

    assert.equal(resMissing.status, 400);
  });

  test('3. Submits a new question successfully', async () => {
    const res = await request(app)
      .post(`/api/sessions/${sessionCode}/questions`)
      .send({
        text: 'How do you ensure zero-downtime serverless WebSocket scaling?',
        authorName: 'Grace Hopper',
        isAnonymous: false,
        voterId: testVoter1
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.question.text, 'How do you ensure zero-downtime serverless WebSocket scaling?');
    assert.equal(res.body.question.authorName, 'Grace Hopper');
    assert.equal(res.body.question.upvotes, 0);
  });

  test('4. Enforces strict single-vote on questions (rejects duplicate vote with 409)', async () => {
    const qRes = await request(app)
      .post(`/api/sessions/${sessionCode}/questions`)
      .send({
        text: 'Duplicate prevention test question',
        authorName: 'QA Bot',
        isAnonymous: true,
        voterId: testVoter1
      });

    const questionId = qRes.body.question.id;

    // Vote 1: success
    const vote1 = await request(app)
      .post(`/api/sessions/${sessionCode}/questions/${questionId}/upvote`)
      .send({ voterId: testVoter2 });

    assert.equal(vote1.status, 200);
    assert.equal(vote1.body.question.upvotes, 1);

    // Vote 2: conflict
    const vote2 = await request(app)
      .post(`/api/sessions/${sessionCode}/questions/${questionId}/upvote`)
      .send({ voterId: testVoter2 });

    assert.equal(vote2.status, 409);
    assert.equal(vote2.body.error, 'You have already upvoted this question.');
  });

  test('5. Enforces strict single-vote on active polls (rejects duplicate vote with 409)', async () => {
    const pollRes = await request(app)
      .post(`/api/sessions/${sessionCode}/polls`)
      .send({
        question: 'Which deployment model do you prefer?',
        options: ['Edge Containers', 'Serverless Functions', 'Dedicated Kubernetes']
      });

    assert.equal(pollRes.status, 201);
    const pollId = pollRes.body.poll.id;

    // First vote: success
    const vote1 = await request(app)
      .post(`/api/sessions/${sessionCode}/polls/${pollId}/vote`)
      .send({ optionId: 0, voterId: testVoter1 });

    assert.equal(vote1.status, 200);
    assert.equal(vote1.body.poll.totalVotes, 1);

    // Second vote: 409 Conflict
    const vote2 = await request(app)
      .post(`/api/sessions/${sessionCode}/polls/${pollId}/vote`)
      .send({ optionId: 1, voterId: testVoter1 });

    assert.equal(vote2.status, 409);
    assert.equal(vote2.body.error, 'You have already voted in this poll.');
  });
});
