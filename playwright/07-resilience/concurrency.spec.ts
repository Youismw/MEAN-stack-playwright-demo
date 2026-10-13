/**
 * ============================================================================
 * FOLDER: playwright/07-resilience/
 * ============================================================================
 * Taxonomy Category: 7. RELIABILITY & RESILIENCE TESTING
 * Subcategory:       Concurrency, Race Conditions & Data Consistency
 *
 * ============================================================================
 * MODULE: playwright/07-resilience/concurrency.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests server resilience under burst concurrency:
 *   - Fires multiple simultaneous `POST /api/test/reset` calls via `Promise.all()`.
 *   - Verifies the MongoDB connection, collections, and index builders handle
 *     overlapping truncate/seed operations without race conditions, deadlocks,
 *     or duplicate key (`E11000`) collisions.
 *   - Ensures all concurrent requests resolve cleanly with HTTP 200.
 *
 * WHAT IT IMPORTS:
 *   - `test, expect` from `../fixtures/base.fixture.js`: Test runner with auto-reset.
 *
 * WHERE IT IS IMPORTED / CONSUMED:
 *   - Executed by Playwright runner when matching project tags `@resilience` or
 *     `@concurrency` (or as part of full suite `npm test`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Node event loop initiates 3 async HTTP POST requests to `/api/test/reset`.
 *   2. Express server processes the 3 requests nearly simultaneously across worker event ticks.
 *   3. Mongoose drops/recreates collections and re-inserts seeded users/tickets.
 *   4. All 3 requests return HTTP 200 with `{ status: "reset_complete" }`.
 *   5. Assertion loops over all responses verifying zero crash or failure codes.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('7. Reliability & Resilience Testing › Concurrency & Race Conditions', () => {
  test(
    'Concurrent reset operations are safely serialized without duplicate key collisions',
    { tag: ['@resilience', '@concurrency'] },
    async ({ request }) => {
      // Step 1: Prepare 3 concurrent reset operations to fire simultaneously
      const parallelRequests = [
        request.post('/api/test/reset'),
        request.post('/api/test/reset'),
        request.post('/api/test/reset'),
      ];

      // Step 2: Await completion of all simultaneous requests
      const responses = await Promise.all(parallelRequests);

      // Step 3: Validate that every request succeeded with HTTP 200 and valid JSON
      for (const res of responses) {
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('reset_complete');
      }
    }
  );
});

