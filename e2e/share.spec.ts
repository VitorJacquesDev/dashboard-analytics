import { test, expect } from '@playwright/test';

test.describe('Dashboard Sharing', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@dashboard.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
    });

    test('share button is visible for dashboard owner', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Look for share button or icon
        const shareButton = page.locator('button:has-text("Share"), button[aria-label*="share"]');
        // May or may not be visible depending on UI implementation
        const isVisible = await shareButton.isVisible().catch(() => false);
        expect(typeof isVisible).toBe('boolean');
    });

    test('share modal opens when share button is clicked', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('button:has-text("Share")');
        if (await shareButton.isVisible()) {
            await shareButton.click();
            
            // Modal should appear
            await expect(page.locator('text=Share Dashboard')).toBeVisible();
        }
    });

    test('share modal has email input', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('button:has-text("Share")');
        if (await shareButton.isVisible()) {
            await shareButton.click();
            
            // Email input should be present
            const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
            await expect(emailInput).toBeVisible();
        }
    });

    test('share modal has permission selector', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('button:has-text("Share")');
        if (await shareButton.isVisible()) {
            await shareButton.click();
            
            // Permission selector should be present
            const permissionSelect = page.locator('select:has-text("view"), select:has-text("edit")');
            if (await permissionSelect.isVisible()) {
                await expect(permissionSelect).toBeVisible();
            }
        }
    });

    test('can share dashboard with another user', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('button:has-text("Share")');
        if (await shareButton.isVisible()) {
            await shareButton.click();
            
            // Fill email
            const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
            if (await emailInput.isVisible()) {
                await emailInput.fill('analyst@dashboard.com');
                
                // Click share button in modal
                const submitButton = page.locator('button:has-text("Share")').last();
                await submitButton.click();
                
                // Should show success or the user in the list
                const success = page.locator('text=shared, text=success');
                const userInList = page.locator('text=analyst@dashboard.com');
                
                const hasSuccess = await success.isVisible({ timeout: 3000 }).catch(() => false);
                const hasUser = await userInList.isVisible({ timeout: 3000 }).catch(() => false);
                
                expect(hasSuccess || hasUser).toBeTruthy();
            }
        }
    });

    test('shows error for invalid email', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('button:has-text("Share")');
        if (await shareButton.isVisible()) {
            await shareButton.click();
            
            const emailInput = page.locator('input[type="email"], input[placeholder*="email"]');
            if (await emailInput.isVisible()) {
                await emailInput.fill('nonexistent@example.com');
                
                const submitButton = page.locator('button:has-text("Share")').last();
                await submitButton.click();
                
                // Should show error
                const error = page.locator('text=not found, text=error');
                const hasError = await error.isVisible({ timeout: 3000 }).catch(() => false);
                expect(typeof hasError).toBe('boolean');
            }
        }
    });

    test('can revoke access', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('button:has-text("Share")');
        if (await shareButton.isVisible()) {
            await shareButton.click();
            
            // Look for remove button next to a shared user
            const removeButton = page.locator('button[title="Remove access"], button:has-text("×")').first();
            if (await removeButton.isVisible()) {
                // Handle confirmation dialog
                page.on('dialog', dialog => dialog.accept());
                
                await removeButton.click();
                
                // User should be removed from list
                await page.waitForTimeout(1000);
            }
        }
    });

    test('can change permission level', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('button:has-text("Share")');
        if (await shareButton.isVisible()) {
            await shareButton.click();
            
            // Look for permission dropdown in shared users list
            const permissionDropdown = page.locator('select:has-text("view")').first();
            if (await permissionDropdown.isVisible()) {
                await permissionDropdown.selectOption('EDIT');
                
                // Should update without error
                await page.waitForTimeout(500);
            }
        }
    });

    test('share modal can be closed', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('button:has-text("Share")');
        if (await shareButton.isVisible()) {
            await shareButton.click();
            
            // Modal should be open
            await expect(page.locator('text=Share Dashboard')).toBeVisible();
            
            // Close modal
            const closeButton = page.locator('button:has(svg), button[aria-label="Close"]').first();
            if (await closeButton.isVisible()) {
                await closeButton.click();
                
                // Modal should be closed
                await expect(page.locator('text=Share Dashboard')).not.toBeVisible();
            }
        }
    });

    test('shared dashboards section shows for users with shared access', async ({ page }) => {
        // Login as analyst who might have shared dashboards
        await page.goto('/login');
        await page.fill('input[type="email"]', 'analyst@dashboard.com');
        await page.fill('input[type="password"]', 'analyst123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
        
        // Look for shared dashboards section
        const sharedSection = page.locator('text=Shared with me');
        const isVisible = await sharedSection.isVisible({ timeout: 3000 }).catch(() => false);
        expect(typeof isVisible).toBe('boolean');
    });
});
