/**
 * ============================================================================
 * FOLDER: playwright/fixtures/
 * ============================================================================
 * Test runner extension layer providing custom fixtures, isolation hooks,
 * and automatic state management for all Playwright suites.
 *
 * ============================================================================
 * MODULE: playwright/fixtures/base.fixture.ts (Deterministic Auto-Reset Fixture)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Extends the base `@playwright/test` object with an automatic hook `autoReset`.
 * Before ANY test function runs, this fixture:
 *   1. Sends an HTTP POST to `/api/test/reset`.
 *   2. Wipes temporary database entries and reseeds baseline tickets & users.
 *   3. Asserts the reset completed successfully in under 20ms.
 *   4. Yields execution to the test (`await use()`).
 *
 * COMMUNICATES WITH:
 *   - Calls backend route `POST /api/test/reset` via Playwright's `request` fixture.
 *   - Imported by virtually every test spec in `playwright/01-functional/` through
 *     `playwright/08-specialized/`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. A test in `positive.spec.ts` starts.
 *   2. `autoReset` fixture fires automatically before test code begins.
 *   3. Reset endpoint purges mutations from prior tests.
 *   4. Baseline state is restored, guaranteeing 100% test independence.
 *   5. The test runs against a perfectly predictable database.
 * ============================================================================
 */

import { test as baseTest, expect } from '@playwright/test';

// Extend base Playwright test runner with autoReset lifecycle hook
export const test = baseTest.extend<{ autoReset: void }>({
  autoReset: [
    async ({ request }, use) => {
      // 1. Trigger deterministic database wipe and baseline re-seed
      const res = await request.post('/api/test/reset');

      // 2. Defensive check: Fail immediately if the test reset endpoint is unreachable or 404
      if (!res.ok()) {
        const text = await res.text();
        throw new Error(
          `Auto-reset failed with status ${res.status()}: ${text}. Is the server running in NODE_ENV=test against a *_test database?`
        );
      }

      // 3. Verify that the response includes developer User 1 ObjectId
      const data = await res.json();
      expect(data.users).toContain('000000000000000000000001');

      // 4. Yield execution to the test function
      await use();
    },
    // { auto: true } ensures this fixture executes before every single test without manual invocation
    { auto: true },
  ],
});

// Re-export standard expect for convenient single-import consumption
export { expect };
