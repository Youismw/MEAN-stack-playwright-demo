/**
 * ============================================================================
 * FOLDER: playwright/04-e2e/
 * ============================================================================
 * Taxonomy Category: 4. END-TO-END TESTING
 * Subcategory:       Complete User Journeys & Multi-Step Workflows
 *
 * ============================================================================
 * MODULE: playwright/04-e2e/ticket-lifecycle.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests the complete end-to-end lifecycle of a ticket across multiple steps:
 *   1. Create: Opens modal, submits a new ticket.
 *   2. Verify: Asserts the new ticket renders with Open badge.
 *   3. Edit: Modifies the ticket title and status to In Progress.
 *   4. Filter: Filters by In Progress status to confirm persistence.
 *   5. Delete: Deletes the ticket via custom confirmation modal.
 *   6. Confirm Absence: Asserts the ticket is permanently removed.
 *
 * COMMUNICATES WITH:
 *   - Runs in real Chromium browser using `.auth/user.json` storageState.
 *   - Interacts with full MEAN stack (Angular UI -> Express 5 -> MongoDB).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User accesses `/tickets`.
 *   2. Completes multi-step CRUD lifecycle.
 *   3. State transitions seamlessly across UI actions.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('4. End-to-End Testing › Ticket Lifecycle Journey', () => {
  test(
    'Complete lifecycle: Create, verify, filter, edit status, and delete ticket',
    { tag: ['@e2e', '@smoke', '@regression'] },
    async ({ page }) => {
      const initialTitle = 'Full E2E Lifecycle Workflow';
      const updatedTitle = 'Full E2E Lifecycle Workflow - In Review';

      // 1. Navigate to tickets dashboard
      await page.goto('/tickets');
      await expect(page.getByTestId('ticket-list')).toBeVisible();

      // 2. Step 1 - Create ticket
      await page.getByTestId('ticket-new').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();
      await page.getByTestId('ticket-title-input').fill(initialTitle);
      await page.getByTestId('ticket-description-input').fill('Step-by-step verification of ticket state progression');
      await page.getByTestId('ticket-priority-select').selectOption('High');
      await page.getByTestId('ticket-status-select').selectOption('Open');
      await page.getByTestId('ticket-submit').click();

      // 3. Step 2 - Verify newly created ticket in list
      await expect(page.getByTestId('ticket-form')).toBeHidden();
      const ticketRow = page.getByTestId('ticket-row').filter({ hasText: initialTitle });
      await expect(ticketRow).toBeVisible();
      await expect(ticketRow.getByTestId('ticket-status')).toHaveText('Open');

      // 4. Step 3 - Edit ticket title and advance status
      await ticketRow.getByTestId('ticket-edit').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();
      await page.getByTestId('ticket-title-input').fill(updatedTitle);
      await page.getByTestId('ticket-status-select').selectOption('In Progress');
      await page.getByTestId('ticket-submit').click();

      await expect(page.getByTestId('ticket-form')).toBeHidden();
      const updatedRow = page.getByTestId('ticket-row').filter({ hasText: updatedTitle });
      await expect(updatedRow).toBeVisible();
      await expect(updatedRow.getByTestId('ticket-status')).toHaveText('In Progress');

      // 5. Step 4 - Filter by In Progress to confirm persistence
      await page.getByTestId('status-filter').selectOption('In Progress');
      await expect(page.getByTestId('ticket-row').filter({ hasText: updatedTitle })).toBeVisible();

      // 6. Step 5 - Delete ticket via confirmation modal
      await page.getByTestId('status-filter').selectOption('All');
      await updatedRow.getByTestId('ticket-delete').click();
      const confirmDialog = page.getByTestId('confirm-dialog');
      await expect(confirmDialog).toBeVisible();
      await page.getByTestId('confirm-accept').click();
      await expect(confirmDialog).toBeHidden();

      // 7. Step 6 - Verify permanent removal from DOM
      await expect(page.getByTestId('ticket-row').filter({ hasText: updatedTitle })).toHaveCount(0);
    }
  );
});
