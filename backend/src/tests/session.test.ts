// Set environment variables before importing app
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/ai-devops-interview-test';
process.env.JWT_SECRET = 'test_jwt_secret_key_123456';

import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index';
import { User } from '../models/User';
import { Session } from '../models/Session';

describe('Session and AI Interview Integration Tests', () => {
  let token: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI!);
    }

    await User.deleteMany({});
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Interview Candidate',
        email: 'candidate@test.com',
        password: 'Password123!',
        role: 'candidate'
      });
    
    token = res.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Session.deleteMany({});
  });

  it('should successfully start a new interview session', async () => {
    const res = await request(app)
      .post('/api/session/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Docker',
        difficulty: 'Medium',
        totalQuestions: 3
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('topic', 'Docker');
    expect(res.body).toHaveProperty('difficulty', 'Medium');
    expect(res.body).toHaveProperty('totalQuestions', 3);
    expect(res.body).toHaveProperty('isCompleted', false);
  });

  it('should fail starting session if difficulty is invalid', async () => {
    const res = await request(app)
      .post('/api/session/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Docker',
        difficulty: 'SuperHard',
        totalQuestions: 3
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });

  it('should generate MCQ question and submit answer silently', async () => {
    // 1. Start session
    const startRes = await request(app)
      .post('/api/session/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Kubernetes',
        difficulty: 'Easy',
        totalQuestions: 1
      });
    
    const sessionId = startRes.body._id;

    // 2. Generate MCQ question
    const genRes = await request(app)
      .post('/api/question/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });

    expect(genRes.status).toBe(200);
    expect(genRes.body).toHaveProperty('questionId');
    expect(genRes.body).toHaveProperty('question');
    expect(genRes.body).toHaveProperty('options');
    expect(genRes.body.options).toHaveLength(4);
    expect(genRes.body).not.toHaveProperty('correctOptionIndex'); // Hidden!
    expect(genRes.body).not.toHaveProperty('explanation'); // Hidden!

    const questionId = genRes.body.questionId;

    // 3. Submit selected option index
    const submitRes = await request(app)
      .post('/api/answer/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId,
        questionId,
        userSelectedIndex: 2
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body).toHaveProperty('success', true);
    expect(submitRes.body).toHaveProperty('isCompleted', true);
    expect(submitRes.body).not.toHaveProperty('verdict'); // Suspenseful - hidden until report!
  });
});
