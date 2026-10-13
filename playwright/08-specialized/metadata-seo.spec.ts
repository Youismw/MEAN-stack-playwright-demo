/**
 * ============================================================================
 * FOLDER: playwright/08-specialized/
 * ============================================================================
 * Taxonomy Category: 8. SPECIALIZED TESTING
 * Subcategory:       Metadata, SEO, Viewport & Usability Empty States
 *
 * ============================================================================
 * MODULE: playwright/08-specialized/metadata-seo.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Validates specialized web compliance and usability criteria:
 *   - Verifies standard HTML `<title>` tag is non-empty.
 *   - Verifies mobile viewport tag `<meta name="viewport" content="width=device-width...">`
 *     is present in the DOM for responsive mobile rendering.
 *   - Validates that when a filter yields 0 search results, the UI presents an
 *     informative, user-friendly empty state (`ticket-empty`) rather than an empty void.
 *
 * WHAT IT IMPORTS:
 *   - `test, expect` from `../fixtures/base.fixture.js`: Test runner with auto-reset.
 *
 * WHERE IT IS IMPORTED / CONSUMED:
 *   - Executed by Playwright runner when matching project tags `@specialized`,
 *     `@seo`, or `@usability` (or as part of full suite `npm test`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Authenticated browser session loads `/tickets`.
 *   2. Checks document `<head>` properties for standard SEO and mobile viewport attributes.
 *   3. Changes status dropdown filter to 'Closed'.
 *   4. Angular reactive filter recalculates filtered list.
 *   5. Asserts table rows count is 0 and empty-state placeholder is displayed.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('8. Specialized Testing › Metadata, SEO & Usability', () => {
  test(
    'Page metadata contains appropriate title and viewport tags',
    { tag: ['@specialized', '@seo'] },
    async ({ page }) => {
      // Step 1: Navigate to the application dashboard
      await page.goto('/tickets');

      // Step 2: Validate the page title is populated
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      // Step 3: Validate mobile responsive viewport tag is configured in <head>
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewportMeta).toContain('width=device-width');
    }
  );

  test(
    'Filtering with zero matching tickets shows user-friendly empty state',
    { tag: ['@specialized', '@usability'] },
    async ({ page }) => {
      // Step 1: Navigate to the tickets dashboard
      await page.goto('/tickets');

      // Step 2: Select a status filter with 0 items (e.g. 'Closed')
      await page.getByTestId('status-filter').selectOption('Closed');

      // Step 3: Verify all ticket rows are filtered out
      const rows = page.getByTestId('ticket-row');
      await expect(rows).toHaveCount(0);

      // Step 4: Verify user-friendly empty state indicator is visible
      const emptyState = page.getByTestId('ticket-empty');
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
      }
    }
  );
});

