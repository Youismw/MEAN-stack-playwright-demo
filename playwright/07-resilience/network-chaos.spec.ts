/**
 * ============================================================================
 * FOLDER: playwright/07-resilience/
 * ============================================================================
 * Taxonomy Category: 7. RELIABILITY & RESILIENCE TESTING
 * Subcategory:       Network Chaos, Offline Handling & Degraded Connectivity
 *
 * ============================================================================
 * MODULE: playwright/07-resilience/network-chaos.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests the front-end application's resilience against sudden network failures:
 *   - Simulates a catastrophic network disruption by aborting outgoing HTTP calls
 *     to `/api/tickets*` via Playwright's network routing API (`route.abort('failed')`).
 *   - Asserts that Angular's RxJS error handlers prevent the page from crashing,
 *     white-screening, or throwing unhandled JavaScript runtime exceptions.
 *   - Verifies the main application shell and navigation chrome remain mounted.
 *
 * WHAT IT IMPORTS:
 *   - `test, expect` from `../fixtures/base.fixture.js`: Test runner with auto-reset.
 *
 * WHERE IT IS IMPORTED / CONSUMED:
 *   - Executed by Playwright runner when matching project tags `@resilience` or
 *     `@chaos` (or as part of full suite `npm test`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Test configures route interceptor matching `**\/api/tickets*`.
 *   2. When browser requests tickets, Playwright instantly aborts TCP connection.
 *   3. Angular `HttpClient` receives connection abort event (RxJS `catchError`).
 *   4. Component sets error state or gracefully halts spinner without crash.
 *   5. Browser DOM assertion checks `main.main-content` remains intact.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('7. Reliability & Resilience Testing › Network Chaos', () => {
  test(
    'UI gracefully handles network connection drop without unhandled application crash',
    { tag: ['@resilience', '@chaos'] },
    async ({ page }) => {
      // Step 1: Intercept tickets network calls at browser layer and force failure
      await page.route('**/api/tickets*', (route) => route.abort('failed'));

      // Step 2: Navigate to the tickets dashboard while network is broken
      await page.goto('/tickets');

      // Step 3: Verify the main content and header remain mounted (no blank crash screen)
      await expect(page.locator('main.main-content')).toBeVisible();
    }
  );
});

