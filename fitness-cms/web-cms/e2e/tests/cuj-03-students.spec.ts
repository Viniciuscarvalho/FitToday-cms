import { test, expect } from '@playwright/test';
import { loginAsTrainer } from '../helpers/auth.setup';

test.describe('CUJ 3: Student Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
  });

  test('should display students list', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();
  });

  test('should display messages page', async ({ page }) => {
    await page.goto('/cms/messages');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();
  });
});
