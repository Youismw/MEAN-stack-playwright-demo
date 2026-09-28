import { test, expect } from './fixtures.js';

test.describe('Ticket Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
    await expect(page.getByTestId('ticket-list')).toBeVisible();
  });

  test('Test 2: Create a ticket and see it in the list @smoke', async ({ page }) => {
    const newTitle = 'E2E Automated Ticket Creation';
    const newDesc = 'Created during Playwright E2E smoke suite verification';

    await page.getByTestId('ticket-new').click();
    await expect(page.getByTestId('ticket-form')).toBeVisible();

    await page.getByTestId('ticket-title-input').fill(newTitle);
    await page.getByTestId('ticket-description-input').fill(newDesc);
    await page.getByTestId('ticket-priority-select').selectOption('High');
    await page.getByTestId('ticket-status-select').selectOption('Open');

    await page.getByTestId('ticket-submit').click();

    // Verify modal closed and row rendered
    await expect(page.getByTestId('ticket-form')).toBeHidden();

    const createdRow = page.getByTestId('ticket-row').filter({ hasText: newTitle });
    await expect(createdRow).toBeVisible();
    await expect(createdRow.getByTestId('ticket-status')).toHaveText('Open');
  });

  test('Test 3: Empty title shows an inline ticket-title-error', async ({ page }) => {
    await page.getByTestId('ticket-new').click();
    await expect(page.getByTestId('ticket-form')).toBeVisible();

    // Fill invalid short title then submit
    await page.getByTestId('ticket-title-input').fill('ab');
    await page.getByTestId('ticket-title-input').fill('');
    await page.getByTestId('ticket-submit').click();

    const errorAlert = page.getByTestId('ticket-title-error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveAttribute('role', 'alert');
    await expect(errorAlert).toContainText(/Title must be between 3 and 100 characters/i);

    // Ensure form did not submit
    await expect(page.getByTestId('ticket-form')).toBeVisible();
  });

  test('Test 4: Edit a seeded Open ticket to Resolved', async ({ page }) => {
    const targetTitle = 'Fix login button styling';
    const targetRow = page.getByTestId('ticket-row').filter({ hasText: targetTitle });
    await expect(targetRow).toBeVisible();
    await expect(targetRow.getByTestId('ticket-status')).toHaveText('Open');

    await targetRow.getByTestId('ticket-edit').click();
    await expect(page.getByTestId('ticket-form')).toBeVisible();

    await page.getByTestId('ticket-status-select').selectOption('Resolved');
    await page.getByTestId('ticket-submit').click();

    await expect(page.getByTestId('ticket-form')).toBeHidden();
    await expect(targetRow.getByTestId('ticket-status')).toHaveText('Resolved');
  });

  test('Test 5: Filter by Open shows exactly 2 rows', async ({ page }) => {
    await page.getByTestId('status-filter').selectOption('Open');

    // Wait for the filter to take effect
    const rows = page.getByTestId('ticket-row');
    await expect(rows).toHaveCount(2);

    // Verify all rendered rows have status Open
    for (let i = 0; i < 2; i++) {
      await expect(rows.nth(i).getByTestId('ticket-status')).toHaveText('Open');
    }
  });

  test('Test 6: Delete a ticket via the confirm modal', async ({ page }) => {
    const targetTitle = 'Setup automated backups';
    const targetRow = page.getByTestId('ticket-row').filter({ hasText: targetTitle });
    await expect(targetRow).toBeVisible();

    await targetRow.getByTestId('ticket-delete').click();

    // Custom confirm dialog appears
    const confirmDialog = page.getByTestId('confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    await page.getByTestId('confirm-accept').click();
    await expect(confirmDialog).toBeHidden();

    // Verify row is removed from DOM
    await expect(page.getByTestId('ticket-row').filter({ hasText: targetTitle })).toHaveCount(0);
  });
});
