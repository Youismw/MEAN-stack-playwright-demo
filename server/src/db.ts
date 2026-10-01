import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose, { Connection } from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables are loaded
const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const NODE_ENV = (process.env.NODE_ENV || 'development').trim().toLowerCase();

/**
 * Resolves separate database URIs for user and ticket (backend) services.
 * Follows architectural best practices to ensure separate domains do not share databases.
 */
export function resolveDatabaseUris(): { usersUri: string; ticketsUri: string } {
  const currentEnv = (process.env.NODE_ENV || 'development').trim().toLowerCase();
  const isTest = currentEnv === 'test';
  const defaultUsersHost = process.env.MONGO_USERS_HOST || 'mongodb://localhost:27017';
  const defaultTicketsHost = process.env.MONGO_TICKETS_HOST || 'mongodb://localhost:27018';

  const defaultUsersDb = isTest ? 'quicktix_users_test' : 'quicktix_users_dev';
  const defaultTicketsDb = isTest ? 'quicktix_tickets_test' : 'quicktix_tickets_dev';

  let usersUri = process.env.MONGO_USERS_URI || process.env.USERS_MONGO_URI;
  let ticketsUri = process.env.MONGO_TICKETS_URI || process.env.TICKETS_MONGO_URI || process.env.MONGO_BACKEND_URI;

  if (isTest) {
    if (usersUri && usersUri.endsWith('_dev')) {
      usersUri = usersUri.replace(/_dev$/, '_test');
    }
    if (ticketsUri && ticketsUri.endsWith('_dev')) {
      ticketsUri = ticketsUri.replace(/_dev$/, '_test');
    }
  }

  if (!usersUri || !ticketsUri) {
    const fallbackBaseUri = process.env.MONGO_URI;
    if (fallbackBaseUri) {
      try {
        const parsed = new URL(fallbackBaseUri);
        const originalDb = parsed.pathname.replace(/^\//, '');

        if (!usersUri) {
          const userDbName = originalDb
            ? `${originalDb.replace(/(_test|_dev)?$/, '')}_users_${isTest ? 'test' : 'dev'}`
            : defaultUsersDb;
          parsed.pathname = `/${userDbName}`;
          usersUri = parsed.toString();
        }

        if (!ticketsUri) {
          const ticketDbName = originalDb
            ? `${originalDb.replace(/(_test|_dev)?$/, '')}_tickets_${isTest ? 'test' : 'dev'}`
            : defaultTicketsDb;
          parsed.pathname = `/${ticketDbName}`;
          ticketsUri = parsed.toString();
        }
      } catch {
        if (!usersUri) usersUri = `${defaultUsersHost}/${defaultUsersDb}`;
        if (!ticketsUri) ticketsUri = `${defaultTicketsHost}/${defaultTicketsDb}`;
      }
    } else {
      if (!usersUri) usersUri = `${defaultUsersHost}/${defaultUsersDb}`;
      if (!ticketsUri) ticketsUri = `${defaultTicketsHost}/${defaultTicketsDb}`;
    }
  }

  return { usersUri, ticketsUri };
}

const { usersUri, ticketsUri } = resolveDatabaseUris();

export const userDbConnection: Connection = mongoose.createConnection(usersUri);
export const ticketDbConnection: Connection = mongoose.createConnection(ticketsUri);

export async function connectDatabases(): Promise<{ userDb: Connection; ticketDb: Connection }> {
  await Promise.all([
    userDbConnection.asPromise(),
    ticketDbConnection.asPromise(),
  ]);
  return { userDb: userDbConnection, ticketDb: ticketDbConnection };
}

export async function closeDatabases(): Promise<void> {
  await Promise.all([
    userDbConnection.close(),
    ticketDbConnection.close(),
  ]);
}
