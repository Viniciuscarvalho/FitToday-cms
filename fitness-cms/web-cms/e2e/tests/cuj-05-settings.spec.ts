import { test, expect } from '@playwright/test';
import { loginAsTrainer } from '../helpers/auth.setup';

test.describe('CUJ 5: Profile & Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/cms/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();
  });
});
