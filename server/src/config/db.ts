/**
 * ============================================================================
 * FOLDER: server/src/config/
 * ============================================================================
 * Configuration directory containing environment configurations and database
 * connection management logic for the backend.
 *
 * ============================================================================
 * MODULE: server/src/config/db.ts (Dual-Database Connection Manager)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Establishes and manages connections to TWO separate MongoDB databases:
 *   1. Users Database  (default: mongodb://localhost:27017/quicktix_users_dev)
 *   2. Tickets Database (default: mongodb://localhost:27018/quicktix_tickets_dev)
 *
 * ARCHITECTURAL PURPOSE:
 * Implements database-per-service domain separation: User identities and
 * ticket records live in distinct databases so they cannot cross-pollinate
 * or perform joins. Models bind specifically to their respective connection.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Called by `server/src/index.ts` during startup.
 *   2. `resolveDatabaseUris()` determines whether the server is running in
 *      'test' mode or 'development' mode.
 *      - If 'test', forces database names to end with '_test'.
 *      - If 'dev', connects to '_dev' databases.
 *   3. `mongoose.createConnection(usersUri)` creates `userDbConnection`.
 *   4. `mongoose.createConnection(ticketsUri)` creates `ticketDbConnection`.
 *   5. `server/src/models/User.ts` uses `userDbConnection.model(...)`.
 *   6. `server/src/models/Ticket.ts` uses `ticketDbConnection.model(...)`.
 *   7. `connectDatabases()` waits for both connections to establish before
 *      Express opens port 3000.
 * ============================================================================
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose, { Connection } from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables are loaded if db.ts is executed directly in test runners
const rootEnv = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

const NODE_ENV = (process.env.NODE_ENV || 'development').trim().toLowerCase();

/**
 * Resolves separate database URIs for user and ticket (backend) services.
 * Follows architectural best practices to ensure separate domains do not share databases.
 *
 * Hypothetical run:
 *   - In Playwright/CI test mode (NODE_ENV=test), it returns:
 *     usersUri: mongodb://localhost:27017/quicktix_users_test
 *     ticketsUri: mongodb://localhost:27018/quicktix_tickets_test
 *   - In local dev mode, it returns:
 *     usersUri: mongodb://localhost:27017/quicktix_users_dev
 *     ticketsUri: mongodb://localhost:27018/quicktix_tickets_dev
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

  // Guarantee test database isolation: prevents tests from polluting development databases
  if (isTest) {
    if (usersUri && usersUri.endsWith('_dev')) {
      usersUri = usersUri.replace(/_dev$/, '_test');
    }
    if (ticketsUri && ticketsUri.endsWith('_dev')) {
      ticketsUri = ticketsUri.replace(/_dev$/, '_test');
    }
  }

  // Fallback to MONGO_URI if specific URIs are not provided
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

// Compute active URIs upon module load
const { usersUri, ticketsUri } = resolveDatabaseUris();

// Create isolated Mongoose Connection instances (separate socket pools)
export const userDbConnection: Connection = mongoose.createConnection(usersUri);
export const ticketDbConnection: Connection = mongoose.createConnection(ticketsUri);

/**
 * Connects both databases in parallel.
 * Returns a promise that resolves only when both MongoDB sockets are ready.
 *
 * Communicates with:
 *   - Called by `server/src/index.ts` during server startup.
 *   - Queried by `server/src/routes/health.routes.ts` to check `readyState === 1`.
 */
export async function connectDatabases(): Promise<{ userDb: Connection; ticketDb: Connection }> {
  await Promise.all([
    userDbConnection.asPromise(),
    ticketDbConnection.asPromise(),
  ]);
  return { userDb: userDbConnection, ticketDb: ticketDbConnection };
}

/**
 * Closes both database connections gracefully.
 * Called during SIGINT/SIGTERM shutdown in `index.ts` or after automated test runs.
 */
export async function closeDatabases(): Promise<void> {
  await Promise.all([
    userDbConnection.close(),
    ticketDbConnection.close(),
  ]);
}
