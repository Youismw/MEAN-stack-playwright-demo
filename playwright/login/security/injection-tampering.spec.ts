/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/security/
 * MODULE:    injection-tampering.spec.ts
 * TAXONOMY:  5. Security Testing › Injection Defense, XSS Sanitization & Token Tampering
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Tests the system against adversarial security exploitation:
 *   1. NoSQL Injection Resistance: Submitting MongoDB operator payloads
 *      (e.g. `{"$ne": null}`) must fail safely with 401 and never bypass authentication.
 *   2. Cross-Site Scripting (XSS) Sanitization: Submitting `<script>` payloads in
 *      form fields must be safely escaped in the DOM and never execute JavaScript.
 *   3. Tampered JWT Signature: Tampering with token signatures in `localStorage`
 *      causes server-side verification to fail, expelling user to `/login`.
 *   4. Expired Token Expulsion: Supplying an expired JWT forces re-authentication.
 *
 * COMMUNICATES WITH:
 *   - Backend Auth Middleware: `authenticateToken` in `server/src/middleware/auth.ts`
 *   - Client Guard: `AuthGuard` in `client/src/app/guards/auth.guard.ts`
 *   - Browser Context: `page.addInitScript()` for deterministic localStorage manipulation
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Attacker submits crafted malicious input or tampers with client-side state.
 *   2. Backend sanitization and signature verification intercept the attack.
 *   3. Application gracefully refuses access and redirects to safe view.
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
      // Step 1: Submit typical NoSQL query injection strings targeting MongoDB
      await page.getByTestId('login-email').fill('{"$ne": null}');
      await page.getByTestId('login-password').fill('{"$gt": ""}');
      await page.getByTestId('login-submit').click();

      // Step 2: Must be rejected with normal invalid credentials alert, never bypass
      const errorAlert = page.getByTestId('login-error');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert).toContainText(/invalid email or password/i);

      // Step 3: User remains safely on /login without unauthorized redirection
      await expect(page).toHaveURL(/.*\/login/);
    }
  );

  test(
    'Reflected XSS payload in input fields is sanitized and does not execute scripts',
    { tag: ['@security', '@xss', '@login'] },
    async ({ page }) => {
      // Step 1: Inject an XSS detection probe into the email field
      const xssPayload = '<script>window.__xss_probe = true;</script>';
      await page.getByTestId('login-email').fill(xssPayload);
      await page.getByTestId('login-password').fill('SomePassword123!');
      await page.getByTestId('login-submit').click();

      // Step 2: Assert script never executed in browser window context
      const xssFired = await page.evaluate(() => (window as any).__xss_probe);
      expect(xssFired).toBeUndefined();

      // Step 3: Page remains intact and safely shows error
      await expect(page.getByTestId('login-error')).toBeVisible();
    }
  );

  test(
    'Tampered JWT token signature in localStorage is rejected and redirects to /login',
    { tag: ['@security', '@tampering', '@login'] },
    async ({ page }) => {
      // Step 1: Forge a corrupted JWT token with a bogus HMAC signature
      const bogusToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMSIsImVtYWlsIjoidGFtcGVyZWRAcXVpY2t0aXgudGVzdCJ9.BOGUS_SIGNATURE_TAMPERED';
      
      await page.addInitScript((token) => {
        window.localStorage.setItem('token', token);
      }, bogusToken);

      // Step 2: Attempt to deep-link to protected route
      await page.goto('/tickets');

      // Step 3: Backend auth middleware rejects with 401; client redirects to /login
      await expect(page).toHaveURL(/.*\/login/);
      await expect(page.getByTestId('login-email')).toBeVisible();
    }
  );

  test(
    'Expired JWT token forces re-authentication',
    { tag: ['@security', '@tampering', '@login'] },
    async ({ page }) => {
      // Step 1: Inject an expired JWT token (iat: 1000, exp: 1001) into localStorage
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMSIsImlhdCI6MTAwMCwiZXhwIjoxMDAxfQ.d0c2Mzk1NTFlNTU5MWY2MmYzZDU5NTNmOTcyM2ZkMmM';

      await page.addInitScript((token) => {
        window.localStorage.setItem('token', token);
      }, expiredToken);

      // Step 2: Attempt to visit tickets dashboard
      await page.goto('/tickets');

      // Step 3: Verify user is forced back to login view
      await expect(page).toHaveURL(/.*\/login/);
    }
  );
});
