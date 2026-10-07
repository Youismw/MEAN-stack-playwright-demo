import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../app.js';
import { connectDatabases, closeDatabases } from '../config/db.js';

describe('Health Routes Unit / Integration Tests', () => {
  after(async () => {
    await closeDatabases();
  });

  it('should return 200 { status: "ok", mongo: "connected" } when databases are connected', async () => {
    await connectDatabases();

    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok', mongo: 'connected' });
  });
});
