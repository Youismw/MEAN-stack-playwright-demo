/**
 * ============================================================================
 * FOLDER: playwright/06-performance/
 * ============================================================================
 * Taxonomy Category: 6. PERFORMANCE TESTING
 * Subcategory:       API Response Time & Backend Service-Level Agreements (SLAs)
 *
 * ============================================================================
 * MODULE: playwright/06-performance/api-latency.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests the latency and processing speed of backend Express/Mongoose routes:
 *   - Verifies the test fixture reset endpoint (`POST /api/test/reset`) responds
 *     in under 250ms even while truncating and re-seeding MongoDB collections.
 *   - Verifies authenticated resource queries (`GET /api/tickets`) execute and
 *     return query results well within the 250ms SLA budget.
 *
 * WHAT IT IMPORTS:
 *   - `test, expect` from `../fixtures/base.fixture.js`: Test runner with auto-reset.
 *   - `TEST_USERS` from `../fixtures/mock-data.js`: Known seeded credentials.
 *
 * WHERE IT IS IMPORTED / CONSUMED:
 *   - Executed by Playwright runner when matching project tags `@performance` or
 *     `@api` (or as part of full suite `npm test`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Playwright APIRequestContext issues HTTP requests directly to backend.
 *   2. Start timestamp recorded using high-resolution millisecond timer (`Date.now()`).
 *   3. Express route executes database operation (truncate, seed, query).
 *   4. Response completes and elapsed round-trip duration is calculated.
 *   5. Assertion guarantees duration < 250ms SLA.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';
import { TEST_USERS } from '../fixtures/mock-data.js';

test.describe('6. Performance Testing › API Response Time SLAs', () => {
  test(
    '/api/test/reset deterministic reset completes within SLA threshold (< 250ms)',
    { tag: ['@performance', '@api'] },
    async ({ request }) => {
      // Step 1: Record start timestamp before issuing reset request
      const start = Date.now();

      // Step 2: Invoke test-support reset route
      const res = await request.post('/api/test/reset');

      // Step 3: Compute total elapsed round-trip duration
      const duration = Date.now() - start;

      // Step 4: Verify status code and performance SLA (< 250ms)
      expect(res.status()).toBe(200);
      expect(duration).toBeLessThan(250);
    }
  );

  test(
    'GET /api/tickets response time completes within SLA threshold (< 250ms)',
    { tag: ['@performance', '@api'] },
    async ({ request }) => {
      // Step 1: Authenticate to obtain a valid JWT token
      const loginRes = await request.post('/api/auth/login', {
        data: {
          email: TEST_USERS.bot.email,
          password: TEST_USERS.bot.password,
        },
      });
      const { token } = await loginRes.json();

      // Step 2: Record start timestamp before issuing authenticated tickets query
      const start = Date.now();

      // Step 3: Fetch tickets list with Bearer authorization header
      const res = await request.get('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Step 4: Compute total elapsed round-trip duration
      const duration = Date.now() - start;

      // Step 5: Verify status code and performance SLA (< 250ms)
      expect(res.status()).toBe(200);
      expect(duration).toBeLessThan(250);
    }
  );
});

