import { expect, test } from '@playwright/test';

test('community packs page lists the pack and official import workflow', async ({ page }) => {
  await page.goto('/simvoice-packs/');

  await expect(page.getByRole('heading', { name: '🎙️ SimVoice Copilot Community Packs' })).toBeVisible();
  const pack = page.locator('[data-pack-filename="Cessna 172 G1000-1.0.0.svcpack"]');
  await expect(pack).toBeVisible();
  await expect(pack).toContainText('SimVoice Copilot 1.1.6.0 or newer');
  await expect(pack).toContainText('MSFS 2020 / MSFS 2024');

  const instructions = page.locator('#import-instructions');
  await expect(instructions).toContainText('Community Packs');
  await expect(instructions).toContainText('Import');
  await expect(instructions).toContainText('Import Pack');
  await expect(instructions).toContainText('does not overwrite an existing profile');
});

test('community pack download is served unchanged', async ({ page, request }) => {
  await page.goto('/simvoice-packs/');

  const download = page.locator('[data-pack-download]');
  await expect(download).toHaveAttribute(
    'href',
    '/downloads/simvoice-community-packs/Cessna%20172%20G1000-1.0.0.svcpack'
  );
  await expect(download).toHaveAttribute('download', 'Cessna 172 G1000-1.0.0.svcpack');

  const response = await request.get(await download.getAttribute('href') as string);
  expect(response.ok()).toBeTruthy();
  expect((await response.body()).length).toBe(5701);
});
