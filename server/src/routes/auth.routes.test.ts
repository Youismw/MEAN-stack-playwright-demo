import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { app } from '../app.js';
import { connectDatabases, closeDatabases } from '../db.js';
import { User } from '../models/User.js';

describe('Auth Routes Unit Tests', () => {
  const secret = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';
  const testUserId = new Types.ObjectId('000000000000000000000001');
  const testEmail = 'qa.user@quicktix.test';
  const testPassword = 'Passw0rd!test';

  before(async () => {
    await connectDatabases();
    await User.deleteMany({});
    await User.create({
      _id: testUserId,
      email: testEmail,
      password: bcrypt.hashSync(testPassword, 4),
      role: 'user',
    });
  });

  after(async () => {
    await closeDatabases();
  });

  it('should return 401 when email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '' });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
    assert.equal(res.body.message, 'Invalid email or password');
  });

  it('should return 401 when password does not match', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPassword!' });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
  });

  it('should return 401 when user does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@quicktix.test', password: testPassword });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
  });

  it('should return 200 and valid JWT token on correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    assert.equal(res.status, 200);
    assert.ok(res.body.token, 'Response should contain token');

    const decoded: any = jwt.verify(res.body.token, secret);
    assert.equal(decoded.id, testUserId.toString());
    assert.equal(decoded.email, testEmail);
  });
});
