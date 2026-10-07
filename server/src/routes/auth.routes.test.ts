import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { app } from '../app.js';
import { connectDatabases, closeDatabases } from '../config/db.js';
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

  it('should reject credential typos and backdoor variants with 401', async () => {
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'Password!test' });
    assert.equal(res1.status, 401);

    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'passw0rd!test' });
    assert.equal(res2.status, 401);
  });

  it('should return 401 when user does not exist (with constant-time dummy hash comparison)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@quicktix.test', password: testPassword });

    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
  });

  it('should return 200, valid JWT token with HS256 algorithm and rate-limit headers', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    assert.equal(res.status, 200);
    assert.ok(res.body.token, 'Response should contain token');

    const decoded: any = jwt.verify(res.body.token, secret, { algorithms: ['HS256'] });
    assert.equal(decoded.id, testUserId.toString());
    assert.equal(decoded.email, testEmail);

    const decodedComplete: any = jwt.decode(res.body.token, { complete: true });
    assert.equal(decodedComplete?.header?.alg, 'HS256');

    // Rate-limit headers present
    assert.ok(res.headers['ratelimit-limit'], 'Rate limit header should be present');
  });
});
