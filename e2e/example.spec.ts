import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  // Check that the page loaded
  await expect(page).toHaveTitle(/Dashboard Analytics/i);
});
