/**
 * ============================================================================
 * FOLDER: playwright/01-functional/
 * ============================================================================
 * Taxonomy Category: 1. FUNCTIONAL TESTING
 * Subcategory:       A. Positive Testing
 *
 * ============================================================================
 * MODULE: playwright/01-functional/positive.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Verifies core application happy paths using valid inputs and expected outcomes:
 *   - Successful user login with valid credentials.
 *   - Successful creation of a new ticket and rendering in the list.
 *   - Successful update of an existing ticket status from Open to Resolved.
 *   - Successful status filtering (filtering by 'Open' shows matching seeded rows).
 *   - Successful ticket deletion via confirmation modal.
 *
 * COMMUNICATES WITH:
 *   - Imports `test, expect` from `../fixtures/base.fixture.js`.
 *   - Uses `TEST_USERS` from `../fixtures/mock-data.js`.
 *   - Exercises Angular UI components: `LoginComponent`, `TicketListComponent`,
 *     `TicketFormComponent`, and `ConfirmDialogComponent`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. `autoReset` restores the database before each test.
 *   2. The test performs an action with valid inputs (e.g. typing valid title).
 *   3. Angular submits to Express REST backend (`POST /api/tickets`, etc.).
 *   4. Backend persists in MongoDB; UI reactively displays the updated state.
 *   5. Assertions verify DOM elements, testids, and status values.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';
import { TEST_USERS } from '../fixtures/mock-data.js';

test.describe('1. Functional Testing › A. Positive Testing', () => {
  // Sub-suite for authentication: requires unauthenticated browser context
  test.describe('Authentication Flow', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test(
      'Valid login authenticates user and navigates to tickets dashboard',
      { tag: ['@smoke', '@functional', '@positive'] },
      async ({ page }) => {
        // 1. Visit login page
        await page.goto('/login');

        // 2. Fill valid credentials for Playwright bot
        await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
        await page.getByTestId('login-password').fill(TEST_USERS.bot.password);
        await page.getByTestId('login-submit').click();

        // 3. Confirm route navigation and dashboard visibility
        await expect(page).toHaveURL(/.*\/tickets/);
        await expect(page.getByTestId('ticket-list')).toBeVisible();
      }
    );
  });

  // Ticket CRUD positive workflows (runs with pre-authenticated storageState)
  test(
    'Create ticket with valid inputs and verify presence in list',
    { tag: ['@smoke', '@functional', '@positive'] },
    async ({ page }) => {
      await page.goto('/tickets');
      const newTitle = 'Positive Flow Automated Ticket';
      const newDesc = 'Verified under functional positive suite';

      // 1. Open create modal
      await page.getByTestId('ticket-new').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();

      // 2. Fill required and optional fields with valid values
      await page.getByTestId('ticket-title-input').fill(newTitle);
      await page.getByTestId('ticket-description-input').fill(newDesc);
      await page.getByTestId('ticket-priority-select').selectOption('High');
      await page.getByTestId('ticket-status-select').selectOption('Open');

      // 3. Submit form
      await page.getByTestId('ticket-submit').click();

      // 4. Assert modal closes and row appears in ticket list
      await expect(page.getByTestId('ticket-form')).toBeHidden();
      const createdRow = page.getByTestId('ticket-row').filter({ hasText: newTitle });
      await expect(createdRow).toBeVisible();
      await expect(createdRow.getByTestId('ticket-status')).toHaveText('Open');
    }
  );

  test(
    'Edit seeded Open ticket to Resolved and confirm status badge update',
    { tag: ['@functional', '@positive'] },
    async ({ page }) => {
      await page.goto('/tickets');
      const targetTitle = 'Fix login button styling';
      const targetRow = page.getByTestId('ticket-row').filter({ hasText: targetTitle });
      await expect(targetRow).toBeVisible();
      await expect(targetRow.getByTestId('ticket-status')).toHaveText('Open');

      // 1. Click edit button on target row
      await targetRow.getByTestId('ticket-edit').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();

      // 2. Change status dropdown to Resolved and submit
      await page.getByTestId('ticket-status-select').selectOption('Resolved');
      await page.getByTestId('ticket-submit').click();

      // 3. Assert modal closes and badge updates to Resolved
      await expect(page.getByTestId('ticket-form')).toBeHidden();
      await expect(targetRow.getByTestId('ticket-status')).toHaveText('Resolved');
    }
  );

  test(
    'Filter by Open status displays matching seeded tickets',
    { tag: ['@functional', '@positive'] },
    async ({ page }) => {
      await page.goto('/tickets');

      // 1. Select 'Open' in status filter dropdown
      await page.getByTestId('status-filter').selectOption('Open');

      // 2. Verify exactly 2 open seeded tickets for user 1 render
      const rows = page.getByTestId('ticket-row');
      await expect(rows).toHaveCount(2);

      // 3. Verify each rendered row displays Open status
      for (let i = 0; i < 2; i++) {
        await expect(rows.nth(i).getByTestId('ticket-status')).toHaveText('Open');
      }
    }
  );

  test(
    'Delete ticket via custom confirm dialog removes row permanently',
    { tag: ['@functional', '@positive'] },
    async ({ page }) => {
      await page.goto('/tickets');
      const targetTitle = 'Setup automated backups';
      const targetRow = page.getByTestId('ticket-row').filter({ hasText: targetTitle });
      await expect(targetRow).toBeVisible();

      // 1. Click delete action on target row
      await targetRow.getByTestId('ticket-delete').click();

      // 2. Confirm custom confirm modal appears (not window.confirm)
      const confirmDialog = page.getByTestId('confirm-dialog');
      await expect(confirmDialog).toBeVisible();

      // 3. Accept deletion
      await page.getByTestId('confirm-accept').click();
      await expect(confirmDialog).toBeHidden();

      // 4. Assert row is purged from DOM
      await expect(page.getByTestId('ticket-row').filter({ hasText: targetTitle })).toHaveCount(0);
    }
  );
});
