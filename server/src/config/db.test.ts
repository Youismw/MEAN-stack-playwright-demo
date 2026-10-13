import { test, expect } from '@playwright/test';
import { resolveDatabaseUris, closeDatabases } from './db.js';

test.describe('Database Separation & URI Resolution', () => {

  test('should resolve two completely separate databases for user and ticket services', () => {
    const { usersUri, ticketsUri } = resolveDatabaseUris();

    expect(usersUri).toBeTruthy();
    expect(ticketsUri).toBeTruthy();
    expect(usersUri).not.toBe(ticketsUri);
  });

  test('should ensure database names end with _test in test environment', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    const { usersUri, ticketsUri } = resolveDatabaseUris();
    const userDbName = new URL(usersUri).pathname.replace(/^\//, '');
    const ticketDbName = new URL(ticketsUri).pathname.replace(/^\//, '');

    expect(userDbName.endsWith('_test')).toBe(true);
    expect(ticketDbName.endsWith('_test')).toBe(true);

    process.env.NODE_ENV = originalEnv;
  });

  test('should prioritize explicit MONGO_USERS_URI and MONGO_TICKETS_URI when provided', () => {
    const originalUsers = process.env.MONGO_USERS_URI;
    const originalTickets = process.env.MONGO_TICKETS_URI;

    process.env.MONGO_USERS_URI = 'mongodb://127.0.0.1:27017/custom_users_db_test';
    process.env.MONGO_TICKETS_URI = 'mongodb://127.0.0.1:27017/custom_tickets_db_test';

    const { usersUri, ticketsUri } = resolveDatabaseUris();

    expect(usersUri).toBe('mongodb://127.0.0.1:27017/custom_users_db_test');
    expect(ticketsUri).toBe('mongodb://127.0.0.1:27017/custom_tickets_db_test');

    if (originalUsers) process.env.MONGO_USERS_URI = originalUsers;
    else delete process.env.MONGO_USERS_URI;

    if (originalTickets) process.env.MONGO_TICKETS_URI = originalTickets;
    else delete process.env.MONGO_TICKETS_URI;
  });
});
