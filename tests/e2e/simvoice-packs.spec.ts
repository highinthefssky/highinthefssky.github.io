import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('community packs page lists the pack and official import workflow', async ({ page }) => {
  await page.goto('/simvoice-packs/');

  await expect(page.getByRole('heading', { name: '🎙️ SimVoice Copilot Community Packs' })).toBeVisible();
  const pack = page.locator('[data-pack-filename="Cessna 172 G1000-1.0.0.svcpack"]');
  await expect(pack).toBeVisible();
  await expect(pack).toContainText('SimVoice Copilot 1.1.6.0 or newer');
  await expect(pack).toContainText('MSFS 2020 / MSFS 2024');

  const a32nxPack = page.locator('[data-pack-filename="A32NX-FBW-Copilot-1.0.0.svcpack"]');
  await expect(a32nxPack).toBeVisible();
  await expect(a32nxPack).toContainText('SimVoice Copilot 1.1.20.0 or newer');
  await expect(a32nxPack).toContainText('FlyByWire A32NX');
  await expect(a32nxPack).toContainText('MSFS 2020 / MSFS 2024');
  await expect(page.locator('.header-meta')).toContainText('2 community packs');
  await expect(page.locator('#tools-dropdown a[data-link="/simvoice-packs"]')).toHaveText('🎙️ SimVoice Copilot');
  await expect(page.locator('footer a[href="/simvoice-packs"]')).toHaveText('SimVoice Copilot');

  const instructions = page.locator('#import-instructions');
  await expect(instructions).toContainText('Community Packs');
  await expect(instructions).toContainText('Import');
  await expect(instructions).toContainText('Import Pack');
  await expect(instructions).toContainText('does not overwrite an existing profile');
});

test('community pack download is served unchanged', async ({ page, request }) => {
  await page.goto('/simvoice-packs/');

  const download = page.locator('[data-pack-filename="Cessna 172 G1000-1.0.0.svcpack"] [data-pack-download]');
  await expect(download).toHaveAttribute(
    'href',
    '/downloads/simvoice-community-packs/Cessna%20172%20G1000-1.0.0.svcpack'
  );
  await expect(download).toHaveAttribute('download', 'Cessna 172 G1000-1.0.0.svcpack');

  const response = await request.get(await download.getAttribute('href') as string);
  expect(response.ok()).toBeTruthy();
  expect((await response.body()).length).toBe(5701);
});

test('A32NX community pack download matches the selected source file', async ({ page, request }) => {
  await page.goto('/simvoice-packs/');

  const download = page.locator('[data-pack-filename="A32NX-FBW-Copilot-1.0.0.svcpack"] [data-pack-download]');
  await expect(download).toHaveAttribute(
    'href',
    '/downloads/simvoice-community-packs/A32NX-FBW-Copilot-1.0.0.svcpack'
  );
  await expect(download).toHaveAttribute('download', 'A32NX-FBW-Copilot-1.0.0.svcpack');

  const response = await request.get(await download.getAttribute('href') as string);
  expect(response.ok()).toBeTruthy();
  const source = await readFile(new URL('../../src/content/simvoice-packs/A32NX-FBW-Copilot-1.0.0.svcpack', import.meta.url));
  expect((await response.body()).equals(source)).toBeTruthy();
});
