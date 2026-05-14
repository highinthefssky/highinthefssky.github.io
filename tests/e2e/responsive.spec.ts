import { expect, test } from '@playwright/test';

test.describe('mobile responsive smoke', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('home page renders on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1.hero-title')).toBeVisible();
    await expect(page.locator('.navbar-menu')).toBeVisible();
  });

  test('videos page renders and search is usable on mobile', async ({ page }) => {
    await page.goto('/videos/');

    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('IFR');
    await expect(page.locator('#result-count')).toContainText(/video/i);
  });
});
