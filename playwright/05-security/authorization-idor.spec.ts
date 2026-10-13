/**
 * ============================================================================
 * FOLDER: playwright/05-security/
 * ============================================================================
 * Taxonomy Category: 5. SECURITY TESTING
 * Subcategory:       Authorization, Access Control & IDOR Protection
 *
 * ============================================================================
 * MODULE: playwright/05-security/authorization-idor.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests for Insecure Direct Object References (IDOR):
 *   - User 1 attempts to fetch User 2's ticket ID directly (`GET /api/tickets/:id`).
 *   - User 1 attempts to modify User 2's ticket directly (`PUT /api/tickets/:id`).
 *   - User 1 attempts to delete User 2's ticket directly (`DELETE /api/tickets/:id`).
 *   - Confirms that all unauthorized cross-tenant operations return HTTP 404
 *     without leaking entity existence.
 *
 * COMMUNICATES WITH:
 *   - Backend query filter `{ _id: id, owner: req.user.id }` in
 *     `server/src/routes/ticket.routes.ts`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Attacker obtains an ObjectId belonging to a different user.
 *   2. Sends direct API request with their own valid Bearer token.
 *   3. Backend queries database including `owner` clause.
 *   4. Zero records matched -> returns 404 NotFound.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';
import { TEST_USERS, SEEDED_TICKETS } from '../fixtures/mock-data.js';

test.describe('5. Security Testing › Authorization & IDOR Protection', () => {
  let user1Token: string;

  // Obtain User 1's authentication token
  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: TEST_USERS.bot.email,
        password: TEST_USERS.bot.password,
      },
    });
    const body = await loginRes.json();
    user1Token = body.token;
  });

  test(
    'User 1 querying foreign ticket ID (100000000000000000000005) returns 404 NotFound',
    { tag: ['@security', '@authorization', '@idor'] },
    async ({ request }) => {
      // 1. Attempt to fetch User 2's ticket using User 1's token
      const foreignId = SEEDED_TICKETS.foreignTicket5.id;
      const res = await request.get(`/api/tickets/${foreignId}`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });

      // 2. Assert HTTP 404 NotFound
      expect(res.status()).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('NotFound');
      expect(body.message).toBe('Ticket not found');
    }
  );

  test(
    'User 1 attempting to mutate foreign ticket ID via PUT returns 404 NotFound',
    { tag: ['@security', '@authorization', '@idor'] },
    async ({ request }) => {
      // 1. Attempt to update User 2's ticket status
      const foreignId = SEEDED_TICKETS.foreignTicket5.id;
      const res = await request.put(`/api/tickets/${foreignId}`, {
        headers: { Authorization: `Bearer ${user1Token}` },
        data: { status: 'Closed' },
      });

      // 2. Assert update was blocked with 404
      expect(res.status()).toBe(404);
    }
  );

  test(
    'User 1 attempting to delete foreign ticket ID returns 404 NotFound',
    { tag: ['@security', '@authorization', '@idor'] },
    async ({ request }) => {
      // 1. Attempt to delete User 2's ticket
      const foreignId = SEEDED_TICKETS.foreignTicket5.id;
      const res = await request.delete(`/api/tickets/${foreignId}`, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });

      // 2. Assert deletion was blocked with 404
      expect(res.status()).toBe(404);
    }
  );
});
