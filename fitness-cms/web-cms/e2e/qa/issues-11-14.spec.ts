/**
 * QA: Exploratory tests for Issues #11 – #14
 *
 * Issue #11: POST /api/students persists trainerId + subscription document
 * Issue #12: Auth fixed in workout API calls (apiRequest with Firebase token)
 * Issue #13: Stripe Webhook handles checkout.session.completed, invoice.paid,
 *             customer.subscription.updated, customer.subscription.deleted
 * Issue #14: prd-integrate-app feature – Treinos tab, UploadWorkoutModal, workout detail page
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://web-cms-pink.vercel.app';
const SCREENSHOTS = '/Users/viniciuscarvalho/Documents/FitToday-cms/dogfood-output/screenshots';

// Ensure screenshots dir exists
if (!fs.existsSync(SCREENSHOTS)) {
  fs.mkdirSync(SCREENSHOTS, { recursive: true });
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOTS, `${name}.png`),
    fullPage: true,
  });
}

async function loginWithCredentials(page: Page) {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('Missing PLAYWRIGHT_TEST_EMAIL or PLAYWRIGHT_TEST_PASSWORD');
  }

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
  await page.waitForLoadState('networkidle');
}

// ─────────────────────────────────────────────────────────────
// Issue #11: Students API + page
// ─────────────────────────────────────────────────────────────

test.describe('Issue #11: Students API and page', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
  });

  test('#11-A: students list page loads without error', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/students`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'issue11-students-list');

    // Page should have a main element (not a hard error)
    await expect(page.locator('main')).toBeVisible();

    // Should NOT show a raw JSON error or 500
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('"error":');
    expect(bodyText).not.toContain('500 Internal Server Error');
  });

  test('#11-B: student detail page accessible from list', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/students`);
    await page.waitForLoadState('networkidle');

    // Try to click the first student if any are present
    const firstStudentLink = page.locator('a[href*="/cms/students/"]').first();
    const hasStudents = await firstStudentLink.isVisible().catch(() => false);

    if (hasStudents) {
      await firstStudentLink.click();
      await page.waitForLoadState('networkidle');
      await screenshot(page, 'issue11-student-detail');
      await expect(page.locator('main')).toBeVisible();
    } else {
      // No students yet – that is acceptable; the list page itself loaded
      await screenshot(page, 'issue11-students-empty');
      console.log('No students found in list – empty state is acceptable');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Issue #12: Auth in workout API calls
// ─────────────────────────────────────────────────────────────

test.describe('Issue #12: Auth in workout API calls', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
  });

  test('#12-A: student detail page loads Treinos tab without 401', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/students`);
    await page.waitForLoadState('networkidle');

    const firstStudentLink = page.locator('a[href*="/cms/students/"]').first();
    const hasStudents = await firstStudentLink.isVisible().catch(() => false);

    if (!hasStudents) {
      test.skip(true, 'No students available to test workout auth');
      return;
    }

    // Capture 401 network responses
    const authErrors: string[] = [];
    page.on('response', (response) => {
      if (response.status() === 401) {
        authErrors.push(response.url());
      }
    });

    await firstStudentLink.click();
    await page.waitForLoadState('networkidle');

    // Click "Treinos" tab
    const treinosTab = page.locator('button', { hasText: /treinos/i });
    const hasTreinosTab = await treinosTab.isVisible().catch(() => false);

    if (hasTreinosTab) {
      await treinosTab.click();
      await page.waitForLoadState('networkidle');
      await screenshot(page, 'issue12-treinos-tab');
    } else {
      await screenshot(page, 'issue12-no-treinos-tab');
    }

    // No 401s should have been triggered
    expect(authErrors.length, `Got 401 errors: ${authErrors.join(', ')}`).toBe(0);
  });

  test('#12-B: workout detail page accessible without 401', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/students`);
    await page.waitForLoadState('networkidle');

    const firstStudentLink = page.locator('a[href*="/cms/students/"]').first();
    const hasStudents = await firstStudentLink.isVisible().catch(() => false);

    if (!hasStudents) {
      test.skip(true, 'No students to navigate workout detail');
      return;
    }

    const href = await firstStudentLink.getAttribute('href');
    const studentId = href?.split('/cms/students/')[1];

    // Capture 401 responses
    const authErrors: string[] = [];
    page.on('response', (response) => {
      if (response.status() === 401) {
        authErrors.push(response.url());
      }
    });

    await firstStudentLink.click();
    await page.waitForLoadState('networkidle');

    // Look for any workout link on the student detail page
    const workoutLink = page.locator(`a[href*="/workouts/"]`).first();
    const hasWorkout = await workoutLink.isVisible().catch(() => false);

    if (hasWorkout) {
      await workoutLink.click();
      await page.waitForLoadState('networkidle');
      await screenshot(page, 'issue12-workout-detail');
      await expect(page.locator('main')).toBeVisible();
    } else {
      await screenshot(page, 'issue12-no-workouts-yet');
      console.log(`Student ${studentId} has no workouts – auth check limited to list/detail load`);
    }

    expect(authErrors.length, `Got 401 errors: ${authErrors.join(', ')}`).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Issue #13: Stripe Webhook route existence + finances page
// ─────────────────────────────────────────────────────────────

test.describe('Issue #13: Stripe Webhook and Finances page', () => {
  test('#13-A: /api/stripe/webhook route exists (returns 400 without valid payload, not 404)', async ({ page }) => {
    // A GET request to a POST-only endpoint should return 405 (Method Not Allowed) or 400.
    // 404 would mean the route doesn't exist at all.
    const response = await page.request.post(`${BASE_URL}/api/stripe/webhook`, {
      headers: { 'Content-Type': 'application/json' },
      data: '{}',
    });

    // Should NOT be 404 (route missing). 400 or 500 is expected (bad signature).
    expect(response.status(), `Webhook endpoint returned unexpected status`).not.toBe(404);
    console.log(`Webhook endpoint responded with status: ${response.status()}`);
  });

  test('#13-B: finances page loads without error', async ({ page }) => {
    await loginWithCredentials(page);

    await page.goto(`${BASE_URL}/cms/finances`);
    await page.waitForLoadState('networkidle');
    await screenshot(page, 'issue13-finances-page');

    await expect(page.locator('main')).toBeVisible();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('500 Internal Server Error');
  });
});

// ─────────────────────────────────────────────────────────────
// Issue #14: prd-integrate-app feature
// ─────────────────────────────────────────────────────────────

test.describe('Issue #14: prd-integrate-app feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithCredentials(page);
  });

  test('#14-A: Treinos tab exists on student detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/students`);
    await page.waitForLoadState('networkidle');

    const firstStudentLink = page.locator('a[href*="/cms/students/"]').first();
    const hasStudents = await firstStudentLink.isVisible().catch(() => false);

    if (!hasStudents) {
      // Navigate directly to a student detail URL pattern to verify the page structure
      // We can still check the source code confirms the tab is there
      test.skip(true, 'No students to verify Treinos tab');
      return;
    }

    await firstStudentLink.click();
    await page.waitForLoadState('networkidle');

    // Verify "Treinos" tab is present
    const treinosTab = page.locator('button', { hasText: /treinos/i });
    await expect(treinosTab).toBeVisible();
    await screenshot(page, 'issue14-treinos-tab-visible');
  });

  test('#14-B: UploadWorkoutModal renders when triggered', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/students`);
    await page.waitForLoadState('networkidle');

    const firstStudentLink = page.locator('a[href*="/cms/students/"]').first();
    const hasStudents = await firstStudentLink.isVisible().catch(() => false);

    if (!hasStudents) {
      test.skip(true, 'No students to trigger UploadWorkoutModal');
      return;
    }

    await firstStudentLink.click();
    await page.waitForLoadState('networkidle');

    // Click "Treinos" tab first
    const treinosTab = page.locator('button', { hasText: /treinos/i });
    if (await treinosTab.isVisible().catch(() => false)) {
      await treinosTab.click();
      await page.waitForLoadState('networkidle');
    }

    // Look for an upload/add workout button
    const uploadBtn = page.locator('button', { hasText: /upload|novo treino|add workout|enviar/i }).first();
    const hasUploadBtn = await uploadBtn.isVisible().catch(() => false);

    if (hasUploadBtn) {
      await uploadBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'issue14-upload-modal-open');

      // Check the modal is visible
      const modal = page.locator('[role="dialog"], .modal, [data-modal]').first();
      const modalVisible = await modal.isVisible().catch(() => false);

      if (modalVisible) {
        await expect(modal).toBeVisible();
        console.log('UploadWorkoutModal opened successfully');
      } else {
        // Modal may use a custom overlay - check for PDF input or modal-like content
        const pdfInput = page.locator('input[accept*="pdf"]');
        const pdfInputVisible = await pdfInput.isVisible().catch(() => false);
        if (pdfInputVisible) {
          console.log('UploadWorkoutModal rendered (PDF input visible)');
        } else {
          // Look for modal overlay
          const overlay = page.locator('.fixed.inset-0, [class*="modal"], [class*="overlay"]').first();
          await expect(overlay).toBeVisible();
        }
      }
    } else {
      await screenshot(page, 'issue14-no-upload-btn-found');
      console.log('Upload button not found on student detail / treinos tab');
    }
  });

  test('#14-C: workout detail page route exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/students`);
    await page.waitForLoadState('networkidle');

    const firstStudentLink = page.locator('a[href*="/cms/students/"]').first();
    const hasStudents = await firstStudentLink.isVisible().catch(() => false);

    if (!hasStudents) {
      // Attempt a direct navigation to a fake path to check the route structure exists
      // (a 404 from Next.js means route doesn't exist, any other response is ok)
      const testUrl = `${BASE_URL}/cms/students/test-id/workouts/test-workout-id`;
      await page.goto(testUrl);
      await page.waitForLoadState('networkidle');
      await screenshot(page, 'issue14-workout-detail-route-check');

      const title = await page.title();
      // Next.js 404 page has "404" in title – or it may render a login redirect
      // The key is it should NOT say "This page could not be found" with 404
      // because that would mean the route doesn't exist in Next.js routing
      const bodyText = await page.locator('body').innerText();
      const is404PageNotFound = bodyText.includes('404') && bodyText.includes('page could not be found');
      expect(is404PageNotFound, 'Workout detail route appears to be missing from Next.js routing').toBe(false);
      return;
    }

    await firstStudentLink.click();
    await page.waitForLoadState('networkidle');

    // Click Treinos tab
    const treinosTab = page.locator('button', { hasText: /treinos/i });
    if (await treinosTab.isVisible().catch(() => false)) {
      await treinosTab.click();
      await page.waitForLoadState('networkidle');
    }

    // Try to click any workout card
    const workoutCard = page.locator('a[href*="/workouts/"]').first();
    const hasWorkout = await workoutCard.isVisible().catch(() => false);

    if (hasWorkout) {
      await workoutCard.click();
      await page.waitForLoadState('networkidle');
      await screenshot(page, 'issue14-workout-detail-page');

      // Route exists and page loads
      await expect(page.locator('main')).toBeVisible();
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('This page could not be found');
    } else {
      await screenshot(page, 'issue14-no-workouts-to-verify-detail');
      console.log('No workout cards to click – verifying route exists via direct navigation');

      // Get student ID from current URL
      const currentUrl = page.url();
      const studentIdMatch = currentUrl.match(/\/cms\/students\/([^/]+)/);
      if (studentIdMatch) {
        const studentId = studentIdMatch[1];
        await page.goto(`${BASE_URL}/cms/students/${studentId}/workouts/fake-workout-id`);
        await page.waitForLoadState('networkidle');
        await screenshot(page, 'issue14-workout-detail-route-exists');

        const bodyText = await page.locator('body').innerText();
        const isHardNotFound = bodyText.includes('page could not be found');
        expect(isHardNotFound, 'Workout detail Next.js route is missing').toBe(false);
      }
    }
  });
});
