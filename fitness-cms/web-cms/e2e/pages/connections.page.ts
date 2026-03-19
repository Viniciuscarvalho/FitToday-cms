import { Page, Locator } from '@playwright/test';

export class ConnectionsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/cms/connections');
    await this.page.waitForLoadState('networkidle');
  }

  // Tab selectors
  tab(label: string): Locator {
    return this.page.locator(`button, [role="tab"]`).filter({ hasText: label });
  }

  // Connection cards
  get connectionCards(): Locator {
    return this.page.locator('[data-testid="connection-card"], .connection-card, [class*="connection"]').first();
  }

  // Action buttons
  acceptButton(index = 0): Locator {
    return this.page.locator('button').filter({ hasText: /aceitar|accept/i }).nth(index);
  }

  rejectButton(index = 0): Locator {
    return this.page.locator('button').filter({ hasText: /recusar|rejeitar|reject/i }).nth(index);
  }

  cancelButton(index = 0): Locator {
    return this.page.locator('button').filter({ hasText: /cancelar|cancel/i }).nth(index);
  }

  // Empty state
  get emptyState(): Locator {
    return this.page.locator('text=/nenhum|no connections|sem solicitações/i');
  }

  // Student name in connection
  studentName(name: string): Locator {
    return this.page.locator(`text=${name}`);
  }
}
