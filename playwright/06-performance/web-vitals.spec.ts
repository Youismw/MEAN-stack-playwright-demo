/**
 * ============================================================================
 * FOLDER: playwright/06-performance/
 * ============================================================================
 * Taxonomy Category: 6. PERFORMANCE TESTING
 * Subcategory:       Page-Load Performance, Navigation Timing & Core Web Vitals
 *
 * ============================================================================
 * MODULE: playwright/06-performance/web-vitals.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Measures client-side web performance against defined Service Level Agreements (SLAs):
 *   - Leverages the browser W3C Navigation Timing API (`window.performance`).
 *   - Calculates Time to First Byte (TTFB = `responseStart - requestStart`).
 *   - Calculates DOM Ready time (`domContentLoadedEventEnd - startTime`).
 *   - Verifies dashboard pages load smoothly under strict performance budgets.
 *
 * WHAT IT IMPORTS:
 *   - `test, expect` from `../fixtures/base.fixture.js`: Test runner with auto-reset
 *     and authenticated storage state.
 *
 * WHERE IT IS IMPORTED / CONSUMED:
 *   - Executed by Playwright runner when matching project tags `@performance` or
 *     `@web-vitals` (or as part of full suite `npm test`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Authenticated browser navigates to `/tickets`.
 *   2. Single Page Application (SPA) bundle downloads, compiles, and bootstraps.
 *   3. Angular router renders TicketListComponent and resolves initial API data.
 *   4. `page.evaluate()` queries browser's native `PerformanceNavigationTiming` entry.
 *   5. Metric thresholds (e.g. TTFB < 1000ms, DOM ready < 3000ms) are validated.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('6. Performance Testing › Page-Load & Web Vitals', () => {
  test(
    'Dashboard page load meets SLA metrics for TTFB and DOM ready',
    { tag: ['@performance', '@web-vitals'] },
    async ({ page }) => {
      // Step 1: Navigate to the tickets dashboard (authenticated via base fixture state)
      const response = await page.goto('/tickets');
      expect(response?.status()).toBe(200);

      // Step 2: Ensure critical DOM element has rendered before measuring completion
      await expect(page.getByTestId('ticket-list')).toBeVisible();

      // Step 3: Extract browser Navigation Timing metrics inside browser context
      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          responseStart: nav.responseStart,
          requestStart: nav.requestStart,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          totalDuration: nav.duration,
        };
      });

      // Step 4: Compute Time to First Byte (network roundtrip to initial server byte)
      const ttfb = timing.responseStart - timing.requestStart;

      // Step 5: Assert TTFB SLA (< 1000ms threshold for local/edge environment)
      expect(ttfb).toBeLessThan(1000);

      // Step 6: Assert DOM Content Loaded SLA (< 3000ms total client bootstrap budget)
      expect(timing.domContentLoaded).toBeLessThan(3000);
    }
  );
});

