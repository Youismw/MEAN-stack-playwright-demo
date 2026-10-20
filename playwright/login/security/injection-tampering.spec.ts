/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/security/
 * SPEC:      injection-tampering.spec.ts
 * ============================================================================
 * Security Testing: Injection defenses, XSS sanitization, and session tampering.
 *   1. NoSQL operator injection payloads do not bypass auth and return 401.
 *   2. Reflected XSS strings in login form are safely escaped in DOM.
 *   3. Tampered JWT signature in localStorage is rejected with redirect to /login.
 *   4. Expired token in localStorage is intercepted by AuthGuard.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';

test.describe('Login Component › Security › Injection & Session Tampering', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test(
    'NoSQL injection probe strings do not bypass authentication and fail safely',
    { tag: ['@security', '@injection', '@login'] },
    async ({ page }) => {
      // 1. Submit common NoSQL injection string patterns
      await page.getByTestId('login-email').fill('{"$ne": null}');
      await page.getByTestId('login-password').fill('{"$gt": ""}');
      await page.getByTestId('login-submit').click();

      // 2. Must be rejected with normal invalid credentials alert, never bypass
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/invalid email or password/i);

      // 3. User remains safely on /login
      await expect(page).toHaveURL(/.*\/login/);
    }
  );

  test(
    'Reflected XSS payload in input fields is sanitized and does not execute scripts',
    { tag: ['@security', '@xss', '@login'] },
    async ({ page }) => {
      // 1. Inject an XSS detection probe
      const xssPayload = '<script>window.__xss_probe = true;</script>';
      await page.getByTestId('login-email').fill(xssPayload);
      await page.getByTestId('login-password').fill('SomePassword123!');
      await page.getByTestId('login-submit').click();

      // 2. Assert script never executed in browser window
      const xssFired = await page.evaluate(() => (window as any).__xss_probe);
      expect(xssFired).toBeUndefined();

      // 3. Page remains intact and safely shows error
      await expect(page.getByTestId('login-error')).toBeVisible();
    }
  );

  test(
    'Tampered JWT token signature in localStorage is rejected and redirects to /login',
    { tag: ['@security', '@tampering', '@login'] },
    async ({ page }) => {
      // 1. Forge a corrupted JWT token with bogus signature
      const bogusToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMSIsImVtYWlsIjoidGFtcGVyZWRAcXVpY2t0aXgudGVzdCJ9.BOGUS_SIGNATURE_TAMPERED';
      
      await page.addInitScript((token) => {
        window.localStorage.setItem('token', token);
      }, bogusToken);

      // 2. Attempt to deep-link to protected route
      await page.goto('/tickets');

      // 3. Backend auth middleware rejects with 401; client redirects to /login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.getByTestId('login-email')).toBeVisible();
    }
  );

  test(
    'Expired JWT token forces re-authentication',
    { tag: ['@security', '@tampering', '@login'] },
    async ({ page }) => {
      // 1. Expired JWT payload (iat: 1000, exp: 1001)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMSIsImlhdCI6MTAwMCwiZXhwIjoxMDAxfQ.d0c2Mzk1NTFlNTU5MWY2MmYzZDU5NTNmOTcyM2ZkMmM';

      await page.addInitScript((token) => {
        window.localStorage.setItem('token', token);
      }, expiredToken);

      // 2. Attempt to visit dashboard
      await page.goto('/tickets');

      // 3. User is forced to login page
      await expect(page).toHaveURL(/.*\/login/);
    }
  );
});
