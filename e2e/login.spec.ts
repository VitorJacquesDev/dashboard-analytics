import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in credentials (using seeded admin user)
    await page.fill('input[type="email"]', 'admin@dashboard.com');
    await page.fill('input[type="password"]', 'admin1307');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirection to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify dashboard content is visible
    await expect(page.getByRole('heading', { level: 1 }).last()).toBeVisible();
});
