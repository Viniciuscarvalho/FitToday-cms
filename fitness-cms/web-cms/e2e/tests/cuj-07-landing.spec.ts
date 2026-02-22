import { test, expect } from '@playwright/test';

test.describe('CUJ 7: Landing Page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('should display landing page with header and hero', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header
    await expect(page.locator('header')).toBeVisible();

    // Hero — FitToday brand should appear
    await expect(page.locator('header').locator('text=FitToday')).toBeVisible();
  });

  test('should have working navigation links on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Desktop nav links (hidden lg:flex, visible at 1440px)
    const nav = page.locator('nav');
    await expect(nav.locator('a[href="#funcionalidades"]')).toBeVisible();
    await expect(nav.locator('a[href="#como-funciona"]')).toBeVisible();
    await expect(nav.locator('a[href="#precos"]')).toBeVisible();
  });

  test('should display all three pricing plans', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to pricing section
    await page.locator('#precos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await expect(page.locator('#precos').locator('text=Starter').first()).toBeVisible();
    await expect(page.locator('#precos').locator('text=Pro').first()).toBeVisible();
    await expect(page.locator('#precos').locator('text=Elite').first()).toBeVisible();
  });

  test('should have register CTA buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const registerLinks = page.locator('a[href="/register"]');
    const count = await registerLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
