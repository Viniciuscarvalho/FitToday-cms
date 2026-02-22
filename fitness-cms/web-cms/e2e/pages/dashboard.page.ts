import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('aside');
    this.mainContent = page.locator('main');
  }

  async goto() {
    await this.page.goto('/cms');
  }

  async navigateTo(section: 'programs' | 'students' | 'messages' | 'analytics' | 'finances' | 'settings') {
    await this.page.goto(`/cms/${section}`);
    await this.page.waitForLoadState('networkidle');
  }
}
