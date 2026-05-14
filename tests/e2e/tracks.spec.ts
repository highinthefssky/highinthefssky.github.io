import { expect, test } from '@playwright/test';

test('tracks index opens a track detail page', async ({ page }) => {
  await page.goto('/tracks/');

  await expect(page.getByRole('heading', { name: /Learning Tracks/i })).toBeVisible();

  const firstTrack = page.locator('a.track-card').first();
  await expect(firstTrack).toBeVisible();
  await firstTrack.click();

  await expect(page).toHaveURL(/\/tracks\/[^/]+\/?$/);
  await expect(page.locator('.track-detail-page')).toBeVisible();
  await expect(page.locator('.lesson-card').first()).toBeVisible();
});

test('track progress updates when lesson is completed', async ({ page }) => {
  await page.goto('/tracks/');

  const firstTrack = page.locator('a.track-card').first();
  await firstTrack.click();

  const progressText = page.locator('#track-progress-text');
  await expect(progressText).toContainText(/0\//);

  const firstCheckbox = page.locator('.lesson-checkbox').first();
  await firstCheckbox.check();

  await expect(progressText).toContainText(/1\//);
});

test('invalid track slug returns 404', async ({ page }) => {
  const response = await page.goto('/tracks/not-a-real-track-404-test/');
  expect(response?.status()).toBe(404);
});
