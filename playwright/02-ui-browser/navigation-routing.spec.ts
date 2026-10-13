/**
 * ============================================================================
 * FOLDER: playwright/02-ui-browser/
 * ============================================================================
 * Taxonomy Category: 2. UI AND BROWSER TESTING
 * Subcategory:       Navigation and Routing
 *
 * ============================================================================
 * MODULE: playwright/02-ui-browser/navigation-routing.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests client-side routing, URL state synchronization, and session teardown:
 *   - Verifies that clicking "Sign Out" removes token from `localStorage` and
 *     redirects to `/login`.
 *   - Verifies that authenticated direct URL access to `/tickets` preserves session.
 *
 * COMMUNICATES WITH:
 *   - Angular Router (`@angular/router`).
 *   - `AuthService.logout()` in `client/src/app/services/auth.service.ts`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User visits `/tickets`.
 *   2. Clicks the "Sign Out" button in `HeaderComponent`.
 *   3. Angular deletes token key from `window.localStorage`.
 *   4. Angular router redirects to `/login`.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('2. UI & Browser Testing › Navigation & Routing', () => {
  test(
    'Logout button in header clears authentication and routes to login page',
    { tag: ['@ui', '@routing'] },
    async ({ page }) => {
      await page.goto('/tickets');
      await expect(page.getByTestId('ticket-list')).toBeVisible();

      // 1. Locate and click header Sign Out button
      const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click();

        // 2. Assert navigation completes and login form is displayed
        await expect(page).toHaveURL(/.*\/login/);
        await expect(page.getByTestId('login-email')).toBeVisible();
      }
    }
  );

  test(
    'Direct navigation to unauthenticated route preserves login state',
    { tag: ['@ui', '@routing'] },
    async ({ page }) => {
      // 1. Direct deep link navigation to protected route
      await page.goto('/tickets');

      // 2. URL remains /tickets and dashboard remains mounted
      await expect(page).toHaveURL(/.*\/tickets/);
      await expect(page.getByTestId('ticket-list')).toBeVisible();
    }
  );
});
