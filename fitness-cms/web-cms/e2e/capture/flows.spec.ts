import { test } from '@playwright/test';
import { loginAsTrainer } from '../helpers/auth.setup';

/**
 * Flow recordings — Playwright automatically captures video for each test
 * when `video: 'on'` is set in playwright.config.ts.
 *
 * Videos are saved to e2e/results/ after each test run.
 */

test.describe('Flow Recordings', () => {
  test('Flow 1: Login and navigate dashboard', async ({ page }) => {
    await loginAsTrainer(page);

    // Navigate through main sections
    await page.goto('/cms');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/cms/programs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/cms/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/cms/finances');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('Flow 2: Create program flow', async ({ page }) => {
    await loginAsTrainer(page);

    await page.goto('/cms/programs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Navigate to new program
    await page.goto('/cms/programs/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Flow 3: Student management flow', async ({ page }) => {
    await loginAsTrainer(page);

    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto('/cms/messages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });
});
