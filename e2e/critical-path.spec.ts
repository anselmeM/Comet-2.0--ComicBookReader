import { test, expect } from '@playwright/test';

/**
 * @file Critical Path E2E Test
 * Verifies core landing page and redirection to login.
 * (Full auth flow requires DB/SMTP mocking usually handled in CI)
 */

test.describe('Comet Critical Flows', () => {
  test('landing page should load and show hero section', async ({ page }) => {
    await page.goto('/');

    // Check main title
    await expect(page.locator('h1')).toContainText('READ BEYOND');

    // Check call to action
    const startReading = page.getByRole('link', { name: /Start Reading/i });
    await expect(startReading).toBeVisible({ timeout: 15000 });

    // Clicking Start Reading should go to register
    await startReading.click();
    await expect(page).toHaveURL(/\/register/, { timeout: 15000 });
  });

  test('responsive layout check', async ({ page, isMobile }) => {
    await page.goto('/');

    const nav = page.locator('nav');
    if (isMobile) {
      // Mobile menu button should be present
      await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
    } else {
      // Desktop nav links should be visible
      await expect(page.getByRole('link', { name: /features/i })).toBeVisible();
    }
  });
});
