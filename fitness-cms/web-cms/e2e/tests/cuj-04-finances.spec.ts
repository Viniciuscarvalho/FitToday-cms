import { test, expect } from '@playwright/test';
import { loginAsTrainer } from '../helpers/auth.setup';

test.describe('CUJ 4: Financial Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
  });

  test('should display finances page', async ({ page }) => {
    await page.goto('/cms/finances');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();
  });

  test('should display analytics page', async ({ page }) => {
    await page.goto('/cms/analytics');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();
  });
});
