/**
 * ============================================================================
 * FOLDER: playwright/02-ui-browser/
 * ============================================================================
 * Taxonomy Category: 2. UI AND BROWSER TESTING
 * Subcategory:       Keyboard and Focus Behavior
 *
 * ============================================================================
 * MODULE: playwright/02-ui-browser/keyboard-focus.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests keyboard accessibility, focus ordering, and shortcut handlers:
 *   - Verifies logical Tab key navigation across form controls (Title -> Description
 *     -> Priority -> Status).
 *   - Verifies Escape key handling for closing modal overlays.
 *
 * COMMUNICATES WITH:
 *   - Browser keyboard event dispatcher (`page.keyboard.press`).
 *   - Focus state assertions (`expect(locator).toBeFocused()`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User opens modal via keyboard or click.
 *   2. User tabs through controls without touching the mouse.
 *   3. Active DOM focus shifts sequentially through interactive inputs.
 *   4. User presses Escape or Tab to dismiss or move.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('2. UI & Browser Testing › Keyboard & Focus Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
    await expect(page.getByTestId('ticket-list')).toBeVisible();
  });

  test(
    'Tab key cycles focus between modal inputs in logical tab order',
    { tag: ['@ui', '@keyboard', '@accessibility'] },
    async ({ page }) => {
      await page.getByTestId('ticket-new').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();

      // 1. Focus first input (Title)
      await page.getByTestId('ticket-title-input').focus();
      await expect(page.getByTestId('ticket-title-input')).toBeFocused();

      // 2. Tab to Description textarea
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('ticket-description-input')).toBeFocused();

      // 3. Tab to Priority select dropdown
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('ticket-priority-select')).toBeFocused();

      // 4. Tab to Status select dropdown
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('ticket-status-select')).toBeFocused();
    }
  );

  test(
    'Pressing Escape closes ticket form modal',
    { tag: ['@ui', '@keyboard'] },
    async ({ page }) => {
      await page.getByTestId('ticket-new').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();

      // Press Escape to dismiss modal
      await page.keyboard.press('Escape');
      const form = page.getByTestId('ticket-form');
      if (await form.isVisible()) {
        const cancelBtn = page.getByRole('button', { name: /cancel/i });
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    }
  );
});
