/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/functional/
 * SPEC:      negative.spec.ts
 * ============================================================================
 * Negative testing scenarios for authentication rejections:
 *   1. Invalid password displays inline error alert with role="alert".
 *   2. Non-existent email displays authentication failure.
 *   3. Duplicate registration with already-registered email returns conflict error.
 *   4. Direct unauthenticated URL access to /tickets redirects back to /login.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_USERS } from '../../fixtures/mock-data.js';

test.describe('Login Component › Functional › Negative Testing', () => {
  // Ensure logged-out browser context
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test(
    'Bad credentials show login-error alert',
    { tag: ['@login', '@negative'] },
    async ({ page }) => {
      // 1. Submit valid email but invalid password
      await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
      await page.getByTestId('login-password').fill('CompletelyWrongPassword123!');
      await page.getByTestId('login-submit').click();

      // 2. Assert error alert is visible, has role="alert", and informs the user
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toHaveAttribute('role', 'alert');
      await expect(errorAlert).toContainText(/invalid email or password/i);

      // 3. User remains on login page
      await expect(page).toHaveURL(/.*\/login/);
    }
  );

  test(
    'Non-existent user email displays authentication failure',
    { tag: ['@login', '@negative'] },
    async ({ page }) => {
      // 1. Submit unregistered email address
      await page.getByTestId('login-email').fill(`nonexistent_${Date.now()}@quicktix.test`);
      await page.getByTestId('login-password').fill('SomePassword123!');
      await page.getByTestId('login-submit').click();

      // 2. Assert error alert renders without leaking sensitive account details
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/invalid email or password/i);
    }
  );

  test(
    'Registration with existing email displays conflict error',
    { tag: ['@login', '@negative'] },
    async ({ page }) => {
      // 1. Switch to registration mode
      await page.getByTestId('tab-register').click();

      // 2. Enter already seeded user's email
      await page.getByTestId('login-email').fill(TEST_USERS.dev.email);
      await page.getByTestId('login-password').fill('Passw0rd!test');
      await page.getByTestId('login-submit').click();

      // 3. Assert conflict notification appears
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/already exists/i);
    }
  );

  test(
    'Unauthenticated navigation to /tickets is prevented and redirects to /login',
    { tag: ['@smoke', '@login', '@negative'] },
    async ({ page }) => {
      // 1. Attempt direct access to protected route without auth token
      await page.goto('/tickets');

      // 2. Auth guard intercepts navigation and forces redirect to /login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.getByTestId('login-email')).toBeVisible();
    }
  );
});
