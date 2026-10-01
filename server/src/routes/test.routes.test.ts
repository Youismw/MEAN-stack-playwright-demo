import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
const { app } = await import('../app.js');
const { connectDatabases, closeDatabases } = await import('../db.js');

describe('Test Routes Integration Tests', () => {
  before(async () => {
    await connectDatabases();
  });

  after(async () => {
    await closeDatabases();
  });

  it('should reset database and return seeded counts', async () => {
    const res = await request(app).post('/api/test/reset');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'reset_complete');
    assert.equal(res.body.users.length, 2);
    assert.equal(res.body.tickets.length, 5);
  });

  it('should handle concurrent reset calls safely without duplicate key collisions', async () => {
    const concurrentRequests = [
      request(app).post('/api/test/reset'),
      request(app).post('/api/test/reset'),
      request(app).post('/api/test/reset'),
    ];

    const responses = await Promise.all(concurrentRequests);
    for (const res of responses) {
      assert.equal(res.status, 200, `Expected 200 but got ${res.status}: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.status, 'reset_complete');
    }
  });
});
