/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/functional/
 * SPEC:      validation.spec.ts
 * ============================================================================
 * Input and field validation testing for login / register forms:
 *   1. Submitting without an email triggers validation message.
 *   2. Registration with password shorter than 6 characters shows length rule alert.
 *   3. Email and password fields have required attributes.
 *   4. Password input has type="password" to mask secret characters.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';

test.describe('Login Component › Functional › Validation Testing', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test(
    'Empty email submission displays inline validation error',
    { tag: ['@login', '@validation'] },
    async ({ page }) => {
      // 1. Fill password only, leaving email blank
      await page.getByTestId('login-password').fill('SomePassword123!');

      // Bypass browser HTML5 required check to test Angular signal-based onSubmit() validation
      await page.$eval('#email', (el: HTMLInputElement) => el.removeAttribute('required'));
      await page.getByTestId('login-submit').click();

      // 2. Verify alert displays email requirement
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/please enter your email address/i);
    }
  );

  test(
    'Registration with password shorter than 6 characters shows length error',
    { tag: ['@login', '@validation'] },
    async ({ page }) => {
      // 1. Switch to register mode
      await page.getByTestId('tab-register').click();

      // 2. Fill valid email, but 3-character password (< 6)
      await page.getByTestId('login-email').fill(`user_${Date.now()}@quicktix.test`);
      await page.getByTestId('login-password').fill('12345');
      await page.getByTestId('login-submit').click();

      // 3. Assert minimum length validation message
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/at least 6 characters/i);
    }
  );

  test(
    'Form input fields enforce HTML5 attributes for email and required',
    { tag: ['@login', '@validation'] },
    async ({ page }) => {
      const emailInput = page.getByTestId('login-email');
      const passwordInput = page.getByTestId('login-password');

      // Email field checks
      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(emailInput).toHaveAttribute('required', '');

      // Password field checks
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await expect(passwordInput).toHaveAttribute('required', '');
    }
  );

  test(
    'Placeholder text dynamically updates according to active mode',
    { tag: ['@login', '@validation'] },
    async ({ page }) => {
      const emailInput = page.getByTestId('login-email');

      // In Login mode, hint suggests qa.user demo email
      await expect(emailInput).toHaveAttribute('placeholder', 'qa.user@quicktix.test');

      // Switch to Register mode
      await page.getByTestId('tab-register').click();
      await expect(emailInput).toHaveAttribute('placeholder', 'you@example.com');
    }
  );
});
