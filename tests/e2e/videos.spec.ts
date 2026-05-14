import { expect, test } from '@playwright/test';

test('video detail page has embed, canonical, and schema', async ({ page }) => {
  await page.goto('/videos/');

  const cards = page.locator('a.video-card');
  await expect(cards.first()).toBeVisible();

  const hrefs = await cards.evaluateAll((els) =>
    els
      .map((el) => el.getAttribute('href'))
      .filter((href): href is string => Boolean(href))
  );

  let selectedHref: string | undefined;
  for (const href of hrefs.slice(0, 10)) {
    if (!/^\/videos\/[^/]+\/?$/.test(href)) continue;
    const probe = await page.request.get(href);
    if (probe.status() === 200) {
      selectedHref = href;
      break;
    }
  }

  expect(selectedHref, `No video card href returned 200. Checked: ${hrefs.slice(0, 10).join(', ')}`).toBeTruthy();

  const response = await page.goto(selectedHref!);
  expect(response?.status()).toBe(200);

  await expect(page).toHaveURL(/\/videos\/[^/]+\/?$/);
  await expect(page.locator('.player-iframe')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('h1.video-title')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/videos\/[^/]+\/?$/);
  const schemaScripts = page.locator('script[type="application/ld+json"]');
  await expect(schemaScripts).toHaveCount(4);
  const html = await page.content();
  expect(html).toContain('"@type":"VideoObject"');
});

test('videos pagination page is reachable', async ({ page }) => {
  await page.goto('/videos/page/2/');
  await expect(page).toHaveURL(/\/videos\/page\/2\/?$/);
  await expect(page.getByRole('heading', { name: 'All Videos' })).toBeVisible();
  await expect(page.getByText(/Page 2 of/i)).toBeVisible();
});

test('videos search empty result state works', async ({ page }) => {
  await page.goto('/videos/');

  const searchInput = page.getByPlaceholder('Search videos (e.g. title:landing, description:IFR, navigation tutorial)');
  await searchInput.fill('this-query-should-not-match-any-real-video-title-123456789');

  await expect(page.locator('#empty-state')).toBeVisible();
  await expect(page.locator('#empty-state')).toContainText('No videos found matching your search.');
});

test('videos search keyboard shortcut focuses input', async ({ page }) => {
  await page.goto('/videos/');

  await page.keyboard.press('/');
  await expect(page.locator('#search-input')).toBeFocused();
});

test('invalid video id returns 404', async ({ page }) => {
  const response = await page.goto('/videos/not-a-real-video-id-404-test/');
  expect(response?.status()).toBe(404);
});
