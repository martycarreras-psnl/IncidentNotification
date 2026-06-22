import { test, expect } from '@playwright/test';

test.describe('IRMA — E2E smoke', () => {
  test('loads the dashboard shell', async ({ page }) => {
    await page.goto('/');
    // HashRouter redirects "/" -> "#/dashboard"
    await expect(page.getByRole('heading', { name: 'Safety Dashboard' })).toBeVisible();
    await expect(page.getByText('IRMA').first()).toBeVisible();
  });

  test('navigates to the incidents list', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'All Incidents' }).click();
    await expect(page.getByRole('heading', { name: 'Incidents' })).toBeVisible();
  });

  test('opens the new incident form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'New Incident' }).click();
    await expect(page.getByRole('heading', { name: 'New incident' })).toBeVisible();
  });

  test('shows the specialty reference page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Specialty Tags' }).click();
    await expect(page.getByRole('heading', { name: 'Specialty Tags' })).toBeVisible();
  });
});
