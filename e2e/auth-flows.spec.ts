import { test, expect } from '@playwright/test';

const CSRF_TOKEN = 'mock-csrf-token-value';

function mockUnauthenticatedSession(page: Parameters<typeof test>[0]) {
  return page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

function mockAuthenticatedSession(page: Parameters<typeof test>[0]) {
  return page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'user-e2e-001',
          name: 'E2E User',
          email: 'e2e@comet.test',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
  });
}

function mockCsrfEndpoint(page: Parameters<typeof test>[0]) {
  return page.route('**/api/auth/csrf', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: CSRF_TOKEN }),
    });
  });
}

function mockProvidersEndpoint(page: Parameters<typeof test>[0]) {
  return page.route('**/api/auth/providers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        credentials: { id: 'credentials', name: 'Email', type: 'credentials' },
        google: { id: 'google', name: 'Google', type: 'oauth' },
        github: { id: 'github', name: 'GitHub', type: 'oauth' },
        discord: { id: 'discord', name: 'Discord', type: 'oauth' },
      }),
    });
  });
}

function mockCredentialsCallback(page: Parameters<typeof test>[0], opts: { success: boolean }) {
  return page.route('**/api/auth/callback/credentials', async (route) => {
    if (opts.success) {
      await route.fulfill({
        status: 302,
        headers: { Location: '/library' },
      });
    } else {
      await route.fulfill({
        status: 302,
        headers: { Location: '/login?error=CredentialsSignin' },
      });
    }
  });
}

function mockRegisterEndpoint(
  page: Parameters<typeof test>[0],
  opts: { success: boolean; message?: string },
) {
  return page.route('**/api/auth/register', async (route) => {
    if (opts.success) {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          message: opts.message || 'An account with this email already exists.',
          code: 'P2002',
        }),
      });
    }
  });
}

async function setupAuthMocks(page: Parameters<typeof test>[0]) {
  await mockUnauthenticatedSession(page);
  await mockCsrfEndpoint(page);
  await mockProvidersEndpoint(page);
}

test.describe('Auth Flows', () => {
  test.describe('Login Page', () => {
    test('should load and render form elements', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/login');

      await expect(page.locator('h1')).toContainText('Welcome back');
      await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
      await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
      await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Create one now/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible();
    });

    test('should login with mocked credentials and redirect to library', async ({ page }) => {
      await setupAuthMocks(page);
      await mockCredentialsCallback(page, { success: true });

      await page.goto('/login');

      await page.getByPlaceholder('name@example.com').fill('user@comet.test');
      await page.getByPlaceholder('Enter your password').fill('valid-password-123');
      await page.getByRole('button', { name: /Sign In/i }).click();

      // The login page does window.location.href on success — verify navigation attempt
      // Wait for the hard navigation to /library to happen, or check we left the login page
      await page.waitForURL(/\/library/, { timeout: 10000 });
    });

    test('should show error message with invalid credentials', async ({ page }) => {
      await setupAuthMocks(page);
      await mockCredentialsCallback(page, { success: false });

      await page.goto('/login');

      await page.getByPlaceholder('name@example.com').fill('bad@comet.test');
      await page.getByPlaceholder('Enter your password').fill('wrong-password');
      await page.getByRole('button', { name: /Sign In/i }).click();

      await expect(page.locator('text=Invalid email or password.')).toBeVisible({ timeout: 10000 });
    });

    test('should show validation error when fields are empty', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/login');

      await page.getByRole('button', { name: /Sign In/i }).click();

      await expect(page.locator('text=Please enter both email and password.')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Register Page', () => {
    test('should load and render form elements', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/register');

      await expect(page.locator('h1')).toContainText('Create account');
      await expect(page.getByPlaceholder('What should we call you?')).toBeVisible();
      await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
      await expect(page.getByPlaceholder('Create a password')).toBeVisible();
      await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
      await expect(page.getByRole('button', { name: /Create account/i })).toBeVisible();
    });

    test('should navigate to onboarding after successful registration', async ({ page }) => {
      await setupAuthMocks(page);
      await mockRegisterEndpoint(page, { success: true });
      await mockCredentialsCallback(page, { success: true });

      await page.goto('/register');

      await page.getByPlaceholder('What should we call you?').fill('New User');
      await page.getByPlaceholder('name@example.com').fill('new@comet.test');
      await page.getByPlaceholder('Create a password').fill('ValidPass123!@#');
      await page.getByPlaceholder('Confirm your password').fill('ValidPass123!@#');
      await page.getByRole('button', { name: /Create account/i }).click();

      await expect(page).toHaveURL(/\/onboarding/, { timeout: 15000 });
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/register');

      await page.getByPlaceholder('What should we call you?').fill('Test');
      await page.getByPlaceholder('name@example.com').fill('test@comet.test');
      await page.getByPlaceholder('Create a password').fill('ValidPass123!@#');
      await page.getByPlaceholder('Confirm your password').fill('DifferentPass456!@#');
      await page.getByRole('button', { name: /Create account/i }).click();

      await expect(page.locator('text=Passwords do not match. Please try again.')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should show validation error with weak password', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/register');

      await page.getByPlaceholder('What should we call you?').fill('Test');
      await page.getByPlaceholder('name@example.com').fill('test@comet.test');
      await page.getByPlaceholder('Create a password').fill('short');
      await page.getByPlaceholder('Confirm your password').fill('short');
      await page.getByRole('button', { name: /Create account/i }).click();

      await expect(
        page.locator('text=Please ensure your password meets all requirements.'),
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show password requirement checklist when typing', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/register');

      await page.getByPlaceholder('Create a password').fill('test');

      await expect(page.locator('text=Password must contain:')).toBeVisible();
      await expect(page.locator('text=12+ characters')).toBeVisible();
      await expect(page.locator('text=Uppercase letter')).toBeVisible();
      await expect(page.locator('text=Lowercase letter')).toBeVisible();
      await expect(page.locator('text=Number')).toBeVisible();
      await expect(page.locator('text=Special character')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate from login to register', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/login');
      await page.getByRole('link', { name: /Create one now/i }).click();

      await expect(page).toHaveURL(/\/register/, { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Create account');
    });

    test('should navigate from register to login', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/register');
      await page.getByRole('link', { name: /Sign in/i }).click();

      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      await expect(page.locator('h1')).toContainText('Welcome back');
    });

    test('should navigate to forgot-password page', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/login');
      await page.getByRole('link', { name: /Forgot password/i }).click();

      await expect(page).toHaveURL(/\/forgot-password/, { timeout: 10000 });
    });

    test('should navigate back to landing page from login', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/login');
      await page.getByRole('link', { name: /Back to home/i }).click();

      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    test('should navigate back to landing page from register', async ({ page }) => {
      await setupAuthMocks(page);

      await page.goto('/register');
      await page.getByRole('link', { name: /Back to home/i }).click();

      await expect(page).toHaveURL('/', { timeout: 10000 });
    });
  });
});
