import { test } from '@playwright/test';
import { loginAsTrainer, loginAsAdmin } from '../helpers/auth.setup';

const SCREENSHOT_DIR = './e2e/capture/output/screenshots';

test.describe('Platform Screenshots', () => {
  // ── PUBLIC PAGES ──

  test('landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-landing-hero.png`, fullPage: false });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-landing-full.png`, fullPage: true });
  });

  test('login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login.png`, fullPage: true });
  });

  test('register page', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-register.png`, fullPage: true });
  });

  // ── CMS DASHBOARD (requires auth) ──

  test.describe('CMS Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsTrainer(page);
    });

    test('dashboard home', async ({ page }) => {
      await page.goto('/cms');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-cms-dashboard.png`, fullPage: true });
    });

    test('programs list', async ({ page }) => {
      await page.goto('/cms/programs');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-cms-programs.png`, fullPage: true });
    });

    test('new program', async ({ page }) => {
      await page.goto('/cms/programs/new');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-cms-program-new.png`, fullPage: true });
    });

    test('students list', async ({ page }) => {
      await page.goto('/cms/students');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07-cms-students.png`, fullPage: true });
    });

    test('messages', async ({ page }) => {
      await page.goto('/cms/messages');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/08-cms-messages.png`, fullPage: true });
    });

    test('analytics', async ({ page }) => {
      await page.goto('/cms/analytics');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/09-cms-analytics.png`, fullPage: true });
    });

    test('finances', async ({ page }) => {
      await page.goto('/cms/finances');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/10-cms-finances.png`, fullPage: true });
    });

    test('settings', async ({ page }) => {
      await page.goto('/cms/settings');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/11-cms-settings.png`, fullPage: true });
    });
  });

  // ── ADMIN PANEL (requires admin auth) ──

  test.describe('Admin Panel', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
    });

    test('admin dashboard', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/12-admin-dashboard.png`, fullPage: true });
    });

    test('admin trainers', async ({ page }) => {
      await page.goto('/admin/trainers');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `${SCREENSHOT_DIR}/13-admin-trainers.png`, fullPage: true });
    });
  });
});
