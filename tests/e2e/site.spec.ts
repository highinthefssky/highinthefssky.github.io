import { expect, test } from '@playwright/test';

test('home page navigates to videos @smoke', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1.hero-title')).toHaveText('High in the FlightSim Sky');

  await page.getByRole('link', { name: 'Browse Video Library' }).click();
  await expect(page).toHaveURL(/\/videos\/?$/);
  await expect(page.getByRole('heading', { name: 'Video Library' })).toBeVisible();
});

test('video library search and favorites work @smoke', async ({ page }) => {
  await page.goto('/videos/');

  const firstTitle = await page.locator('.video-card .card-title').first().textContent();
  expect(firstTitle).toBeTruthy();

  const searchInput = page.getByPlaceholder('Search videos (e.g. title:landing, description:IFR, navigation tutorial)');
  await searchInput.fill(`title:${firstTitle}`);

  await expect(page.locator('#result-count')).toContainText(/video/);
  await expect(page.locator('.video-card:visible')).toHaveCount(1);

  const firstCard = page.locator('.video-card').first();
  await firstCard.hover();
  const firstFavorite = firstCard.locator('.fav-btn');
  await firstFavorite.click({ force: true });
  await expect(firstFavorite).toHaveClass(/saved/);
});

test('saved favorites persist to favorites page @smoke', async ({ page }) => {
  await page.goto('/videos/');

  const initialFavoriteCount = await page.locator('.video-card').count();
  expect(initialFavoriteCount).toBeGreaterThan(0);

  const firstCard = page.locator('.video-card').first();
  const title = await firstCard.locator('.card-title').textContent();
  await firstCard.hover();
  await firstCard.locator('.fav-btn').click({ force: true });

  await page.goto('/favorites/');
  await expect(page).toHaveURL(/\/favorites\/?$/);
  await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Saved Videos' })).toBeVisible();
  await expect(page.locator('#fav-videos-grid')).toContainText(title || '');
});