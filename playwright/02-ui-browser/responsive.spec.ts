/**
 * ============================================================================
 * FOLDER: playwright/02-ui-browser/
 * ============================================================================
 * Taxonomy Category: 2. UI AND BROWSER TESTING
 * Subcategory:       Responsive Layouts
 *
 * ============================================================================
 * MODULE: playwright/02-ui-browser/responsive.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests responsive layouts across different device dimensions:
 *   - Desktop Viewport (1280x800): verifies complete layout, cards, and absence of
 *     horizontal scrollbar overflows.
 *   - Mobile Viewport (375x667 - iPhone SE size): verifies touch targets, action
 *     buttons, and modal usability on small screens.
 *
 * COMMUNICATES WITH:
 *   - Uses Playwright `page.setViewportSize({ width, height })`.
 *   - CSS layout rules in `client/src/styles.css` & component CSS files.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Playwright resizes browser viewport.
 *   2. CSS media queries and flexbox/grid layouts respond dynamically.
 *   3. Tests assert that key interactive testids remain accessible and clickable.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('2. UI & Browser Testing › Responsive Layouts', () => {
  test(
    'Dashboard renders cleanly on standard desktop viewport (1280x800)',
    { tag: ['@ui', '@responsive'] },
    async ({ page }) => {
      // 1. Set viewport to standard 1280x800 desktop
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/tickets');

      await expect(page.getByTestId('ticket-list')).toBeVisible();
      await expect(page.getByTestId('ticket-new')).toBeVisible();
      await expect(page.getByTestId('status-filter')).toBeVisible();

      // 2. Ensure no unintended horizontal scrollbar overflow
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 5);
    }
  );

  test(
    'Dashboard elements remain visible and functional on mobile viewport (375x667)',
    { tag: ['@ui', '@responsive'] },
    async ({ page }) => {
      // 1. Set viewport to compact 375x667 mobile screen
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/tickets');

      // 2. Assert critical action elements remain visible
      await expect(page.getByTestId('ticket-list')).toBeVisible();
      await expect(page.getByTestId('ticket-new')).toBeVisible();

      // 3. Confirm create modal opens cleanly on mobile
      await page.getByTestId('ticket-new').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();
    }
  );
});
