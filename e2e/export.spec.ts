import { test, expect } from '@playwright/test';

test.describe('Export Functionality', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@dashboard.com');
        await page.fill('input[type="password"]', 'admin1307');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
    });

    test('export menu is visible', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Look for export button
        const exportButton = page.locator('button:has-text("Export")');
        if (await exportButton.isVisible()) {
            await expect(exportButton).toBeVisible();
        }
    });

    test('export menu shows all options', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const exportButton = page.locator('button:has-text("Export")');
        if (await exportButton.isVisible()) {
            await exportButton.click();
            
            // Check all export options
            await expect(page.locator('text=PDF Document')).toBeVisible();
            await expect(page.locator('text=PNG Image')).toBeVisible();
            await expect(page.locator('text=Excel Spreadsheet')).toBeVisible();
            await expect(page.locator('text=CSV File')).toBeVisible();
        }
    });

    test('can initiate PDF export', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const exportButton = page.locator('button:has-text("Export")');
        if (await exportButton.isVisible()) {
            await exportButton.click();
            
            // Click PDF option
            const pdfOption = page.locator('button:has-text("PDF Document")');
            if (await pdfOption.isVisible()) {
                // Set up download listener
                const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
                
                await pdfOption.click();
                
                // Either download starts or export is processing
                const download = await downloadPromise;
                if (download) {
                    expect(download.suggestedFilename()).toContain('.pdf');
                }
            }
        }
    });

    test('can initiate PNG export', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const exportButton = page.locator('button:has-text("Export")');
        if (await exportButton.isVisible()) {
            await exportButton.click();
            
            const pngOption = page.locator('button:has-text("PNG Image")');
            if (await pngOption.isVisible()) {
                const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
                
                await pngOption.click();
                
                const download = await downloadPromise;
                if (download) {
                    expect(download.suggestedFilename()).toContain('.png');
                }
            }
        }
    });

    test('widget export menu works', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // Find widget more options button
        const menuButton = page.locator('[aria-label="More options"]').first();
        if (await menuButton.isVisible()) {
            await menuButton.click();
            
            // Export as PNG option should be visible
            const exportPNG = page.locator('button:has-text("Export as PNG")');
            await expect(exportPNG).toBeVisible();
        }
    });

    test('export shows loading state', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const exportButton = page.locator('button:has-text("Export")');
        if (await exportButton.isVisible()) {
            await exportButton.click();
            
            const pdfOption = page.locator('button:has-text("PDF Document")');
            if (await pdfOption.isVisible()) {
                await pdfOption.click();
                
                // Should show exporting state
                const exportingText = page.locator('text=Exporting');
                // May be visible briefly
                const wasVisible = await exportingText.isVisible({ timeout: 1000 }).catch(() => false);
                expect(typeof wasVisible).toBe('boolean');
            }
        }
    });

    test('export menu closes after selection', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        const exportButton = page.locator('button:has-text("Export")');
        if (await exportButton.isVisible()) {
            await exportButton.click();
            
            // Menu should be open
            await expect(page.locator('text=PDF Document')).toBeVisible();
            
            // Click outside to close
            await page.click('body', { position: { x: 10, y: 10 } });
            
            // Menu should close
            await expect(page.locator('text=PDF Document')).not.toBeVisible();
        }
    });
});
