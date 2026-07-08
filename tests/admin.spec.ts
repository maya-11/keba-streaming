import { test, expect } from '@playwright/test';

test.describe('Admin Login', () => {
  test('admin login page renders', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('text=Admin Portal')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('redirects unauthenticated users to admin login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
