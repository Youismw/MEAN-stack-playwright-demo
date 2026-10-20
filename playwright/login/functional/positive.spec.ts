/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/functional/
 * SPEC:      positive.spec.ts
 * ============================================================================
 * Happy-path testing for login and registration capabilities:
 *   1. Valid sign-in authenticates and navigates to /tickets dashboard.
 *   2. One-click demo sign-in button automatically fills credentials and signs in.
 *   3. New user registration successfully creates account and redirects to dashboard.
 *   4. Mode toggle switches seamlessly between Sign In and Create Account.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_USERS } from '../../fixtures/mock-data.js';

test.describe('Login Component › Functional › Positive Testing', () => {
  // Ensure each test begins with a clean, unauthenticated context
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test(
    'Valid login authenticates user and navigates to tickets dashboard',
    { tag: ['@smoke', '@login', '@positive'] },
    async ({ page }) => {
      // 1. Enter valid bot credentials
      await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
      await page.getByTestId('login-password').fill(TEST_USERS.bot.password);

      // 2. Click Sign In
      await page.getByTestId('login-submit').click();

      // 3. Confirm route navigation and tickets dashboard visibility
      await expect(page).toHaveURL(/.*\/tickets/);
      await expect(page.getByTestId('ticket-list')).toBeVisible();
    }
  );

  test(
    'Auto Sign In with Demo Account button logs in immediately',
    { tag: ['@login', '@positive'] },
    async ({ page }) => {
      // 1. Click demo sign in button
      const demoBtn = page.getByTestId('auto-signin-demo');
      await expect(demoBtn).toBeVisible();
      await demoBtn.click();

      // 2. Should navigate to tickets dashboard
      await expect(page).toHaveURL(/.*\/tickets/);
      await expect(page.getByTestId('ticket-list')).toBeVisible();
    }
  );

  test(
    'New user registration flow creates account and directs to tickets dashboard',
    { tag: ['@login', '@positive'] },
    async ({ page }) => {
      // 1. Switch to Create Account tab
      await page.getByTestId('tab-register').click();
      await expect(page.getByRole('heading', { level: 2 })).toHaveText('Create Account');

      // 2. Fill unique user credentials
      const uniqueEmail = `qa_test_${Date.now()}@quicktix.test`;
      await page.getByTestId('login-email').fill(uniqueEmail);
      await page.getByTestId('login-password').fill('Passw0rd!test');

      // 3. Submit registration form
      await page.getByTestId('login-submit').click();

      // 4. Confirm dashboard reached
      await expect(page).toHaveURL(/.*\/tickets/);
    }
  );

  test(
    'Mode switch link toggles between Sign In and Create Account',
    { tag: ['@login', '@positive'] },
    async ({ page }) => {
      // Initially in Sign In mode
      await expect(page.getByTestId('login-submit')).toHaveText('Sign In');

      // Switch to Create Account via footer link
      await page.getByTestId('auth-switch-mode').click();
      await expect(page.getByTestId('login-submit')).toHaveText('Create Account');

      // Switch back to Sign In
      await page.getByTestId('auth-switch-mode').click();
      await expect(page.getByTestId('login-submit')).toHaveText('Sign In');
    }
  );
});
