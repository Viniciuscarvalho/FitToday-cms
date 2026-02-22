import { test, expect } from '@playwright/test';
import { loginAsTrainer } from '../helpers/auth.setup';

test.describe('CUJ 2: Program Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
  });

  test('should display programs list', async ({ page }) => {
    await page.goto('/cms/programs');
    await page.waitForLoadState('networkidle');

    // Page should load without errors
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate to new program form', async ({ page }) => {
    await page.goto('/cms/programs/new');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('main')).toBeVisible();
    // The new program page should have form elements
    expect(page.url()).toContain('/cms/programs/new');
  });

  test('should display program list page elements', async ({ page }) => {
    await page.goto('/cms/programs');
    await page.waitForLoadState('networkidle');

    // Should have the main content area
    await expect(page.locator('main')).toBeVisible();
    // Should have sidebar navigation
    await expect(page.locator('aside')).toBeVisible();
  });
});
