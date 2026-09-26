import { expect, test } from '@playwright/test';
import { rankMatches, scoreConfig, scoreVideo } from '../../src/lib/controllerMatches';
import { readFileSync, readdirSync } from 'node:fs';

async function chooseWizard(page: import('@playwright/test').Page) {
  await page.getByRole('combobox', { name: 'Controller', exact: true }).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'General Aviation', exact: true }).click();
  await page.getByRole('button', { name: 'Quick setup', exact: true }).click();
}

test('wizard restricts XML matches to selected hardware and avoids substring keyword matches', () => {
  const selected = { controller: 'T16000M', aircraftType: 'general', goal: 'navigation' };
  const config = { controller: 'Other device', aircraft: 'General Aviation', settingsType: 'General Controls', tags: ['IFR'], description: '' };
  expect(scoreConfig(config, selected)).toBe(0);
  expect(scoreConfig({ ...config, controller: 't16000m' }, selected)).toBeGreaterThan(10);
  expect(scoreVideo({ title: 'Start your garage tour', description: '', tags: [], publishedAt: '2026-01-01' }, selected)).toBe(0);
});

test('wizard ranks older relevant videos beyond the former 700-video cutoff', () => {
  const recent = Array.from({ length: 701 }, (_, index) => ({ title: `Unrelated video ${index}`, description: '', tags: [], publishedAt: '2026-01-01' }));
  const older = { title: 'T16000M Cessna IFR tutorial', description: 'VOR navigation', tags: [], publishedAt: '2020-01-01' };
  const results = rankMatches([], [...recent, older], { controller: 'T16000M', aircraftType: 'general', goal: 'navigation' });
  expect(results.videos.map(({ video }) => video.title)).toEqual([older.title]);
});

test('wizard HTML and all recommendation responses remain small', () => {
  const html = readFileSync('dist/controllers/wizard/index.html', 'utf8');
  expect(Buffer.byteLength(html)).toBeLessThan(50_000);
  expect(html).not.toContain('videosForWizard');
  const files = readdirSync('dist/controllers/matches');
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const body = readFileSync(`dist/controllers/matches/${file}`, 'utf8');
    expect(Buffer.byteLength(body)).toBeLessThan(12_000);
    const data = JSON.parse(body);
    expect(data.configs.length).toBeLessThanOrEqual(6);
    expect(data.videos.length).toBeLessThanOrEqual(8);
    expect(new Set(data.configs.map((entry: { config: { controller: string } }) => entry.config.controller)).size).toBeLessThanOrEqual(1);
    expect(body).not.toContain('"description":');
  }
});

test('wizard fetches only on demand and links to matching profile import pages', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => { if (request.url().includes('/controllers/matches/')) requests.push(request.url()); });
  await page.goto('/controllers/wizard/');
  await chooseWizard(page);
  expect(requests).toEqual([]);
  const selected = await page.locator('#wizard-controller').inputValue();
  await page.getByRole('button', { name: 'Find my best matches', exact: true }).click();
  await expect(page.locator('#wizard-results')).toBeVisible();
  expect(requests).toHaveLength(1);
  await expect(page.locator('#video-results .result-card').first()).toHaveCSS('display', 'grid');
  await expect(page.locator('.result-brand-feature img')).toHaveCSS('height', '16px');
  await expect(page.locator('#config-results .result-card').first()).toHaveCSS('padding', '12.8px');
  const names = await page.locator('#config-results h4').allTextContents();
  expect(names.length).toBeGreaterThan(0);
  expect(names.every((name) => name === selected)).toBe(true);
  await page.locator('#config-results a').first().click();
  await expect(page).toHaveURL(/\/controllers\/download\/xml\//);
  await expect(page.getByRole('heading', { name: selected, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Before Importing' })).toBeVisible();
  const instructions = page.getByRole('region', { name: 'Import in MSFS 2024' });
  await expect(instructions).toBeVisible();
  await expect(instructions.locator('ol li')).toHaveCount(4);
  await expect(instructions).toContainText('Settings > Controls');
  await expect(instructions).toContainText('same controller');
  await expect(instructions).toContainText('General Controls, Airplane Controls, or Helicopter Controls');
  await expect(instructions).toContainText('outside the simulator installation directory');
  await expect(instructions.locator('code')).toHaveText(await page.locator('#profile-filename').innerText());
  await expect(instructions.getByRole('link')).toHaveAttribute('href', 'https://flightsimulator.zendesk.com/hc/en-us/articles/21862909046428-How-to-Export-and-Import-your-controller-profiles');
  await expect(page.locator('main')).not.toContainText('placeholder tutorial');
});

test('wizard retries failed recommendations and discards pending results on reset', async ({ page }) => {
  let attempts = 0;
  await page.route('**/controllers/matches/*.json', async (route) => {
    attempts++;
    if (attempts === 1) await route.fulfill({ status: 503, body: 'Unavailable' });
    else await route.continue();
  });
  await page.goto('/controllers/wizard/');
  await chooseWizard(page);
  await page.locator('#wizard-run').click();
  await expect(page.locator('#wizard-status')).toContainText('could not be loaded');
  await page.getByRole('button', { name: 'Retry matches', exact: true }).click();
  await expect(page.locator('#wizard-results')).toBeVisible();
  expect(attempts).toBe(2);

  let release!: () => void;
  let entered!: () => void;
  const enteredPromise = new Promise<void>((resolve) => { entered = resolve; });
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/controllers/matches/*--landing.json', async (route) => {
    entered();
    await pending;
    await route.fulfill({ json: { configs: [], videos: [] } });
  });
  await page.getByRole('button', { name: 'Takeoff & landing', exact: true }).click();
  await page.locator('#wizard-run').click();
  await enteredPromise;
  await expect(page.locator('#wizard-run')).toBeDisabled();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  release();
  await expect(page.locator('#wizard-results')).toBeHidden();
  await expect(page.locator('#wizard-status')).toHaveText('');
  await expect(page.locator('#wizard-controller')).toHaveValue('');
});

for (const kind of ['xml', 'preset']) {
  test(`${kind} profile downloads preserve filename and file bytes`, async ({ page }) => {
    await page.goto('/controllers/');
    if (kind === 'xml') await page.locator('.config-card .btn-download').first().click();
    else await page.locator('[data-profile-filename]').first().click();
    const button = page.locator('#profile-download');
    const filename = await button.getAttribute('data-filename');
    const source = await button.getAttribute('data-url');
    const body = kind === 'xml' ? '<?xml version="1.0"?><Version Num="1"/><Profile><Name>Test &amp; verify</Name></Profile>' : '{"profile":"test","strength":25}';
    await page.route(source!, (route) => route.fulfill({ status: 200, contentType: kind === 'xml' ? 'application/xml' : 'application/octet-stream', body, headers: { 'access-control-allow-origin': '*' } }));
    const downloading = page.waitForEvent('download');
    await button.click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(filename);
    expect(readFileSync((await download.path())!, 'utf8')).toBe(body);
    await expect(page.locator('#download-status')).toContainText('Download started');
    await expect(page.locator('#profile-source')).toHaveAttribute('href', source!);
    if (kind === 'preset') await expect(page.getByRole('heading', { name: 'Import in Moza Cockpit' })).toBeVisible();
    const sitemap = await page.request.get('/sitemap.xml');
    expect(await sitemap.text()).toContain(new URL(page.url()).pathname);
  });
}

test('HTML error response leaves a retry and original-file fallback without a download', async ({ page }) => {
  await page.goto('/controllers/');
  await page.locator('.config-card .btn-download').first().click();
  const source = await page.locator('#profile-download').getAttribute('data-url');
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.route(source!, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html>File unavailable</html>', headers: { 'access-control-allow-origin': '*' } }));
  await page.locator('#profile-download').click();
  await expect(page.locator('#download-status')).toContainText('could not be downloaded');
  await expect(page.getByRole('button', { name: 'Retry download' })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Open original file' })).toBeVisible();
  expect(downloads).toBe(0);
});

test('profile instructions and fallback work without JavaScript at mobile width', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await page.goto(new URL('/controllers/download/preset/ab6-a320-msfs2024/', baseURL).href);
  await expect(page.locator('#profile-download')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Open original file' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import in Moza Cockpit' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('airliner preset keeps aircraft and goal when hardware is chosen later', async ({ page }) => {
  await page.goto('/controllers/wizard?aircraft=airliner&goal=airliner-ops');
  await page.getByRole('combobox', { name: 'Controller', exact: true }).selectOption({ index: 1 });
  await expect(page.getByRole('button', { name: 'Airliner', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Airliner ops', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#wizard-run')).toBeEnabled();
  await expect(page.locator('#wizard-results')).toBeHidden();
});

test('wizard result cards fit a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/controllers/wizard/');
  await chooseWizard(page);
  await page.locator('#wizard-run').click();
  await expect(page.locator('#wizard-results')).toBeVisible();
  await expect(page.locator('.result-brand-feature img')).toHaveCSS('height', '16px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});