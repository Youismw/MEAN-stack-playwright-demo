import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { app } from '../app.js';
import { connectDatabases, closeDatabases } from '../db.js';
import { Ticket } from '../models/Ticket.js';

describe('Ticket Routes Unit Tests', () => {
  const secret = process.env.JWT_SECRET || 'dev-only-secret-do-not-use-in-production';
  const user1Id = new Types.ObjectId('000000000000000000000001');
  const user2Id = new Types.ObjectId('000000000000000000000002');

  const tokenUser1 = jwt.sign(
    { id: user1Id.toString(), email: 'qa.user@quicktix.test' },
    secret,
    { expiresIn: '2h' }
  );
  const tokenUser2 = jwt.sign(
    { id: user2Id.toString(), email: 'other.user@quicktix.test' },
    secret,
    { expiresIn: '2h' }
  );

  let user1TicketId = '';
  let user2TicketId = '';

  before(async () => {
    await connectDatabases();
    await Ticket.deleteMany({});

    const t1 = await Ticket.create({
      title: 'Fix header layout bug',
      description: 'Alignment problem on desktop viewports',
      priority: 'High',
      status: 'Open',
      owner: user1Id,
    });
    user1TicketId = t1._id.toString();

    const t2 = await Ticket.create({
      title: 'Foreign secret ticket',
      description: 'Confidential ticket belonging to user 2',
      priority: 'Urgent',
      status: 'Open',
      owner: user2Id,
    });
    user2TicketId = t2._id.toString();
  });

  after(async () => {
    await closeDatabases();
  });

  it('should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/tickets');
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Unauthorized');
  });

  it('should list only tickets owned by authenticated user', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].title, 'Fix header layout bug');
  });

  it('should validate title length on creation (< 3 characters)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({ title: 'ab', priority: 'High' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'ValidationError');
    assert.match(res.body.message, /Title must be between 3 and 100 characters/i);
  });

  it('should validate priority enum value', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({ title: 'Valid Title Here', priority: 'InvalidPriority' });

    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'ValidationError');
  });

  it('should create a ticket with 201 status code on valid payload', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({
        title: 'New Feature Request',
        description: 'Detailed explanation of requirement',
        priority: 'Medium',
        status: 'Open',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'New Feature Request');
    assert.equal(res.body.owner, user1Id.toString());
  });

  it('should isolate owners: User 1 fetching User 2 ticket returns 404', async () => {
    const res = await request(app)
      .get(`/api/tickets/${user2TicketId}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'NotFound');
  });

  it('should isolate owners: User 1 deleting User 2 ticket returns 404', async () => {
    const res = await request(app)
      .delete(`/api/tickets/${user2TicketId}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.equal(res.status, 404);
  });

  it('should update ticket status via PUT', async () => {
    const res = await request(app)
      .put(`/api/tickets/${user1TicketId}`)
      .set('Authorization', `Bearer ${tokenUser1}`)
      .send({ status: 'Resolved' });

    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'Resolved');
  });

  it('should delete ticket via DELETE', async () => {
    const res = await request(app)
      .delete(`/api/tickets/${user1TicketId}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.equal(res.status, 204);

    const checkRes = await request(app)
      .get(`/api/tickets/${user1TicketId}`)
      .set('Authorization', `Bearer ${tokenUser1}`);

    assert.equal(checkRes.status, 404);
  });
});
