import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth.setup';

test.describe('CUJ 6: Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display admin dashboard', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();
  });

  test('should display trainers management', async ({ page }) => {
    await page.goto('/admin/trainers');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();
  });
});
