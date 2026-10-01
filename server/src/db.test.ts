import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDatabaseUris, closeDatabases } from './db.js';

describe('Database Separation & URI Resolution', () => {
  after(async () => {
    await closeDatabases();
  });

  it('should resolve two completely separate databases for user and ticket services', () => {
    const { usersUri, ticketsUri } = resolveDatabaseUris();

    assert.ok(usersUri, 'usersUri must be defined');
    assert.ok(ticketsUri, 'ticketsUri must be defined');
    assert.notEqual(
      usersUri,
      ticketsUri,
      'Architectural violation: user data and backend ticket data must never share the same database'
    );
  });

  it('should ensure database names end with _test in test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const { usersUri, ticketsUri } = resolveDatabaseUris();
    const userDbName = new URL(usersUri).pathname.replace(/^\//, '');
    const ticketDbName = new URL(ticketsUri).pathname.replace(/^\//, '');

    assert.ok(
      userDbName.endsWith('_test'),
      `Expected user db name '${userDbName}' to end in '_test'`
    );
    assert.ok(
      ticketDbName.endsWith('_test'),
      `Expected ticket db name '${ticketDbName}' to end in '_test'`
    );

    process.env.NODE_ENV = originalEnv;
  });

  it('should prioritize explicit MONGO_USERS_URI and MONGO_TICKETS_URI when provided', () => {
    const originalUsers = process.env.MONGO_USERS_URI;
    const originalTickets = process.env.MONGO_TICKETS_URI;

    process.env.MONGO_USERS_URI = 'mongodb://127.0.0.1:27017/custom_users_db_test';
    process.env.MONGO_TICKETS_URI = 'mongodb://127.0.0.1:27017/custom_tickets_db_test';

    const { usersUri, ticketsUri } = resolveDatabaseUris();

    assert.equal(usersUri, 'mongodb://127.0.0.1:27017/custom_users_db_test');
    assert.equal(ticketsUri, 'mongodb://127.0.0.1:27017/custom_tickets_db_test');

    if (originalUsers) process.env.MONGO_USERS_URI = originalUsers;
    else delete process.env.MONGO_USERS_URI;

    if (originalTickets) process.env.MONGO_TICKETS_URI = originalTickets;
    else delete process.env.MONGO_TICKETS_URI;
  });
});
