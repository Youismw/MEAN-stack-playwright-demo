/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/functional/
 * SPEC:      error-handling.spec.ts
 * ============================================================================
 * Error state handling, resilience, and recovery:
 *   1. Switching tabs between Sign In and Create Account resets error alert.
 *   2. Server 500 responses are rendered cleanly as friendly alerts.
 *   3. Submit button disables and indicates loading state during in-flight request.
 *   4. Network abort / offline condition displays fallback error notification.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_USERS } from '../../fixtures/mock-data.js';

test.describe('Login Component › Functional › Error Handling', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test(
    'Switching tabs between Sign In and Create Account clears active error alert',
    { tag: ['@login', '@error-handling'] },
    async ({ page }) => {
      // 1. Cause an authentication error
      await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
      await page.getByTestId('login-password').fill('WrongPassword123');
      await page.getByTestId('login-submit').click();

      // 2. Confirm error alert is visible
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();

      // 3. Switch mode to Create Account
      await page.getByTestId('tab-register').click();

      // 4. Assert error alert is automatically dismissed
      await expect(errorAlert).toBeHidden();
    }
  );

  test(
    'Server HTTP 500 error is handled gracefully with an error banner',
    { tag: ['@login', '@error-handling'] },
    async ({ page }) => {
      // 1. Intercept /api/auth/login to mock a 500 Internal Server Error
      await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Database connection dropped' }),
        });
      });

      // 2. Submit credentials
      await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
      await page.getByTestId('login-password').fill(TEST_USERS.bot.password);
      await page.getByTestId('login-submit').click();

      // 3. Assert error is rendered without crashing the client UI
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/database connection dropped|failed to sign in/i);
    }
  );

  test(
    'Submit button disables and displays loading indicator during in-flight request',
    { tag: ['@login', '@error-handling'] },
    async ({ page }) => {
      // 1. Introduce an artificial network delay on login API
      await page.route('**/api/auth/login', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        await route.continue();
      });

      // 2. Enter credentials and click Sign In
      await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
      await page.getByTestId('login-password').fill(TEST_USERS.bot.password);
      await page.getByTestId('login-submit').click();

      // 3. While in-flight, verify submit button is disabled and text is "Signing In..."
      const submitBtn = page.getByTestId('login-submit');
      await expect(submitBtn).toBeDisabled();
      await expect(submitBtn).toContainText(/signing in/i);

      // 4. Eventually finishes and navigates
      await expect(page).toHaveURL(/.*\/tickets/);
    }
  );

  test(
    'Network failure displays clear fallback error notification',
    { tag: ['@login', '@error-handling'] },
    async ({ page }) => {
      // 1. Abort network request to simulate offline network drop
      await page.route('**/api/auth/login', async (route) => {
        await route.abort('failed');
      });

      // 2. Attempt login
      await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
      await page.getByTestId('login-password').fill(TEST_USERS.bot.password);
      await page.getByTestId('login-submit').click();

      // 3. Verify user gets a visible fallback error alert
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/failed to sign in/i);
    }
  );
});
