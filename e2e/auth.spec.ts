import { test, expect } from './fixtures.js';

test.describe('Authentication & Access Control', () => {
  // Enforce unauthenticated browser context for logged-out tests
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Test 1: Bad credentials show login-error', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('login-email').fill('qa.user@quicktix.test');
    await page.getByTestId('login-password').fill('WrongPassword123!');
    await page.getByTestId('login-submit').click();

    const errorAlert = page.getByTestId('login-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveAttribute('role', 'alert');
    await expect(errorAlert).toContainText(/invalid/i);
  });

  test('Test 7: /tickets redirects to /login @smoke', async ({ page }) => {
    await page.goto('/tickets');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByTestId('login-email')).toBeVisible();
  });
});
