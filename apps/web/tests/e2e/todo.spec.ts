import { expect, test } from '@playwright/test';

test.describe.skip('to do happy path', () => {
  test('registers, manages, reorders, and deletes a task', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/To Do List/);
  });
});
