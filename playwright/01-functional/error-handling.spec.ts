/**
 * ============================================================================
 * FOLDER: playwright/01-functional/
 * ============================================================================
 * Taxonomy Category: 1. FUNCTIONAL TESTING
 * Subcategory:       D. Error Handling
 *
 * ============================================================================
 * MODULE: playwright/01-functional/error-handling.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Validates error state transitions, recovery, and cancellation semantics:
 *   - Verifies that inline validation errors dismiss automatically once valid input is entered.
 *   - Verifies that dismissing the deletion confirm modal safely preserves the ticket in DOM.
 *
 * COMMUNICATES WITH:
 *   - Angular modal components: `TicketFormComponent` & `ConfirmDialogComponent`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User triggers an error state (e.g. typing single char).
 *   2. User corrects the mistake with valid data.
 *   3. Angular updates reactive signal state, clearing the error banner.
 *   4. Operations succeed without requiring page refreshes.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('1. Functional Testing › D. Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
    await expect(page.getByTestId('ticket-list')).toBeVisible();
  });

  test(
    'Inline validation error dismisses once user provides valid input',
    { tag: ['@functional', '@error-handling'] },
    async ({ page }) => {
      // 1. Trigger validation failure with too-short title
      await page.getByTestId('ticket-new').click();
      await page.getByTestId('ticket-title-input').fill('a');
      await page.getByTestId('ticket-submit').click();

      const errorAlert = page.getByTestId('ticket-title-error');
      await expect(errorAlert).toBeVisible();

      // 2. Recover by supplying valid input and re-submitting
      await page.getByTestId('ticket-title-input').fill('Valid Ticket Title');
      await page.getByTestId('ticket-submit').click();

      // 3. Form dismisses cleanly and new ticket appears
      await expect(page.getByTestId('ticket-form')).toBeHidden();
      await expect(page.getByTestId('ticket-row').filter({ hasText: 'Valid Ticket Title' })).toBeVisible();
    }
  );

  test(
    'Dismissing delete confirmation modal retains ticket without deletion',
    { tag: ['@functional', '@error-handling'] },
    async ({ page }) => {
      const targetTitle = 'Fix login button styling';
      const targetRow = page.getByTestId('ticket-row').filter({ hasText: targetTitle });
      await expect(targetRow).toBeVisible();

      // 1. Open delete modal
      await targetRow.getByTestId('ticket-delete').click();
      const confirmDialog = page.getByTestId('confirm-dialog');
      await expect(confirmDialog).toBeVisible();

      // 2. Click cancel
      await page.getByTestId('confirm-cancel').click();
      await expect(confirmDialog).toBeHidden();

      // 3. Assert ticket row was preserved
      await expect(targetRow).toBeVisible();
    }
  );
});
