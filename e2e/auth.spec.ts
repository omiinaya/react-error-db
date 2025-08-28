import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should register a new user', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.getByLabel('Email').fill(`test${Date.now()}@example.com`);
    await page.getByLabel('Username').fill(`testuser${Date.now()}`);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // Submit form
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should redirect to home page with success message
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Account created successfully')).toBeVisible();
  });

  test('should login with existing user', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');

    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect to home page with welcome message
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Welcome back, testuser!')).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login');

    // Fill login form with invalid credentials
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');

    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should logout user', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Wait for login to complete
    await expect(page.getByText('Welcome back, testuser!')).toBeVisible();

    // Click logout
    await page.getByRole('button', { name: 'Logout' }).click();

    // Should redirect to home page and show logout message
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Logged out successfully')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('should navigate between auth pages', async ({ page }) => {
    await page.goto('/login');

    // Click register link
    await page.getByRole('link', { name: 'Create an account' }).click();
    await expect(page).toHaveURL('/register');

    // Click login link
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/login');
  });
});