/**
 * ============================================================================
 * FOLDER: playwright/01-functional/
 * ============================================================================
 * Taxonomy Category: 1. FUNCTIONAL TESTING
 * Subcategory:       E. Business Logic & Domain Rules
 *
 * ============================================================================
 * MODULE: playwright/01-functional/business-logic.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Verifies core business rules, domain invariants, and defaults:
 *   - Owner Scoping Rule: User 1 sees exactly their own tickets; foreign tickets
 *     belonging to User 2 must never appear.
 *   - Default Values: Newly opened form initializes with Priority='Medium' and Status='Open'.
 *   - Tab Status Transitions: Switching status tabs triggers proper reactive re-filtering.
 *
 * COMMUNICATES WITH:
 *   - MongoDB Ticket owner field (`owner: ObjectId`).
 *   - Angular `TicketListComponent` filter tabs.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User 1 opens dashboard.
 *   2. Angular requests `GET /api/tickets` with User 1's Bearer token.
 *   3. Express queries `{ owner: req.user.id }`.
 *   4. Seeded Ticket 5 (owned by User 2) is filtered out at the database layer.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';
import { SEEDED_TICKETS } from '../fixtures/mock-data.js';

test.describe('1. Functional Testing › E. Business Logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
    await expect(page.getByTestId('ticket-list')).toBeVisible();
  });

  test(
    'Owner scoping ensures foreign tickets are never visible in UI',
    { tag: ['@functional', '@business-logic'] },
    async ({ page }) => {
      // Seeded Ticket 5 belongs to User 2: "Foreign user secret issue"
      const foreignTitle = SEEDED_TICKETS.foreignTicket5.title;
      const foreignRow = page.getByTestId('ticket-row').filter({ hasText: foreignTitle });
      await expect(foreignRow).toHaveCount(0);

      // Verify User 1 sees all 4 of their own seeded tickets
      const rows = page.getByTestId('ticket-row');
      await expect(rows).toHaveCount(4);
    }
  );

  test(
    'New ticket form initializes with default priority Medium and status Open',
    { tag: ['@functional', '@business-logic'] },
    async ({ page }) => {
      await page.getByTestId('ticket-new').click();
      await expect(page.getByTestId('ticket-form')).toBeVisible();

      // Verify business logic defaults
      const priorityVal = await page.getByTestId('ticket-priority-select').inputValue();
      const statusVal = await page.getByTestId('ticket-status-select').inputValue();

      expect(priorityVal).toBe('Medium');
      expect(statusVal).toBe('Open');
    }
  );

  test(
    'Filter tab switching updates active tab and re-queries ticket list',
    { tag: ['@functional', '@business-logic'] },
    async ({ page }) => {
      // 1. Filter to In Progress
      await page.getByTestId('status-filter').selectOption('In Progress');
      const inProgressRows = page.getByTestId('ticket-row');
      await expect(inProgressRows).toHaveCount(1);
      await expect(inProgressRows.first().getByTestId('ticket-status')).toHaveText('In Progress');

      // 2. Filter to Resolved
      await page.getByTestId('status-filter').selectOption('Resolved');
      const resolvedRows = page.getByTestId('ticket-row');
      await expect(resolvedRows).toHaveCount(1);
      await expect(resolvedRows.first().getByTestId('ticket-status')).toHaveText('Resolved');
    }
  );
});
