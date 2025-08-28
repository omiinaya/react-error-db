import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the home page with statistics', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Error Database/);

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Welcome to Error Database' })).toBeVisible();

    // Check statistics cards
    await expect(page.getByText('Total Errors')).toBeVisible();
    await expect(page.getByText('Total Solutions')).toBeVisible();
    await expect(page.getByText('Total Users')).toBeVisible();

    // Check search functionality
    await expect(page.getByPlaceholder('Search error codes or messages...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();

    // Check navigation links
    await expect(page.getByRole('link', { name: 'Browse Errors' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contribute Solution' })).toBeVisible();

    // Check recent errors section
    await expect(page.getByRole('heading', { name: 'Recent Errors' })).toBeVisible();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/');

    // Fill search input and submit
    await page.getByPlaceholder('Search error codes or messages...').fill('test error');
    await page.getByRole('button', { name: 'Search' }).click();

    // Should navigate to search page with query
    await expect(page).toHaveURL(/.*search.*/);
    await expect(page.getByText('Search Results for "test error"')).toBeVisible();
  });

  test('should navigate to errors page', async ({ page }) => {
    await page.goto('/');

    // Click browse errors link
    await page.getByRole('link', { name: 'Browse Errors' }).click();

    // Should navigate to errors page
    await expect(page).toHaveURL(/.*errors.*/);
    await expect(page.getByRole('heading', { name: 'Error Database' })).toBeVisible();
  });
});