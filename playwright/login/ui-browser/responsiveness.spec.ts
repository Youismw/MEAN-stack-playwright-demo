/**
 * ============================================================================
 * COMPONENT: Login Page
 * FOLDER:    playwright/login/ui-browser/
 * SPEC:      responsiveness.spec.ts
 * ============================================================================
 * Responsive layout and viewport adaptability testing:
 *   1. Mobile viewport (375x667): Card scales fluidly with zero horizontal overflow.
 *   2. Tablet viewport (768x1024): Card maintains centering and legible spacing.
 *   3. Desktop viewport (1280x800): Standard desktop presentation.
 * ============================================================================
 */

import { test, expect } from '../../fixtures/base.fixture.js';

test.describe('Login Component › UI & Browser › Responsiveness', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test(
    'Mobile viewport (375x667): Card adapts with no horizontal overflow',
    { tag: ['@login', '@responsive'] },
    async ({ page }) => {
      // 1. Set mobile viewport size
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      // 2. Elements are visible and properly styled
      const loginCard = page.locator('.login-card');
      await expect(loginCard).toBeVisible();

      const submitBtn = page.getByTestId('login-submit');
      await expect(submitBtn).toBeVisible();

      // 3. Verify page does not have unintended horizontal scrollbar overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // 4. Form inputs remain fully clickable and within viewport bounds
      const emailBox = await page.getByTestId('login-email').boundingBox();
      expect(emailBox).not.toBeNull();
      expect(emailBox!.x).toBeGreaterThanOrEqual(0);
      expect(emailBox!.x + emailBox!.width).toBeLessThanOrEqual(375);
    }
  );

  test(
    'Tablet viewport (768x1024): Centers card and renders legible typography',
    { tag: ['@login', '@responsive'] },
    async ({ page }) => {
      // 1. Set tablet viewport size
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/login');

      // 2. Verify hero and card are visible
      await expect(page.locator('.hero-header')).toBeVisible();
      await expect(page.locator('.login-card')).toBeVisible();

      // 3. Verify horizontal centering: card left margin + width should be balanced
      const cardBox = await page.locator('.login-card').boundingBox();
      expect(cardBox).not.toBeNull();
      const leftGap = cardBox!.x;
      const rightGap = 768 - (cardBox!.x + cardBox!.width);
      // Left and right margins should be roughly equal (centered within 5px tolerance)
      expect(Math.abs(leftGap - rightGap)).toBeLessThan(10);
    }
  );

  test(
    'Desktop viewport (1280x800): Standard presentation renders cleanly',
    { tag: ['@login', '@responsive'] },
    async ({ page }) => {
      // 1. Set desktop viewport size
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/login');

      // 2. All key visual components render in normal flow
      await expect(page.locator('app-header')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('.login-card')).toBeVisible();
      await expect(page.getByTestId('auto-signin-demo')).toBeVisible();
    }
  );
});
