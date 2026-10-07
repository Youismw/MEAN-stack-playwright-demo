/**
 * ============================================================================
 * FOLDER: server/src/routes/
 * ============================================================================
 * Routing Layer: Defines HTTP endpoints, attaches endpoint-specific middleware,
 * executes controller business logic, and serializes JSON responses.
 *
 * ============================================================================
 * MODULE: server/src/routes/health.routes.ts (Liveness & Database Probe)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Exposes an unauthenticated endpoint: `GET /api/health`.
 * Inspects the socket connectivity (`readyState === 1`) of BOTH Mongoose database
 * connection pools:
 *   - `userDbConnection`   (Users DB on port 27017)
 *   - `ticketDbConnection` (Tickets DB on port 27018)
 *
 * COMMUNICATES WITH:
 *   - Mounted by `server/src/app.ts` under prefix `/api` -> `/api/health`.
 *   - `server/src/config/db.ts`: Inspects connection objects.
 *   - `playwright.config.ts`: Polled by Playwright's `webServer` before running E2E tests.
 *   - Cloud load balancers / Docker compose healthchecks for liveness probes.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Playwright CLI starts `npm start --prefix server`.
 *   2. Playwright sends HTTP GET to `http://localhost:3000/api/health`.
 *   3. If both MongoDB clusters are connected (`readyState === 1`):
 *      - Responds with `HTTP 200 { status: 'ok', mongo: 'connected' }`.
 *      - Playwright detects readiness and launches the browser test suite.
 *   4. If MongoDB is starting or disconnected:
 *      - Responds with `HTTP 503 { status: 'error', mongo: 'disconnected' }`.
 * ============================================================================
 */

import { Router, Request, Response } from 'express';
import { userDbConnection, ticketDbConnection } from '../config/db.js';

const router = Router();

// GET /api/health
router.get('/health', (_req: Request, res: Response): void => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isUserDbConnected = userDbConnection.readyState === 1;
  const isTicketDbConnected = ticketDbConnection.readyState === 1;
  const isMongoConnected = isUserDbConnected && isTicketDbConnected;

  if (isMongoConnected) {
    res.status(200).json({ status: 'ok', mongo: 'connected' });
  } else {
    res.status(503).json({
      status: 'error',
      mongo: 'disconnected',
      details: {
        usersDb: isUserDbConnected ? 'connected' : 'disconnected',
        ticketsDb: isTicketDbConnected ? 'connected' : 'disconnected',
      },
    });
  }
});

export const healthRouter = router;
