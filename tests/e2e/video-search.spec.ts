import { expect, test } from '@playwright/test';
import { VIDEO_PAGE_SIZE, videoPageUrl, videoPageWindow } from '../../src/utils/videoPagination';
import MiniSearch from 'minisearch';
import { buildVideoIndex, findSearchVideos, videoSearchOptions } from '../../src/lib/video-search';
import { readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

test('video pagination preserves existing archive boundaries and routes', () => {
  expect(VIDEO_PAGE_SIZE).toBe(9);
  expect(videoPageUrl(1)).toBe('/videos/');
  expect(videoPageUrl(2)).toBe('/videos/page/2/');
  expect(videoPageWindow(1, 245)).toEqual([1, 2, 3, 4, 5]);
  expect(videoPageWindow(245, 245)).toEqual([241, 242, 243, 244, 245]);
  expect(videoPageWindow(2, 3)).toEqual([1, 2, 3]);
  expect(videoPageWindow(1, 0)).toEqual([]);
});

test('search indexes actual descriptions and combines terms with exact OR tag filters', () => {
  const base = { videoId: 'AbCd', thumbnail: 'https://example.com/image.jpg', duration: 60, publishedAt: '2026-09-25', viewCount: 1 };
  const videos = [
    { ...base, id: 'new', title: 'Landing tutorial', description: 'An aspheric lens and IFR approach.', tags: ['A320', 'MSFS, 2024'] },
    { ...base, id: 'old', title: 'Aspheric camera', description: 'A VFR landing lesson.', tags: ['C172'] },
  ];
  const index = MiniSearch.loadJSON(JSON.stringify(buildVideoIndex(videos)), videoSearchOptions);
  const ids = (query: string, tags: string[] = []) => findSearchVideos(index, videos, query, tags).map((video) => video.id);
  expect(ids('description:aspheric')).toEqual(['new']);
  expect(ids('TITLE:aspher')).toEqual(['old']);
  expect(ids('aspheric IFR')).toEqual(['new']);
  expect(ids('landing', ['c172'])).toEqual(['old']);
  expect(ids('', ['MSFS, 2024', 'C172'])).toEqual(['new', 'old']);
  expect(ids('', ['MSFS'])).toEqual([]);
  expect(ids('missing')).toEqual([]);
});

test('static archives cover every video exactly once with bounded page sizes', () => {
  const index = JSON.parse(readFileSync('dist/videos/search-index.json', 'utf8'));
  const directories = readdirSync('dist/videos/page').sort((first, second) => Number(first) - Number(second));
  const paths = ['dist/videos/index.html', ...directories.map((directory) => `dist/videos/page/${directory}/index.html`)];
  const ids: string[] = [];
  for (const path of paths) {
    const html = readFileSync(path, 'utf8');
    const pageIds = Array.from(html.matchAll(/data-video-id="([^"]+)"/g), (match) => match[1]);
    expect(pageIds.length).toBeGreaterThan(0);
    expect(pageIds.length).toBeLessThanOrEqual(VIDEO_PAGE_SIZE);
    ids.push(...pageIds);
  }
  expect(ids).toEqual(index.videos.map((video: { videoId: string }) => video.videoId));
  expect(new Set(ids).size).toBe(ids.length);
  const html = readFileSync('dist/videos/index.html');
  expect(html.length).toBeLessThan(100_000);
  expect(gzipSync(html).length).toBeLessThan(20_000);
  expect(gzipSync(readFileSync('dist/videos/search-index.json')).length).toBeLessThan(1_200_000);
});

test('archive pagination works without JavaScript and has no duplicate page-one videos', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(new URL('/videos/', baseURL).href);
  await expect(page.locator('.video-card')).toHaveCount(9);
  await expect(page.locator('.search-controls')).toBeHidden();
  await expect(page.getByRole('link', { name: 'Page 1', exact: true })).toHaveAttribute('aria-current', 'page');
  const firstIds = await page.locator('.video-card').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-video-id')));
  await page.getByRole('link', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/\/videos\/page\/2\/$/);
  await expect(page.locator('.video-card')).toHaveCount(9);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://highintheflightsimsky.nl/videos/page/2/');
  const secondIds = await page.locator('.video-card').evaluateAll((cards) => cards.map((card) => card.getAttribute('data-video-id')));
  expect(firstIds.filter((id) => secondIds.includes(id))).toEqual([]);
  await page.getByRole('link', { name: 'Previous', exact: true }).click();
  await expect(page).toHaveURL(/\/videos\/$/);
  await context.close();
});

test('search loads lazily, finds description-only terms, and preserves favorites and routes', async ({ page, context }) => {
  const requests: string[] = [];
  context.on('request', (request) => requests.push(request.url()));
  await page.goto('/videos/');
  await expect(page.locator('.video-card')).toHaveCount(9);
  expect(requests.filter((url) => url.includes('search-index.json') || url.includes('tags.json'))).toEqual([]);
  await page.getByLabel('Search videos', { exact: true }).fill('description:aspheric');
  const result = page.locator('.video-card[data-video-id="K0I_G-8Ibws"]');
  await expect(result).toBeVisible();
  await expect(page.locator('#result-count')).toHaveText('1 video');
  await expect(result.locator('.video-card-link')).toHaveAttribute('href', '/videos/k0i_g-8ibws/');
  await expect(result).toHaveCSS('display', 'flex');
  await expect(result.locator('.fav-btn')).toHaveCSS('width', '44px');
  await expect(page.locator('#archive-pagination')).toBeHidden();
  const favorite = result.locator('.fav-btn');
  await favorite.focus();
  await page.keyboard.press('Space');
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#fav-nav-count')).toHaveText('1');
  await page.reload();
  await expect(page.getByLabel('Search videos', { exact: true })).toHaveValue('description:aspheric');
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Search videos', { exact: true }).fill('title:aspheric');
  await expect(page.locator('#empty-state')).toBeVisible();
  await page.getByRole('button', { name: 'Reset search', exact: true }).click();
  await expect(page.locator('.video-card')).toHaveCount(9);
  await expect(page.locator('#archive-pagination')).toBeVisible();
  await expect(page.locator('#search-input')).toBeFocused();
});

test('search result pages keep the DOM bounded and ignore superseded queries', async ({ page }) => {
  await page.goto('/videos/');
  await page.getByLabel('Search videos', { exact: true }).fill('msfs');
  await expect(page.locator('#videos-grid')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.video-card')).toHaveCount(24);
  const first = await page.locator('.video-card').first().getAttribute('data-video-id');
  await page.getByRole('button', { name: 'Next results', exact: true }).click();
  await expect(page.locator('#search-page')).toContainText('Page 2 of');
  await expect(page.locator('.video-card')).toHaveCount(24);
  expect(await page.locator('.video-card').first().getAttribute('data-video-id')).not.toBe(first);
  await expect(page.locator('#videos-grid')).toBeFocused();
  await page.getByRole('button', { name: 'Previous results', exact: true }).click();
  await expect(page.locator('.video-card').first()).toHaveAttribute('data-video-id', first!);
  await page.getByLabel('Search videos', { exact: true }).fill('title:missingterm987654');
  await page.getByLabel('Search videos', { exact: true }).press('Enter');
  await page.getByLabel('Search videos', { exact: true }).fill('description:aspheric');
  await expect(page.locator('#result-count')).toHaveText('1 video');
  await expect(page.locator('.video-card')).toHaveCount(1);
});

test('tag chooser is bounded, filters actual tags, and restores legacy links', async ({ page }) => {
  await page.goto('/videos/?tag=msfs2024');
  await expect(page.locator('#selected-tags button')).toHaveCount(1);
  await expect(page.locator('#videos-grid')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#result-count')).toHaveText(/\d+ videos/);
  expect(await page.locator('#tags-list button').count()).toBeLessThanOrEqual(60);
  await page.getByLabel('Search video tags', { exact: true }).fill('msfs');
  await expect(page.locator('#tag-status')).toHaveText(/\d+ of \d+ tags/);
  const tags = await page.locator('#tags-list button').allTextContents();
  expect(tags.length).toBeGreaterThan(0);
  expect(tags.every((tag) => tag.toLowerCase().includes('msfs'))).toBe(true);
  await page.getByRole('button', { name: 'Filter by tags', exact: true }).click();
  await page.locator('#selected-tags button').click();
  await expect(page.getByRole('button', { name: 'Filter by tags', exact: true })).toBeFocused();
  await expect(page.locator('.video-card')).toHaveCount(9);
  expect(page.url()).not.toContain('#tag=');
});

test('failed index request offers retry and keeps static navigation available', async ({ page, context }) => {
  let attempts = 0;
  await context.route('**/videos/search-index.json', async (route) => {
    attempts++;
    if (attempts === 1) await route.fulfill({ status: 503, body: 'Unavailable' });
    else await route.continue();
  });
  await page.goto('/videos/');
  await page.getByLabel('Search videos', { exact: true }).fill('description:aspheric');
  await expect(page.locator('#search-error')).toBeVisible();
  await expect(page.locator('#archive-pagination')).toBeVisible();
  await expect(page.locator('.video-card')).toHaveCount(9);
  await page.getByRole('button', { name: 'Retry search' }).click();
  await expect(page.locator('#result-count')).toHaveText('1 video');
  await expect(page.locator('#search-error')).toBeHidden();
  expect(attempts).toBe(2);
});

test('archive controls and dynamic cards reflow at narrow mobile widths', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/videos/');
    await expect(page.locator('#selected-tags')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByLabel('Search videos', { exact: true }).fill('description:aspheric');
    await expect(page.locator('#result-count')).toHaveText('1 video');
    await expect(page.locator('.video-card .tag').first()).toHaveCSS('padding', '4px 12px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Filter by tags', exact: true }).click();
    await page.getByLabel('Search video tags', { exact: true }).fill('microsoft');
    await expect(page.locator('#tags-list button').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});