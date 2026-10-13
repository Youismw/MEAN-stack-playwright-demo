/**
 * ============================================================================
 * FOLDER: playwright/01-functional/
 * ============================================================================
 * Taxonomy Category: 1. FUNCTIONAL TESTING
 * Subcategory:       B. Negative Testing
 *
 * ============================================================================
 * MODULE: playwright/01-functional/negative.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests the system's ability to reject invalid inputs, unauthorized actions,
 * and malicious/unexpected user attempts:
 *   - Bad password submission displays `[data-testid="login-error"]` with `role="alert"`.
 *   - Non-existent user email displays authentication failure.
 *   - Unauthenticated direct URL navigation to `/tickets` is blocked by Angular's
 *     auth guard and redirects to `/login`.
 *
 * COMMUNICATES WITH:
 *   - Angular router auth guard (`AuthGuard`).
 *   - Backend route `POST /api/auth/login`.
 *   - Enforces empty `storageState` to simulate a logged-out visitor.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Test opens clean unauthenticated browser page.
 *   2. Submits wrong password.
 *   3. Backend returns 401 Unauthorized `{ error: "Unauthorized" }`.
 *   4. Angular sets `errorMessage` signal; template displays error alert banner.
 *   5. Asserts error visibility and accessible ARIA attributes.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';
import { TEST_USERS } from '../fixtures/mock-data.js';

test.describe('1. Functional Testing › B. Negative Testing', () => {
  // Enforce logged-out context for all tests in this file
  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    'Bad credentials show login-error alert',
    { tag: ['@functional', '@negative'] },
    async ({ page }) => {
      await page.goto('/login');

      // 1. Submit valid email but invalid password
      await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
      await page.getByTestId('login-password').fill('CompletelyWrongPassword123!');
      await page.getByTestId('login-submit').click();

      // 2. Assert error alert is visible and contains role="alert"
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toHaveAttribute('role', 'alert');
      await expect(errorAlert).toContainText(/invalid/i);
    }
  );

  test(
    'Non-existent user email returns authentication failure',
    { tag: ['@functional', '@negative'] },
    async ({ page }) => {
      await page.goto('/login');

      // 1. Submit unregistered email address
      await page.getByTestId('login-email').fill('nonexistent.user@quicktix.test');
      await page.getByTestId('login-password').fill('SomePassword123!');
      await page.getByTestId('login-submit').click();

      // 2. Assert error alert renders without leaking account existence details
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/invalid/i);
    }
  );

  test(
    'Unauthenticated navigation to /tickets is prevented and redirects to /login',
    { tag: ['@smoke', '@functional', '@negative'] },
    async ({ page }) => {
      // 1. Attempt direct access to protected route without auth token
      await page.goto('/tickets');

      // 2. Auth guard intercepts navigation and forces redirect to /login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.getByTestId('login-email')).toBeVisible();
    }
  );
});
