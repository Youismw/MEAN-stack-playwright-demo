/**
 * ============================================================================
 * FOLDER: playwright/00-setup/
 * ============================================================================
 * Global configuration and authentication setup projects for Playwright.
 *
 * ============================================================================
 * MODULE: playwright/00-setup/auth.setup.ts (Global UI Auth Setup)
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Establishes an authenticated session ONCE at the start of a test run:
 *   1. Invokes `/api/test/reset` to establish clean seeded users.
 *   2. Navigates a real Chromium browser to `/login`.
 *   3. Fills Playwright Bot credentials (`playwright.bot@quicktix.test` / `Passw0rd!test`).
 *   4. Submits the form and verifies navigation to `/tickets`.
 *   5. Saves browser cookies and `localStorage` token to `.auth/user.json`.
 *
 * COMMUNICATES WITH:
 *   - Runs as a Playwright project dependency (`dependencies: ['setup']`) in `playwright.config.ts`.
 *   - Creates file `.auth/user.json`.
 *   - Consumed by all subsequent tests in the `chromium` project via `storageState`.
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. Developer runs `npm run test:e2e`.
 *   2. Playwright runs the 'setup' project first before any test specs.
 *   3. This setup logs in through the Angular UI and writes `.auth/user.json`.
 *   4. Subsequent tests launch with this session already pre-loaded into localStorage,
 *      avoiding redundant login steps in each test.
 * ============================================================================
 */

import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TEST_USERS } from '../fixtures/mock-data.js';

// Target destination file for serialized browser storageState
const authFile = '.auth/user.json';

setup('authenticate user 1 via UI and save storageState', async ({ page, request }) => {
  // 1. Reset database to clean seeded baseline
  const resetRes = await request.post('/api/test/reset');
  if (!resetRes.ok()) {
    const text = await resetRes.text();
    throw new Error(
      `Auth setup failed during DB reset (${resetRes.status()}): ${text}. ` +
      `Ensure the test server is booted with NODE_ENV=test.`
    );
  }

  // 2. Ensure storageState target directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 3. Log in through Angular UI form
  await page.goto('/login');
  await page.getByTestId('login-email').fill(TEST_USERS.bot.email);
  await page.getByTestId('login-password').fill(TEST_USERS.bot.password);
  await page.getByTestId('login-submit').click();

  // 4. Assert navigation to tickets dashboard and verify ticket-list renders
  await expect(page).toHaveURL(/.*\/tickets/);
  await expect(page.getByTestId('ticket-list')).toBeVisible();

  // 5. Save authenticated storageState (cookies + localStorage JWT) to disk
  await page.context().storageState({ path: authFile });
});
