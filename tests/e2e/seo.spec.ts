import { expect, test } from '@playwright/test';
import { metaDescription } from '../../src/utils/metaDescription';

test('metadata descriptions normalize whitespace and truncate at word boundaries', () => {
  expect(metaDescription(' First\n\tsecond  third ', 'fallback')).toBe('First second third');
  expect(metaDescription('  ', 'Video title')).toBe('Video title');
  expect(metaDescription('a'.repeat(160), 'fallback')).toHaveLength(160);
  expect(metaDescription(`${'guide '.repeat(25)}flight`, 'fallback')).toBe(`${'guide '.repeat(25)}flight`);
  const description = metaDescription(`${'guide '.repeat(25)}extraordinary flight lessons`, 'fallback');
  expect(description).toBe(`${'guide '.repeat(25).trimEnd()}...`);
  expect(metaDescription('a'.repeat(170), 'fallback')).toHaveLength(160);
});

test('sitemap includes public tools and excludes private or redirect pages', async ({ page, request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  const locations = await page.evaluate((xml) => Array.from(
    new DOMParser().parseFromString(xml, 'application/xml').querySelectorAll('loc'),
    (element) => element.textContent,
  ), await sitemap.text());
  expect(new Set(locations).size).toBe(locations.length);
  for (const path of ['/controllers/moza/', '/tools/community-folder-troubleshooter/', '/community2024/', '/contact/']) {
    const canonical = `https://highintheflightsimsky.nl${path}`;
    expect(locations).toContain(canonical);
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', canonical);
  }
  for (const path of ['/controllers/wizard/', '/favorites/', '/search/']) {
    expect(locations).not.toContain(`https://highintheflightsimsky.nl${path}`);
  }
});

test('all crawlers share the tag-query rules', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.ok()).toBeTruthy();
  const rules = (await response.text()).split(/\r?\n/).filter(Boolean);
  expect(rules.filter((line) => line.startsWith('User-agent:'))).toEqual(['User-agent: *']);
  expect(rules.filter((line) => line.startsWith('Disallow:'))).toEqual(['Disallow: /*?tag=', 'Disallow: /*?*&tag=']);
  expect(rules).toContain('Sitemap: https://highintheflightsimsky.nl/sitemap.xml');
});

test('home and default social previews use a correctly sized raster image', async ({ page, request }) => {
  for (const path of ['/', '/controllers/']) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://highintheflightsimsky.nl/og-image.jpg');
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', 'https://highintheflightsimsky.nl/og-image.jpg');
    await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/jpeg');
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
  }
  const image = await request.get('/og-image.jpg');
  expect(image.ok()).toBeTruthy();
  expect(image.headers()['content-type']).toContain('image/jpeg');
  expect((await image.body()).length).toBeLessThan(100_000);
  expect(await page.evaluate(async () => {
    const image = new Image();
    image.src = '/og-image.jpg';
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  })).toEqual([1200, 630]);

  await page.goto('/');
  await expect(page).toHaveTitle('MSFS Guides & Controller Profiles | High in the FlightSim Sky');
  const organizations = await page.locator('script[type="application/ld+json"]').evaluateAll((elements) =>
    elements.map((element) => JSON.parse(element.textContent || '{}')).filter((schema) => schema['@type'] === 'Organization'));
  expect(organizations[0].sameAs).toEqual(['https://www.youtube.com/@Highintheflightsimsky']);
});

test('video pages retain their own thumbnail and share the normalized description', async ({ page }) => {
  await page.goto('/videos/fdyytnh5wfk/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /https:\/\/(i\.ytimg\.com|img\.youtube\.com)\//);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveCount(0);
  const description = await page.locator('meta[name="description"]').getAttribute('content');
  expect(description?.length).toBeLessThanOrEqual(160);
  expect(description).not.toMatch(/\n|\s{2}/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description!);
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description!);
});

for (const width of [320, 390, 1440]) {
  test(`homepage images fit and stay within byte budgets at ${width}px`, async ({ page, request }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const hero = page.locator('.hero-brand-art img');
    await hero.evaluate((element: HTMLImageElement) => element.decode());
    await expect(hero).toHaveAttribute('width', '1368');
    await expect(hero).toHaveAttribute('height', '472');
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    const sources = page.locator('.hero-brand-art source');
    await expect(sources).toHaveCount(2);
    await expect(sources.nth(0)).toHaveAttribute('type', 'image/avif');
    await expect(sources.nth(1)).toHaveAttribute('type', 'image/webp');
    for (const source of await sources.all()) {
      await expect(source).toHaveAttribute('srcset', /480w,.*768w,.*1200w,.*1368w/);
    }
    const heroUrl = await hero.evaluate((element: HTMLImageElement) => element.currentSrc);
    expect(heroUrl).toContain('.avif');
    const heroResponse = await request.get(heroUrl);
    expect(heroResponse.ok()).toBeTruthy();
    expect((await heroResponse.body()).length).toBeLessThan(width < 768 ? 20_000 : 75_000);
    await expect(page.locator('img[fetchpriority="high"]')).toHaveCount(1);
    for (const selector of ['.navbar-logo img', '.footer-brand img']) {
      const logo = page.locator(selector);
      await logo.scrollIntoViewIfNeeded();
      await logo.evaluate((element: HTMLImageElement) => element.decode());
      const url = await logo.evaluate((element: HTMLImageElement) => element.currentSrc);
      expect(url).toContain('.webp');
      expect((await (await request.get(url)).body()).length).toBeLessThan(2_000);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    const iconUrl = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(await page.evaluate(async (url) => {
      const image = new Image();
      image.src = url!;
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, iconUrl)).toEqual([180, 180]);
  });
}