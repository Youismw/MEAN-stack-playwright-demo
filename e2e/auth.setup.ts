import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = '.auth/user.json';

setup('authenticate user 1 via UI and save storageState', async ({ page, request }) => {
  // 1. Reset database to clean seeded baseline
  const resetRes = await request.post('/api/test/reset');
  if (!resetRes.ok()) {
    const text = await resetRes.text();
    throw new Error(
      `Auth setup failed during DB reset (${resetRes.status()}): ${text}. ` +
      `If status is 404, a development server (NODE_ENV=development) is currently running on port 3000. ` +
      `Stop the running server (or close the terminal running 'npm start') so Playwright can automatically boot the test server with NODE_ENV=test.`
    );
  }

  // 2. Ensure directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // 3. Log in through Angular UI
  await page.goto('/login');
  await page.getByTestId('login-email').fill('qa.user@quicktix.test');
  await page.getByTestId('login-password').fill('Passw0rd!test');
  await page.getByTestId('login-submit').click();

  // 4. Assert navigation to tickets dashboard
  await expect(page).toHaveURL(/.*\/tickets/);
  await expect(page.getByTestId('ticket-list')).toBeVisible();

  // 5. Save authenticated storageState
  await page.context().storageState({ path: authFile });
});
