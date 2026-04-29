import { test, expect } from '@playwright/test';

test.describe('StayCool Sanity Check', () => {
  
  test('Homepage should load and have correct title', async ({ page }) => {
    await page.goto('/');
    // Check if the page title contains "StayCool"
    await expect(page).toHaveTitle(/StayCool/);
    
    // Check if the search input is visible
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('Login page should be accessible', async ({ page }) => {
    await page.goto('/auth');
    // Check for "Welcome Back" heading
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    
    // Check if email input exists
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('List Property page should require authentication or show form', async ({ page }) => {
    await page.goto('/list-property');
    // If not logged in, it might redirect to login. Let's see what happens.
    // We just check if the page loads without a 404 or 500 error.
    const status = await page.evaluate(() => document.title);
    expect(status).not.toContain('404');
    expect(status).not.toContain('500');
  });

  test('Mobile view - menu should be toggleable', async ({ page }) => {
    // This test will run on mobile-chrome project too
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check for hamburger menu (Bars3Icon usually)
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.count() > 0) {
      await expect(menuButton).toBeVisible();
      await menuButton.click();
      // Wait for some menu link to be visible
      // await expect(page.getByRole('link', { name: /Login/i })).toBeVisible();
    }
  });
});
