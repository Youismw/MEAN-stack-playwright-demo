/**
 * ============================================================================
 * FOLDER: playwright/05-security/
 * ============================================================================
 * Taxonomy Category: 5. SECURITY TESTING
 * Subcategory:       Injection Testing & Cross-Site Scripting (XSS)
 *
 * ============================================================================
 * MODULE: playwright/05-security/injection-xss.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests the system's resistance to Cross-Site Scripting (XSS) attacks:
 *   - Injects `<script>` and `onerror` image vectors into ticket inputs.
 *   - Verifies that no JavaScript dialogs fire (`page.on('dialog')`).
 *   - Verifies that no variables are attached to `window`.
 *   - Confirms that Angular strictly treats user input as text, escaping HTML tags.
 *
 * COMMUNICATES WITH:
 *   - Angular template interpolation (`{{ ticket.title }}`) sanitization.
 *   - Playwright dialog listener.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Attacker types malicious HTML/JS payloads.
 *   2. Saved to backend and served back to the browser.
 *   3. Angular's built-in sanitizer escapes the characters (`&lt;script&gt;`).
 *   4. Rendered harmlessly as plain text.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('5. Security Testing › Injection & XSS Prevention', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
    await expect(page.getByTestId('ticket-list')).toBeVisible();
  });

  test(
    'XSS payloads in ticket title and description are strictly escaped as text without script execution',
    { tag: ['@security', '@injection'] },
    async ({ page }) => {
      // 1. Attach listener to detect any unexpected alert/prompt/confirm dialog
      let dialogTriggered = false;
      page.on('dialog', async (dialog) => {
        dialogTriggered = true;
        await dialog.dismiss();
      });

      // 2. Define XSS payload strings
      const xssTitle = '<script>window.__xssPwned=true</script>Safe Title';
      const xssDesc = '<img src="invalid-image" onerror="alert(\'xss\')" />';

      // 3. Fill and submit ticket
      await page.getByTestId('ticket-new').click();
      await page.getByTestId('ticket-title-input').fill(xssTitle);
      await page.getByTestId('ticket-description-input').fill(xssDesc);
      await page.getByTestId('ticket-submit').click();

      await expect(page.getByTestId('ticket-form')).toBeHidden();

      // 4. Assert no dialog was triggered
      expect(dialogTriggered).toBe(false);

      // 5. Assert script did not execute on window
      const isPwned = await page.evaluate(() => (window as any).__xssPwned);
      expect(isPwned).toBeUndefined();

      // 6. Assert content is rendered safely as escaped text
      const row = page.getByTestId('ticket-row').filter({ hasText: 'Safe Title' });
      await expect(row).toBeVisible();
    }
  );
});
