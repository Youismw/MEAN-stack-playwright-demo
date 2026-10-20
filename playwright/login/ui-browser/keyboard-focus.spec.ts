/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/ui-browser/
 * SPEC:      keyboard-focus.spec.ts
 * ============================================================================
 * Keyboard accessibility and focus management testing:
 *   1. Tab key traverses form controls in natural reading order.
 *   2. Shift+Tab reverses focus traversal back to previous element.
 *   3. Pressing Enter inside password field submits the form.
 *   4. Active focus styling state is correctly engaged on input controls.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';

test.describe('Login Component › UI & Browser › Keyboard & Focus Behavior', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test(
    'Tab key traverses interactive elements in logical order',
    { tag: ['@login', '@keyboard'] },
    async ({ page }) => {
      // 1. Focus first tab button
      await page.getByTestId('tab-login').focus();
      await expect(page.getByTestId('tab-login')).toBeFocused();

      // 2. Tab to second tab (Create Account)
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('tab-register')).toBeFocused();

      // 3. Tab to Email input
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('login-email')).toBeFocused();

      // 4. Tab to Password input
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('login-password')).toBeFocused();

      // 5. Tab to Submit button
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('login-submit')).toBeFocused();

      // 6. Tab to Mode switch button
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('auth-switch-mode')).toBeFocused();

      // 7. Tab to Demo auto sign-in button
      await page.keyboard.press('Tab');
      await expect(page.getByTestId('auto-signin-demo')).toBeFocused();
    }
  );

  test(
    'Shift+Tab moves focus in reverse direction',
    { tag: ['@login', '@keyboard'] },
    async ({ page }) => {
      // 1. Focus password input
      await page.getByTestId('login-password').focus();
      await expect(page.getByTestId('login-password')).toBeFocused();

      // 2. Press Shift+Tab to jump back to Email input
      await page.keyboard.press('Shift+Tab');
      await expect(page.getByTestId('login-email')).toBeFocused();
    }
  );

  test(
    'Pressing Enter inside password field triggers form submission',
    { tag: ['@login', '@keyboard'] },
    async ({ page }) => {
      // 1. Fill invalid credentials using keyboard
      await page.getByTestId('login-email').fill('wrong.email@quicktix.test');
      await page.getByTestId('login-password').fill('WrongPassword123');

      // 2. Press Enter while still in the password input
      await page.keyboard.press('Enter');

      // 3. Form submits and triggers error alert without any mouse click
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
    }
  );
});
