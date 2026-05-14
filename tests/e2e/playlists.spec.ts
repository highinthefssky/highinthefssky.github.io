import { expect, test } from '@playwright/test';

test('playlists index opens a playlist detail page', async ({ page }) => {
  await page.goto('/playlists/');

  await expect(page.getByRole('heading', { name: 'Playlists' })).toBeVisible();

  const firstPlaylist = page.locator('a.playlist-card').first();
  await expect(firstPlaylist).toBeVisible();
  await firstPlaylist.click();

  await expect(page).toHaveURL(/\/playlists\/[^/]+\/?$/);
  await expect(page.locator('#playlist-player')).toBeVisible();
  const sidebarItems = page.locator('#sidebar-list .sidebar-item');
  await expect(sidebarItems.first()).toBeVisible();
});

test('invalid playlist slug returns 404', async ({ page }) => {
  const response = await page.goto('/playlists/not-a-real-playlist-404-test/');
  expect(response?.status()).toBe(404);
});
