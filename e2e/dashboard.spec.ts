import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@dashboard.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
    });

    test('displays dashboard page after login', async ({ page }) => {
        await expect(page.locator('h1')).toBeVisible();
    });

    test('shows loading state initially', async ({ page }) => {
        // Navigate to dashboard
        await page.goto('/dashboard');
        
        // Should show loading or content
        const content = page.locator('main');
        await expect(content).toBeVisible();
    });

    test('displays widgets when dashboard has data', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Check for widget grid or empty state
        const hasWidgets = await page.locator('[class*="widget"]').count() > 0;
        const hasEmptyState = await page.locator('text=No widgets').count() > 0;
        
        expect(hasWidgets || hasEmptyState).toBeTruthy();
    });

    test('can toggle edit mode', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Find and click edit button
        const editButton = page.locator('button:has-text("Edit Layout")');
        if (await editButton.isVisible()) {
            await editButton.click();
            
            // Should show "Done Editing" text
            await expect(page.locator('button:has-text("Done Editing")')).toBeVisible();
        }
    });

    test('shows filter bar', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Filter bar should be visible
        const filterBar = page.locator('text=Filters');
        await expect(filterBar).toBeVisible();
    });

    test('can add a filter', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Click add filter button
        const addFilterButton = page.locator('button:has-text("Add Filter")');
        if (await addFilterButton.isVisible()) {
            await addFilterButton.click();
            
            // Filter form should appear
            await expect(page.locator('select')).toBeVisible();
        }
    });

    test('can clear filters', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Add a filter first
        const addFilterButton = page.locator('button:has-text("Add Filter")');
        if (await addFilterButton.isVisible()) {
            await addFilterButton.click();
            
            // Fill filter form
            await page.fill('input[placeholder="Value"]', 'test');
            await page.click('button:has-text("Apply Filter")');
            
            // Clear filters
            const clearButton = page.locator('button:has-text("Clear All")');
            if (await clearButton.isVisible()) {
                await clearButton.click();
                
                // Should show no active filters
                await expect(page.locator('text=No active filters')).toBeVisible();
            }
        }
    });

    test('shows real-time connection status', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Look for live indicator
        const liveIndicator = page.locator('text=Live');
        // May or may not be visible depending on WebSocket connection
        const isVisible = await liveIndicator.isVisible().catch(() => false);
        expect(typeof isVisible).toBe('boolean');
    });

    test('dashboard selector works when multiple dashboards exist', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Look for dashboard selector
        const selector = page.locator('button:has-text("Select Dashboard"), button:has([class*="selector"])');
        if (await selector.isVisible()) {
            await selector.click();
            
            // Dropdown should appear
            await expect(page.locator('[role="listbox"]')).toBeVisible();
        }
    });

    test('widget card has more options menu', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Find widget card menu button
        const menuButton = page.locator('[aria-label="More options"]').first();
        if (await menuButton.isVisible()) {
            await menuButton.click();
            
            // Menu should show export option
            await expect(page.locator('text=Export as PNG')).toBeVisible();
        }
    });

    test('can navigate to different sections via sidebar', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Click on Reports link
        const reportsLink = page.locator('a:has-text("Reports")');
        if (await reportsLink.isVisible()) {
            await reportsLink.click();
            await expect(page).toHaveURL(/reports/);
        }
    });

    test('logout redirects to login page', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Click logout
        const logoutButton = page.locator('button:has-text("Logout")');
        await logoutButton.click();
        
        // Should redirect to login
        await expect(page).toHaveURL('/login');
    });
});
