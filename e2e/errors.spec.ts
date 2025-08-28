import { test, expect } from '@playwright/test';

test.describe('Error Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome back, testuser!')).toBeVisible();
  });

  test('should browse errors', async ({ page }) => {
    await page.goto('/errors');

    // Check page structure
    await expect(page.getByRole('heading', { name: 'Error Database' })).toBeVisible();
    await expect(page.getByPlaceholder('Search errors...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Filter' })).toBeVisible();

    // Check error list
    await expect(page.getByRole('row')).toHaveCount(2); // Header + at least one error
    await expect(page.getByText('ERR001')).toBeVisible();
    await expect(page.getByText('Test Error 1')).toBeVisible();
  });

  test('should view error details', async ({ page }) => {
    await page.goto('/errors');

    // Click on first error
    await page.getByText('ERR001').first().click();

    // Should navigate to error detail page
    await expect(page).toHaveURL(/.*errors\/\d+/);
    await expect(page.getByText('Error Details')).toBeVisible();
    await expect(page.getByText('ERR001')).toBeVisible();
    await expect(page.getByText('Test Error 1')).toBeVisible();

    // Check solutions section
    await expect(page.getByRole('heading', { name: 'Solutions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Solution' })).toBeVisible();
  });

  test('should search errors', async ({ page }) => {
    await page.goto('/errors');

    // Search for specific error
    await page.getByPlaceholder('Search errors...').fill('ERR001');
    await page.getByRole('button', { name: 'Search' }).click();

    // Should show filtered results
    await expect(page.getByText('ERR001')).toBeVisible();
    await expect(page.getByText('Test Error 1')).toBeVisible();
    
    // Other errors should not be visible
    const errorCount = await page.getByText('ERR00').count();
    expect(errorCount).toBe(1);
  });

  test('should create new error', async ({ page }) => {
    await page.goto('/errors');

    // Click create button
    await page.getByRole('button', { name: 'Add Error' }).click();

    // Fill error form
    await page.getByLabel('Error Code').fill('TEST123');
    await page.getByLabel('Error Message').fill('Test error message');
    await page.getByLabel('Description').fill('This is a test error description');
    await page.getByLabel('Application').selectOption({ label: 'Test Application' });

    // Submit form
    await page.getByRole('button', { name: 'Create Error' }).click();

    // Should show success message and redirect
    await expect(page.getByText('Error created successfully')).toBeVisible();
    await expect(page).toHaveURL(/.*errors\/\d+/);
    await expect(page.getByText('TEST123')).toBeVisible();
  });

  test('should add solution to error', async ({ page }) => {
    await page.goto('/errors/1');

    // Click add solution button
    await page.getByRole('button', { name: 'Add Solution' }).click();

    // Fill solution form
    await page.getByLabel('Solution').fill('This is a test solution');
    
    // Submit form
    await page.getByRole('button', { name: 'Submit Solution' }).click();

    // Should show success message and display solution
    await expect(page.getByText('Solution added successfully')).toBeVisible();
    await expect(page.getByText('This is a test solution')).toBeVisible();
  });

  test('should vote on solution', async ({ page }) => {
    await page.goto('/errors/1');

    // Find first solution and click upvote
    const solution = page.locator('[data-testid="solution"]').first();
    const upvoteButton = solution.getByRole('button', { name: 'Upvote' });
    
    await upvoteButton.click();

    // Should update vote count
    await expect(solution.getByText('1')).toBeVisible();
  });
});