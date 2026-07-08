import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('shows hero section and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Unlimited movies')).toBeVisible();
    await expect(page.locator('text=Start Watching')).toBeVisible();
    await expect(page.locator('text=KEBA')).toBeVisible();
  });

  test('sign in link navigates to login', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('get started link navigates to register', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Get Started >> nth=0');
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});

test.describe('Auth Pages', () => {
  test('login page renders form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('register page renders form', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('text=Create Account')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('login page has link to register', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});
