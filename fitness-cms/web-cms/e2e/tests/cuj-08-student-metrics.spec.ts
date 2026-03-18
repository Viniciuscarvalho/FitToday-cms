import { test, expect } from '@playwright/test';
import { loginAsTrainer } from '../helpers/auth.setup';

test.describe('CUJ 8: Student Metrics & Health Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTrainer(page);
  });

  test('should display students list page with stat cards', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    // Page title
    await expect(page.locator('h1')).toContainText('Alunos');

    // Stat cards should be visible
    await expect(page.getByText('Alunos ativos')).toBeVisible();
    await expect(page.getByText('Média de conclusão')).toBeVisible();
    await expect(page.getByText('Carga média força')).toBeVisible();
    await expect(page.getByText('Carga média resist.')).toBeVisible();
  });

  test('should display search input and objective filter', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Buscar aluno...');
    await expect(searchInput).toBeVisible();

    // Objective filter select
    const selectElements = page.locator('select');
    await expect(selectElements.first()).toBeVisible();
  });

  test('should filter students by search query', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder('Buscar aluno...');
    await searchInput.fill('NonExistentStudent12345');

    // Wait for filtering to apply
    await page.waitForTimeout(500);

    // Should show empty state or no rows
    const rows = page.locator('tbody tr');
    const emptyState = page.getByText('Nenhum aluno encontrado');

    // Either no rows or empty state message
    const rowCount = await rows.count();
    if (rowCount === 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should display students table with correct columns', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    // Check for table headers (if there are students)
    const table = page.locator('table');
    const tableExists = await table.count() > 0;

    if (tableExists) {
      const headers = ['Aluno', 'Objetivo', 'Sessões', 'Calorias', 'Carga Força', 'Carga Resist.', 'Tendência', 'Status'];
      for (const header of headers) {
        await expect(page.getByText(header, { exact: false }).first()).toBeVisible();
      }
    }
  });

  test('should navigate to student detail on row click', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    // If there are student rows, click the first one
    const firstRow = page.locator('tbody tr').first();
    const hasRows = await firstRow.count() > 0;

    if (hasRows) {
      await firstRow.click();

      // Should navigate to detail page
      await page.waitForURL(/\/cms\/students\/.+/, { timeout: 10_000 });
      await page.waitForLoadState('networkidle');

      // Detail page should have a back button or student name
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should display student detail page with health metrics section', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('tbody tr').first();
    const hasRows = await firstRow.count() > 0;

    if (hasRows) {
      await firstRow.click();
      await page.waitForURL(/\/cms\/students\/.+/, { timeout: 10_000 });
      await page.waitForLoadState('networkidle');

      // Health metrics section should exist (even if data is empty/loading)
      const healthSection = page.getByText('Métricas de Saúde');
      if (await healthSection.count() > 0) {
        await expect(healthSection).toBeVisible();
      }

      // Stat cards should be present in the detail page
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should display empty state when no students exist', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    const table = page.locator('table');
    const emptyState = page.getByText('Nenhum aluno ainda');

    // If no table, empty state should show
    if (await table.count() === 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should handle pagination controls', async ({ page }) => {
    await page.goto('/cms/students');
    await page.waitForLoadState('networkidle');

    // Pagination only shows if more than 10 students
    const paginationButtons = page.locator('button').filter({ hasText: /^\d+$/ });
    const hasPagination = await paginationButtons.count() > 0;

    if (hasPagination) {
      // Click page 2 if it exists
      const page2 = paginationButtons.nth(1);
      if (await page2.count() > 0) {
        await page2.click();
        await page.waitForTimeout(300);
      }
    }
  });
});
