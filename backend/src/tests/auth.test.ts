// Set environment variables before importing app
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/ai-devops-interview-test';
process.env.JWT_SECRET = 'test_jwt_secret_key_123456';

import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../index';
import { User } from '../models/User';

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    // Wait for mongoose connection to stabilize if needed
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI!);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await User.deleteMany({});
  });

  it('should successfully register a candidate user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: 'candidate'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('name', 'John Doe');
    expect(res.body).toHaveProperty('email', 'john@example.com');
    expect(res.body).toHaveProperty('role', 'candidate');
  });

  it('should fail registration if email is malformed', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john-malformed-email',
        password: 'Password123!',
        role: 'candidate'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation failed');
    expect(res.body.errors[0]).toHaveProperty('field', 'email');
  });

  it('should fail registration if email already exists', async () => {
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User One',
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

    // Duplicate registration
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Email already registered');
  });

  it('should successfully login an existing user', async () => {
    // Register the user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Test',
        email: 'login@example.com',
        password: 'Password123!'
      });

    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('email', 'login@example.com');
  });

  it('should fail login with incorrect password', async () => {
    // Register the user
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Login Fail Test',
        email: 'loginfail@example.com',
        password: 'Password123!'
      });

    // Login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'loginfail@example.com',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });
});
