import { expect, test } from '@playwright/test';
import { serializeJson } from '../../src/utils/serializeJson';
import config from '../../astro.config.mjs';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

test('embedded JSON cannot terminate its script element and round-trips metadata', async ({ page }) => {
  const metadata = { title: '</ScRiPt><img src=x onerror="window.injected=true">', text: '<!-- & " \u2028' };
  const serialized = serializeJson(metadata);
  expect(serialized).not.toContain('<');
  expect(JSON.parse(serialized)).toEqual(metadata);
  expect(() => serializeJson(undefined)).toThrow(TypeError);
  await page.setContent(`<script id="data" type="application/ld+json">${serialized}</script>`);
  await expect(page.locator('img')).toHaveCount(0);
  expect(await page.locator('#data').evaluate((element) => JSON.parse(element.textContent!))).toEqual(metadata);
});

test('configured Markdown pipeline removes active content while preserving prose and images', async ({ page }) => {
  const processor = config.markdown!.processor!;
  const renderer = await createMarkdownProcessor({
    ...processor.options,
    syntaxHighlight: false,
  });
  const result = await renderer.render([
    '# Community update',
    '',
    '**Safe formatting** and [a safe link](https://www.youtube.com/).',
    '[unsafe Markdown link](javascript:window.injected=true)',
    '',
    '<script>window.injected=true</script>',
    '<img src="https://i.ytimg.com/example.jpg" onerror="window.injected=true">',
    '<a href="javascript:window.injected=true">unsafe link</a>',
    '',
    '![](https://i.ytimg.com/another.jpg)',
  ].join('\n'));
  await page.setContent(result.code);
  await expect(page.locator('script, [onerror], a[href^="javascript:"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Community update' })).toBeVisible();
  await expect(page.locator('strong')).toHaveText('Safe formatting');
  await expect(page.getByRole('link', { name: 'a safe link' })).toHaveAttribute('href', 'https://www.youtube.com/');
  await expect(page.locator('img')).toHaveCount(1);
  await expect(page.locator('img')).toHaveAttribute('src', 'https://i.ytimg.com/another.jpg');
});

for (const thumbnail of ['https://example.invalid/" onerror="window.injected=true', 'javascript:window.injected=true']) {
  test(`wizard safely handles thumbnail ${thumbnail}`, async ({ page }) => {
    await page.route('**/controllers/matches/*.json', (route) => route.fulfill({
      json: { configs: [], videos: [{ score: 1, video: {
        title: 'Safe title', thumbnail, detailUrl: '/videos/example/', publishedAt: '2026-01-01',
      } }] },
    }));
    await page.goto('/controllers/wizard/');
    await page.locator('#wizard-controller').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'General Aviation', exact: true }).click();
    await page.getByRole('button', { name: 'Quick setup', exact: true }).click();
    await page.locator('#wizard-run').click();
    if (thumbnail.startsWith('https:')) {
      await expect(page.locator('#wizard-results')).toBeVisible();
      await expect(page.locator('#video-results .video-card > img')).toHaveAttribute('src', new URL(thumbnail).href);
    } else {
      await expect(page.locator('#wizard-status')).toContainText('could not be loaded');
      await expect(page.locator('#wizard-results')).toBeHidden();
    }

    await expect(page.locator('#video-results [onerror], #video-results [src^="javascript:"]')).toHaveCount(0);
    expect(await page.evaluate(() => Reflect.get(window, 'injected'))).toBeUndefined();
  });
}

for (const stale of [true, false]) {
  test(`live banner only advertises fresh results (stale=${stale})`, async ({ page }) => {
    await page.clock.install();
    let unavailable = false;
    await page.route('http://127.0.0.1:4321/', async (route) => {
      const response = await route.fetch();
      const html = (await response.text()).replace(
        /data-live-status-url="[^"]*"/,
        'data-live-status-url="/security-live-status"',
      );
      await route.fulfill({ response, body: html });
    });
    await page.route('**/security-live-status', (route) => route.fulfill(unavailable
      ? { status: 503, json: { isLive: false, error: 'Failed to check live status' } }
      : { json: { isLive: true, stale, videoId: 'abcdefghijk', title: 'Test stream' } }));
    const checked = page.waitForResponse('**/security-live-status');
    await page.goto('/');
    await checked;
    if (stale) {
      await expect(page.locator('#live-banner')).toHaveAttribute('inert', '');
      await expect(page.locator('#live-banner')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('#live-banner')).not.toHaveClass(/visible/);
    } else {
      await expect(page.locator('#live-banner')).toBeVisible();
      await expect(page.locator('#live-title')).toHaveText('Test stream');
      unavailable = true;
      await page.clock.fastForward(300_000);
      await expect(page.locator('#live-banner')).toHaveAttribute('inert', '');
      await expect(page.locator('#live-banner')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator('#live-banner')).not.toHaveClass(/visible/);
    }
  });
}
