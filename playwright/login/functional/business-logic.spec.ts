/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/functional/
 * SPEC:      business-logic.spec.ts
 * ============================================================================
 * Business rules, session lifecycle, and authentication state logic:
 *   1. Active session auto-redirects from /login directly to /tickets.
 *   2. Visiting /register opens form directly in Create Account mode.
 *   3. Successful login persists token and user info into localStorage.
 *   4. Logging out clears session credentials and redirects to /login.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';
import { TEST_USERS } from '../../fixtures/mock-data.js';

test.describe('Login Component › Functional › Business Logic', () => {
  test(
    'Already authenticated user visiting /login directly is auto-redirected to /tickets',
    { tag: ['@login', '@business-logic'] },
    async ({ page, request }) => {
      // 1. Obtain valid auth token directly from API
      const authRes = await request.post('/api/auth/login', {
        data: {
          email: TEST_USERS.bot.email,
          password: TEST_USERS.bot.password,
        },
      });
      const authData = await authRes.json();

      // 2. Pre-populate active session in browser before navigating
      await page.addInitScript(({ token, user }) => {
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('user', JSON.stringify(user));
      }, authData);

      // 3. Attempt direct visit to /login
      await page.goto('/login');

      // 4. Assert auto-redirect intercepts and routes to /tickets
      await expect(page).toHaveURL(/.*\/tickets/);
      await expect(page.getByTestId('ticket-list')).toBeVisible();
    }
  );

  test(
    'Visiting /register URL directly opens the page in Create Account mode',
    { tag: ['@login', '@business-logic'] },
    async ({ page }) => {
      // 1. Visit /register directly in logged-out context
      await page.goto('/register');

      // 2. Verify form initialized in Create Account mode
      const heading = page.getByRole('heading', { level: 2 });
      await expect(heading).toHaveText('Create Account');

      const submitBtn = page.getByTestId('login-submit');
      await expect(submitBtn).toHaveText('Create Account');

      const registerTab = page.getByTestId('tab-register');
      await expect(registerTab).toHaveClass(/active/);
    }
  );

  test(
    'Successful login persists token and user object into localStorage',
    { tag: ['@login', '@business-logic'] },
    async ({ page }) => {
      // 1. Visit login page with empty storage
      await page.goto('/login');

      // 2. Perform valid login
      await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
      await page.getByTestId('login-password').fill(TEST_USERS.bot.password);
      await page.getByTestId('login-submit').click();

      // 3. Await dashboard arrival
      await expect(page).toHaveURL(/.*\/tickets/);

      // 4. Inspect browser localStorage
      const token = await page.evaluate(() => window.localStorage.getItem('token'));
      const userStr = await page.evaluate(() => window.localStorage.getItem('user'));

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token!.length).toBeGreaterThan(20);

      expect(userStr).toBeTruthy();
      const user = JSON.parse(userStr!);
      expect(user.email).toBe(TEST_USERS.bot.email);
    }
  );

  test(
    'Signing out purges localStorage session data and returns to /login',
    { tag: ['@login', '@business-logic'] },
    async ({ page }) => {
      // 1. Start from valid session via demo auto-login
      await page.goto('/login');
      await page.getByTestId('auto-signin-demo').click();
      await expect(page).toHaveURL(/.*\/tickets/);

      // 2. Click sign out button in header
      const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
      await expect(logoutBtn).toBeVisible();
      await logoutBtn.click();

      // 3. Assert redirected back to /login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.getByTestId('login-email')).toBeVisible();

      // 4. Assert token cleared
      const token = await page.evaluate(() => window.localStorage.getItem('token'));
      expect(token).toBeNull();
    }
  );
});
