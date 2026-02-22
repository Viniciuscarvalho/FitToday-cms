import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('CUJ 1: Authentication', () => {
  test('should display login page with all elements', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.googleButton).toBeVisible();
    await expect(loginPage.appleButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('invalid@email.com', 'wrongpassword');

    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10_000 });
  });

  test('should show validation for empty fields', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submitButton.click();

    // Form validation should prevent submission or show errors
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should navigate to register page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.registerLink.click();
    await page.waitForURL('**/register');

    expect(page.url()).toContain('/register');
  });

  test('should redirect unauthenticated user from CMS to login', async ({ page }) => {
    await page.goto('/cms');
    await page.waitForURL('**/login**', { timeout: 10_000 });

    expect(page.url()).toContain('/login');
  });

  test('should redirect unauthenticated user from admin to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/login**', { timeout: 10_000 });

    expect(page.url()).toContain('/login');
  });
});
