import { expect, test } from '@playwright/test';

test('main navigation links are accessible by role', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Videos' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Playlists' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact' }).first()).toBeVisible();
});

test('keyboard can focus video search input using slash shortcut', async ({ page }) => {
  await page.goto('/videos/');

  await page.keyboard.press('/');
  await expect(page.locator('#search-input')).toBeFocused();
});
