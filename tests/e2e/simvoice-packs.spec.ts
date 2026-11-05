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

test('A32NX guide is linked from its pack and renders documentation and working anchors', async ({ page, request }) => {
  await page.goto('/simvoice-packs/');
  const card = page.locator('[data-pack-filename="A32NX-FBW-Copilot-1.0.0.svcpack"]');
  const guideLink = card.getByRole('link', { name: 'Read documentation' });
  await expect(guideLink).toHaveAttribute('href', '/simvoice-packs/a32nx-fbw-copilot/');
  await expect(page.locator('[data-pack-filename="Cessna 172 G1000-1.0.0.svcpack"]')
    .getByRole('link', { name: 'Read documentation' })).toHaveCount(0);
  await guideLink.click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A32NX FBW Copilot Documentation');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.guide-meta')).toContainText('1.0.0');
  await expect(page.locator('.guide-meta')).toContainText('5 November 2026');
  await expect(page.locator('.guide-meta')).toContainText('FlyByWire A32NX');
  await expect(page.locator('.guide-content')).toContainText('a32nx_pilot_monitoring (imported)');
  await expect(page.locator('.guide-content')).not.toContainText('local JSON files');
  await expect(page.locator('.guide-content')).not.toContainText('Package files and setup');
  await expect(page.getByRole('complementary', { name: 'Important configuration limitations' }))
    .toContainText('have not been tested');
  await expect(page.locator('#voice-command-reference')).toBeVisible();
  await expect(page.locator('#troubleshooting')).toBeVisible();
  await expect(page.getByRole('link', { name: 'How to import' }))
    .toHaveAttribute('href', '/simvoice-packs/#import-instructions');
  await expect(page.locator('[data-pack-download]'))
    .toHaveAttribute('href', '/downloads/simvoice-community-packs/A32NX-FBW-Copilot-1.0.0.svcpack');
  await expect(page.locator('[data-pack-download]'))
    .toHaveAttribute('download', 'A32NX-FBW-Copilot-1.0.0.svcpack');

  const brokenAnchors = await page.locator('.guide-page a[href^="#"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')!)
      .filter((href) => !document.getElementById(decodeURIComponent(href.slice(1))))
  );
  expect(brokenAnchors).toEqual([]);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain('https://highintheflightsimsky.nl/simvoice-packs/a32nx-fbw-copilot/');
});

test('A32NX guide tables stay scrollable within a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/simvoice-packs/a32nx-fbw-copilot/');
  const tables = page.locator('.guide-content .table-scroll');
  await expect(tables).toHaveCount(9);
  await expect(tables.first()).toHaveAttribute('tabindex', '0');
  const dimensions = await page.evaluate(() => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    hasScrollableTable: Array.from(document.querySelectorAll('.table-scroll'))
      .some((table) => table.scrollWidth > table.clientWidth),
  }));
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.hasScrollableTable).toBeTruthy();
});
