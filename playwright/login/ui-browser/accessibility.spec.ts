/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/ui-browser/
 * SPEC:      accessibility.spec.ts
 * ============================================================================
 * Accessibility (a11y) and semantic structure testing for login view:
 *   1. Semantic heading hierarchy conforms with a single <h1> and nested <h2>.
 *   2. Form inputs are explicitly paired with accessible <label> elements.
 *   3. Tab controls expose role="tablist" and role="tab" ARIA semantics.
 *   4. Dynamic error alert provides role="alert" for immediate screen reader announcement.
 *   5. Action buttons have accessible names.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';

test.describe('Login Component › UI & Browser › Accessibility (a11y)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test(
    'Semantic heading hierarchy contains h1 and section h2',
    { tag: ['@login', '@a11y'] },
    async ({ page }) => {
      // 1. Assert hero h1 exists
      const heroHeading = page.getByRole('heading', { level: 1 });
      await expect(heroHeading).toBeVisible();
      await expect(heroHeading).toHaveText('Resolution makes it real');

      // 2. Assert card h2 exists
      const cardHeading = page.getByRole('heading', { level: 2 });
      await expect(cardHeading).toBeVisible();
      await expect(cardHeading).toHaveText('Sign In');
    }
  );

  test(
    'Form inputs have matching label elements with for attributes',
    { tag: ['@login', '@a11y'] },
    async ({ page }) => {
      // 1. Email label
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(emailLabel).toHaveText(/email address/i);

      // 2. Password label
      const passwordLabel = page.locator('label[for="password"]');
      await expect(passwordLabel).toBeVisible();
      await expect(passwordLabel).toHaveText(/password/i);
    }
  );

  test(
    'Auth tabs expose role="tablist" and role="tab" ARIA semantics',
    { tag: ['@login', '@a11y'] },
    async ({ page }) => {
      // 1. Tab container has role="tablist"
      const tablist = page.locator('[role="tablist"]');
      await expect(tablist).toBeVisible();

      // 2. Each tab button has role="tab"
      const loginTab = page.getByTestId('tab-login');
      const registerTab = page.getByTestId('tab-register');

      await expect(loginTab).toHaveAttribute('role', 'tab');
      await expect(registerTab).toHaveAttribute('role', 'tab');
    }
  );

  test(
    'Dynamic error alert has role="alert" for screen readers',
    { tag: ['@login', '@a11y'] },
    async ({ page }) => {
      // 1. Trigger an error
      await page.getByTestId('login-email').fill('invalid@quicktix.test');
      await page.getByTestId('login-password').fill('WrongPassword123');
      await page.getByTestId('login-submit').click();

      // 2. Error container has role="alert"
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toHaveAttribute('role', 'alert');
    }
  );

  test(
    'Interactive buttons have accessible names',
    { tag: ['@login', '@a11y'] },
    async ({ page }) => {
      // 1. Submit button
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

      // 2. Switch mode button
      await expect(page.getByRole('button', { name: /create an account/i })).toBeVisible();

      // 3. Demo login button
      await expect(page.getByRole('button', { name: /auto sign in with demo account/i })).toBeVisible();
    }
  );
});
