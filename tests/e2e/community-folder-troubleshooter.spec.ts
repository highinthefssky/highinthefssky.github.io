import { expect, test } from '@playwright/test';

test('community folder troubleshooter page loads', async ({ page }) => {
  await page.goto('/tools/community-folder-troubleshooter');

  await expect(page.getByRole('heading', { name: 'Community Folder Troubleshooter' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scan Results' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Troubleshooting Steps' })).toBeVisible();
});
