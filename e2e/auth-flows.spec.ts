import { test, expect } from '@playwright/test';

/**
 * @file Auth page E2E tests (Clerk).
 *
 * Sign-in runs through Clerk's hosted components, which need real Clerk keys
 * and network access — so e2e (keyless, bypass cookie set) asserts the page
 * shells instead: both routes load, show the keyless placeholder, and link to
 * each other and back home. The authenticated app shell is covered by the
 * library/reader specs via the E2E_TEST_MODE bypass.
 */
test.describe('Auth Pages', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: '__COMET_TEST_BYPASS', value: '1', domain: 'localhost', path: '/' },
    ]);
  });

  test('login page loads and links to register', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(
      page.getByText('Authentication is not configured in this environment'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /Create one now/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to home/i })).toBeVisible();
  });

  test('register page loads and links to login', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('h1')).toContainText('Create account');
    await expect(
      page.getByText('Authentication is not configured in this environment'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /^Sign in$/i })).toBeVisible();
  });

  test('should navigate from login to register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Create one now/i }).click();

    await expect(page).toHaveURL(/\/register/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Create account');
  });

  test('should navigate from register to login', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: /^Sign in$/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Sign in');
  });

  test('should navigate back to landing page from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Back to home/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('should navigate back to landing page from register', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: /Back to home/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
  });
});
