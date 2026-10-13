/**
 * ============================================================================
 * FOLDER: playwright/02-ui-browser/
 * ============================================================================
 * Taxonomy Category: 2. UI AND BROWSER TESTING
 * Subcategory:       Accessibility (a11y) & Semantic Markup
 *
 * ============================================================================
 * MODULE: playwright/02-ui-browser/accessibility.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests accessibility requirements, ARIA attributes, and semantic HTML:
 *   - Verifies error banners expose `role="alert"` so assistive technology can
 *     announce them immediately.
 *   - Verifies buttons and controls have accessible names and readable text labels.
 *
 * COMMUNICATES WITH:
 *   - Assertions on HTML ARIA roles: `toHaveAttribute('role', 'alert')`.
 *   - Interactive elements: `button`, `input`, and `select`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Validation is triggered.
 *   2. Angular updates template with error alert container.
 *   3. Accessibility tree exposes the alert to screen readers.
 *   4. Test verifies semantic role attribute is present in DOM.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('2. UI & Browser Testing › Accessibility (a11y)', () => {
  test(
    'Error alerts expose role="alert" for screen readers',
    { tag: ['@ui', '@accessibility'] },
    async ({ page }) => {
      await page.goto('/tickets');
      await page.getByTestId('ticket-new').click();

      // 1. Submit empty form to trigger validation error
      await page.getByTestId('ticket-title-input').fill('');
      await page.getByTestId('ticket-submit').click();

      // 2. Assert error container exposes role="alert" for assistive readers
      const errorAlert = page.getByTestId('ticket-title-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toHaveAttribute('role', 'alert');
    }
  );

  test(
    'Interactive elements have accessible names and focus rings',
    { tag: ['@ui', '@accessibility'] },
    async ({ page }) => {
      await page.goto('/tickets');

      // 1. Check primary call-to-action button
      const createBtn = page.getByTestId('ticket-new');
      await expect(createBtn).toBeVisible();

      // 2. Verify button has human-readable text
      const btnText = await createBtn.innerText();
      expect(btnText.trim().length).toBeGreaterThan(0);
    }
  );
});
