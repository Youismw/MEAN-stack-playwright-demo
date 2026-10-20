/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/ui-browser/
 * SPEC:      navigation.spec.ts
 * ============================================================================
 * Navigation, header state, and client-side routing transitions:
 *   1. Header displays login-variant branding without leaking user controls.
 *   2. Tab switching seamlessly updates card title, description, and button text.
 *   3. Browser back-forward navigation preserves session integrity after sign-in.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';

test.describe('Login Component › UI & Browser › Navigation & Routing', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test(
    'Login header renders branding and hides authenticated user actions',
    { tag: ['@login', '@navigation'] },
    async ({ page }) => {
      // 1. Header is present
      const header = page.locator('app-header');
      await expect(header).toBeVisible();

      // 2. Contains brand title and edition badge
      await expect(page.getByText('QuickTix')).toBeVisible();
      await expect(page.getByText('ARCHITECTURAL EDITION')).toBeVisible();

      // 3. Authenticated actions (e.g. ticket create button, user badge) are not rendered
      await expect(page.getByTestId('ticket-new')).toBeHidden();
      await expect(page.getByRole('button', { name: /logout|sign out/i })).toBeHidden();
    }
  );

  test(
    'Switching between tabs transitions text smoothly without page reload',
    { tag: ['@login', '@navigation'] },
    async ({ page }) => {
      const heading = page.getByRole('heading', { level: 2 });
      const description = page.locator('.card-description');
      const submitBtn = page.getByTestId('login-submit');

      // 1. Initial Sign In state
      await expect(heading).toHaveText('Sign In');
      await expect(description).toContainText(/access your engineering ticket stream/i);
      await expect(submitBtn).toHaveText('Sign In');

      // 2. Switch to Create Account
      await page.getByTestId('tab-register').click();
      await expect(heading).toHaveText('Create Account');
      await expect(description).toContainText(/set up your personal ticket workspace/i);
      await expect(submitBtn).toHaveText('Create Account');

      // 3. Switch back to Sign In
      await page.getByTestId('tab-login').click();
      await expect(heading).toHaveText('Sign In');
      await expect(submitBtn).toHaveText('Sign In');
    }
  );

  test(
    'Browser back button preserves protected session after logging in',
    { tag: ['@login', '@navigation'] },
    async ({ page }) => {
      // 1. Log in via demo button
      await page.getByTestId('auto-signin-demo').click();
      await expect(page).toHaveURL(/.*\/tickets/);
      await expect(page.getByTestId('ticket-list')).toBeVisible();

      // 2. Press browser back button
      await page.goBack();

      // 3. Angular AuthGuard / LoginComponent.ngOnInit intercepts because user is already authenticated
      await expect(page).toHaveURL(/.*\/tickets/);
      await expect(page.getByTestId('ticket-list')).toBeVisible();
    }
  );
});
