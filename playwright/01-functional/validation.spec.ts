/**
 * ============================================================================
 * FOLDER: playwright/01-functional/
 * ============================================================================
 * Taxonomy Category: 1. FUNCTIONAL TESTING
 * Subcategory:       C. Input and Field Validation & Boundary-Value Testing
 *
 * ============================================================================
 * MODULE: playwright/01-functional/validation.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests field rules, length limits, and boundary conditions per CONTRACT.md:
 *   - Title empty: triggers inline error alert and prevents submission.
 *   - Title boundary lower bound (< 3 characters, e.g. 2 chars): rejected.
 *   - Title boundary exact threshold (= 3 characters, e.g. 'Wip'): accepted.
 *   - Description textarea limit: verifies `maxlength="500"` attribute.
 *   - Dropdown enum constraints: verifies valid options for Priority and Status.
 *
 * COMMUNICATES WITH:
 *   - Angular component `TicketFormComponent`.
 *   - Backend validation in `server/src/routes/ticket.routes.ts`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User opens "+ Create Ticket" modal.
 *   2. Types invalid or boundary inputs.
 *   3. Client-side validators or backend responses validate against schema.
 *   4. Inline alert with `role="alert"` appears if invalid; form submits if valid.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('1. Functional Testing › C. Input & Field Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ticket dashboard before each validation test
    await page.goto('/tickets');
    await expect(page.getByTestId('ticket-list')).toBeVisible();
  });

  test(
    'Empty title shows inline ticket-title-error with role alert',
    { tag: ['@functional', '@validation', '@negative'] },
    async ({ page }) => {
      // 1. Open creation modal
      await page.getByTestId('ticket-new').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();

      // 2. Submit with empty title
      await page.getByTestId('ticket-title-input').fill('');
      await page.getByTestId('ticket-submit').click();

      // 3. Assert inline validation alert appears
      const errorAlert = page.getByTestId('ticket-title-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toHaveAttribute('role', 'alert');
      await expect(errorAlert).toContainText(/Title must be between 3 and 100 characters/i);

      // 4. Assert modal was not closed
      await expect(page.getByTestId('ticket-form')).toBeVisible();
    }
  );

  test(
    'Title with 2 characters violates boundary lower limit (< 3 chars)',
    { tag: ['@functional', '@validation', '@boundary'] },
    async ({ page }) => {
      await page.getByTestId('ticket-new').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();

      // 1. Enter 2 characters (boundary failure)
      await page.getByTestId('ticket-title-input').fill('ab');
      await page.getByTestId('ticket-submit').click();

      // 2. Assert error message triggers
      const errorAlert = page.getByTestId('ticket-title-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/Title must be between 3 and 100 characters/i);
    }
  );

  test(
    'Title with exactly 3 characters satisfies boundary minimum',
    { tag: ['@functional', '@validation', '@boundary', '@positive'] },
    async ({ page }) => {
      // 1. Enter exactly 3 characters (boundary pass)
      const boundaryTitle = 'Wip';
      await page.getByTestId('ticket-new').click();
      await page.getByTestId('ticket-title-input').fill(boundaryTitle);
      await page.getByTestId('ticket-submit').click();

      // 2. Form closes and newly created ticket is visible
      await expect(page.getByTestId('ticket-form')).toBeHidden();
      await expect(page.getByTestId('ticket-row').filter({ hasText: boundaryTitle })).toBeVisible();
    }
  );

  test(
    'Description textarea enforces 500 character limit attribute',
    { tag: ['@functional', '@validation', '@boundary'] },
    async ({ page }) => {
      await page.getByTestId('ticket-new').click();
      const descInput = page.getByTestId('ticket-description-input');
      await expect(descInput).toBeVisible();

      // Assert DOM maxlength attribute matches CONTRACT specification (500)
      const maxLength = await descInput.getAttribute('maxlength');
      expect(Number(maxLength)).toBe(500);
    }
  );

  test(
    'Priority and Status dropdowns contain designated contract options',
    { tag: ['@functional', '@validation'] },
    async ({ page }) => {
      await page.getByTestId('ticket-new').click();

      // Verify Priority enum options
      const prioritySelect = page.getByTestId('ticket-priority-select');
      const priorityOptions = await prioritySelect.locator('option').allInnerTexts();
      expect(priorityOptions.map((o) => o.trim())).toEqual(
        expect.arrayContaining(['Low', 'Medium', 'High', 'Urgent'])
      );

      // Verify Status enum options
      const statusSelect = page.getByTestId('ticket-status-select');
      const statusOptions = await statusSelect.locator('option').allInnerTexts();
      expect(statusOptions.map((o) => o.trim())).toEqual(
        expect.arrayContaining(['Open', 'In Progress', 'Resolved', 'Closed'])
      );
    }
  );
});
