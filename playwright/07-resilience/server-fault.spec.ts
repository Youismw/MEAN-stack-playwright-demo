/**
 * ============================================================================
 * FOLDER: playwright/07-resilience/
 * ============================================================================
 * Taxonomy Category: 7. RELIABILITY & RESILIENCE TESTING
 * Subcategory:       Server Fault Injection, HTTP 500 & State Preservation
 *
 * ============================================================================
 * MODULE: playwright/07-resilience/server-fault.spec.ts
 * ============================================================================
 * WHAT THIS MODULE DOES:
 * Injects synthetic backend HTTP 500 errors into active user workflows:
 *   - Intercepts creation POST requests to `/api/tickets`.
 *   - Simulates database unavailability or server crash by returning HTTP 500.
 *   - Validates that user input is NOT wiped or destroyed when the server fails.
 *   - Confirms the form dialog remains open so the user can easily retry without
 *     retyping their data.
 *
 * WHAT IT IMPORTS:
 *   - `test, expect` from `../fixtures/base.fixture.js`: Test runner with auto-reset.
 *
 * WHERE IT IS IMPORTED / CONSUMED:
 *   - Executed by Playwright runner when matching project tags `@resilience` or
 *     `@fault-injection` (or as part of full suite `npm test`).
 *
 * HYPOTHETICAL RUNTIME FLOW:
 *   1. User opens new ticket modal and types ticket title.
 *   2. User clicks submit.
 *   3. Playwright interceptor catches POST request and responds with HTTP 500 JSON.
 *   4. Angular service catches HTTP error and updates UI error toast/banner.
 *   5. Assertion confirms modal is still open and input value is intact.
 * ============================================================================
 */

import { test, expect } from '../fixtures/base.fixture.js';

test.describe('7. Reliability & Resilience Testing › Server Fault Injection', () => {
  test(
    'UI gracefully survives HTTP 500 backend response and retains user input for retry',
    { tag: ['@resilience', '@fault-injection'] },
    async ({ page }) => {
      // Step 1: Open the dashboard and display ticket creation modal
      await page.goto('/tickets');
      await page.getByTestId('ticket-new').click();

      // Step 2: Fill in user input into the form
      const faultTitle = 'Fault Injection Resilient Ticket';
      await page.getByTestId('ticket-title-input').fill(faultTitle);

      // Step 3: Inject synthetic 500 Internal Server Error on POST /api/tickets
      await page.route('**/api/tickets', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'InternalServerError',
              message: 'Database temporarily unavailable',
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Step 4: Click the submit button to trigger the failing network request
      await page.getByTestId('ticket-submit').click();

      // Step 5: Assert that the form modal remains open (did not abruptly close or reset)
      await expect(page.getByTestId('ticket-form')).toBeVisible();

      // Step 6: Assert that the user's input was preserved, enabling retry
      await expect(page.getByTestId('ticket-title-input')).toHaveValue(faultTitle);
    }
  );
});

