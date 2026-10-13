/**
 * ============================================================================
 * FOLDER: playwright/04-e2e/
 * ============================================================================
 * Taxonomy Category: 4. END-TO-END TESTING
 * Subcategory:       Multi-User Journeys & Tenant Isolation
 *
 * ============================================================================
 * MODULE: playwright/04-e2e/multi-user-journey.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Validates cross-user tenant isolation in real browser contexts:
 *   1. User 1 (Playwright Bot) creates a confidential ticket in their session.
 *   2. User 2 registers as a distinct account in a completely separate browser context.
 *   3. User 2 logs into their personal workspace and sees an empty list.
 *   4. Verifies that User 1's confidential ticket is completely invisible to User 2.
 *
 * COMMUNICATES WITH:
 *   - Creates secondary isolated browser context (`browser.newContext`).
 *   - Verifies owner filtering in backend `server/src/routes/ticket.routes.ts`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User 1 submits ticket -> saved in MongoDB with `owner: User1Id`.
 *   2. User 2 registers -> new user entity in MongoDB with `owner: User2Id`.
 *   3. User 2 loads dashboard -> only tickets where `owner === User2Id` return.
 *   4. Zero data leak between tenants is verified.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('4. End-to-End Testing › Multi-User Isolation Journey', () => {
  test(
    'Two independent users maintain strict data isolation throughout sessions',
    { tag: ['@e2e', '@security', '@regression'] },
    async ({ page, browser, baseURL }) => {
      // 1. User 1 (Playwright Bot) creates a private ticket using authenticated session
      const user1Secret = `User 1 Confidential Strategy ${Date.now()}`;
      await page.goto('/tickets');
      await page.getByTestId('ticket-new').click();
      await page.getByTestId('ticket-title-input').fill(user1Secret);
      await page.getByTestId('ticket-submit').click();

      await expect(page.getByTestId('ticket-form')).toBeHidden();
      await expect(page.getByTestId('ticket-row').filter({ hasText: user1Secret })).toBeVisible();

      // 2. User 2 registers as a distinct account in an isolated browser context
      const user2Context = await browser.newContext({
        baseURL,
        storageState: { cookies: [], origins: [] },
      });
      const page2 = await user2Context.newPage();

      try {
        await page2.goto('/login');
        await page2.getByTestId('tab-register').click();

        const user2Email = `tenant2_${Date.now()}@quicktix.test`;
        await page2.getByTestId('login-email').fill(user2Email);
        await page2.getByTestId('login-password').fill('Passw0rd!test');
        await page2.getByTestId('login-submit').click();

        await expect(page2).toHaveURL(/.*\/tickets/);
        await expect(page2.getByTestId('ticket-empty')).toBeVisible();

        // 3. User 2 CANNOT see User 1's secret ticket (Tenant isolation verified)
        const user2Rows = page2.getByTestId('ticket-row').filter({ hasText: user1Secret });
        await expect(user2Rows).toHaveCount(0);
      } finally {
        // Clean up secondary context
        await user2Context.close();
      }
    }
  );
});
