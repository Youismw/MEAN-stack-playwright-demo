/**
 * ============================================================================
 * FOLDER: playwright/03-integration-api/
 * ============================================================================
 * Taxonomy Category: 3. INTEGRATION AND API TESTING
 * Subcategory:       REST API Contracts & Schemas
 *
 * ============================================================================
 * MODULE: playwright/03-integration-api/api-contract.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Exercises the Express REST API endpoints headlessly via Playwright's
 * `APIRequestContext` (`request`), validating response status codes and schema shapes:
 *   - `GET /api/health`: returns 200 `{ status: "ok", mongo: "connected" }`.
 *   - `GET /api/tickets`: validates full ticket entity schema (`_id`, `title`,
 *     `priority`, `status`, `owner`, `createdAt`, `updatedAt`).
 *   - `POST /api/tickets`: rejects short title with 400 `{ error: "ValidationError" }`.
 *
 * COMMUNICATES WITH:
 *   - Communicates directly over HTTP with Express backend routes.
 *   - Bypasses the browser DOM completely for maximum speed.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. `beforeAll` logs in via `POST /api/auth/login` to obtain an auth token.
 *   2. Playwright sends HTTP requests directly to Express 5 server.
 *   3. JSON payloads and status codes are asserted against CONTRACT.md schemas.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';
import { TEST_USERS } from '../fixtures/mock-data.js';

test.describe('3. Integration & API Testing › API Contract Testing', () => {
  let authToken: string;

  // Obtain authorization token before executing contract checks
  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: TEST_USERS.bot.email,
        password: TEST_USERS.bot.password,
      },
    });
    expect(loginRes.status()).toBe(200);
    const data = await loginRes.json();
    authToken = data.token;
  });

  test(
    'GET /api/health returns 200 { status: "ok", mongo: "connected" }',
    { tag: ['@smoke', '@api', '@contract'] },
    async ({ request }) => {
      // 1. Invoke health check endpoint
      const res = await request.get('/api/health');

      // 2. Assert HTTP 200 and mongo connection confirmation
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ status: 'ok', mongo: 'connected' });
    }
  );

  test(
    'GET /api/tickets adheres to ticket entity schema specification',
    { tag: ['@api', '@contract'] },
    async ({ request }) => {
      // 1. Fetch tickets with Bearer token
      const res = await request.get('/api/tickets', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status()).toBe(200);
      const tickets = await res.json();
      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBeGreaterThan(0);

      // 2. Validate schema attributes on returned entity
      const sample = tickets[0];
      expect(sample).toHaveProperty('_id');
      expect(sample).toHaveProperty('title');
      expect(sample).toHaveProperty('priority');
      expect(sample).toHaveProperty('status');
      expect(sample).toHaveProperty('owner');
      expect(sample).toHaveProperty('createdAt');
      expect(sample).toHaveProperty('updatedAt');
    }
  );

  test(
    'POST /api/tickets with invalid short title returns 400 ValidationError',
    { tag: ['@api', '@contract', '@negative'] },
    async ({ request }) => {
      // 1. Submit invalid payload (< 3 chars title)
      const res = await request.post('/api/tickets', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { title: 'ab', priority: 'High' },
      });

      // 2. Assert 400 Bad Request error contract
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('ValidationError');
      expect(body.message).toContain('Title must be between 3 and 100 characters');
    }
  );
});
