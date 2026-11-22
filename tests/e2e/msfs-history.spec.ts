import { expect, test } from '@playwright/test';
import { ERAS, MSFS2024_UPDATES, TRIVIA_CARDS } from '../../src/data/msfsHistory';

const releases = ERAS.flatMap(era => era.releases);

test('history remains readable without JavaScript and appears in the sitemap', async ({ browser, baseURL, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(new URL('/msfs-history/', baseURL).href);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('.navbar')).toHaveCount(1);
  await expect(page.locator('.footer')).toHaveCount(1);
  await expect(page.locator('.era-chapter .release-card')).toHaveCount(releases.length);
  await expect(page.locator('.hero-revealed-content')).toHaveCSS('opacity', '1');
  await expect(page.locator('.flight-hud a[href="#era-5"]')).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://highintheflightsimsky.nl/msfs-history/');
  await expect(page).toHaveTitle('History of Microsoft Flight Simulator | High in the FlightSim Sky');
  expect(await (await request.get('/sitemap.xml')).text()).toContain('https://highintheflightsimsky.nl/msfs-history/');
  await context.close();
});

test('release search and tags combine, announce empty results, and clear', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/msfs-history/');
  await expect(page.locator('.msfs-history')).toHaveAttribute('data-ready', 'true');
  const archive = page.locator('#archive-search');
  const search = archive.getByRole('searchbox');
  await search.fill('Asobo');
  await expect(archive.locator('.archive-count')).toHaveText('Showing 2 of 19 releases');
  const tag = archive.locator('.archive-tag-cloud').getByRole('button', { name: '#CloudStreaming', exact: true });
  await tag.click();
  await expect(tag).toHaveAttribute('aria-pressed', 'true');
  await expect(archive.locator('.era-releases-grid .release-card')).toHaveCount(2);
  await search.fill('nothing-matches-this-release');
  await expect(archive.locator('.archive-count')).toHaveText('Showing 0 of 19 releases');
  await expect(archive.getByText('No releases matched your filter.', { exact: false })).toBeVisible();
  await archive.getByRole('button', { name: 'Clear Filters' }).click();
  await expect(search).toHaveValue('');
  await expect(tag).toHaveAttribute('aria-pressed', 'false');
  await expect(archive.locator('.archive-count')).toHaveText(`Showing ${releases.length} of ${releases.length} releases`);
  await search.fill('Concorde');
  await archive.getByRole('button', { name: 'Jump to Full Profile' }).first().click();
  await expect(page).toHaveURL(/#release-/);
  await expect(page.locator('.release-card:focus')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('timeline, essays, and trivia expose working selection controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/msfs-history/');
  await expect(page.locator('.msfs-history')).toHaveAttribute('data-ready', 'true');
  const timeline = page.locator('#recovery-2024');
  await expect(timeline.locator('.recovery-item')).toHaveCount(MSFS2024_UPDATES.length);
  await timeline.getByRole('button', { name: /Platform milestones/ }).click();
  await expect(timeline.locator('.recovery-item')).toHaveCount(MSFS2024_UPDATES.filter(item => item.categories.includes('platform')).length);
  const essays = page.locator('#deep-dives');
  await essays.locator('.deepdive-tab').nth(1).click();
  await expect(essays.locator('.deepdive-tab').nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(essays.locator('#history-essay-title')).toContainText('Third-Party');
  const trivia = page.locator('#trivia');
  await trivia.getByRole('button', { name: 'Era 1', exact: true }).click();
  await expect(trivia.locator('.trivia-card')).toHaveCount(TRIVIA_CARDS.filter(card => card.era === 'Era 1').length);
  await expect(trivia.getByRole('status')).toContainText('Showing 5 stories');
});

test('lightbox contains focus, navigates, closes, and restores scrolling and focus on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/msfs-history/');
  await expect(page.locator('.msfs-history')).toHaveAttribute('data-ready', 'true');
  const opener = page.locator('.era-shot-card').first();
  await opener.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close image viewer' })).toBeFocused();
  const firstTitle = await dialog.locator('h3').textContent();
  await dialog.getByRole('button', { name: 'Next image' }).click();
  await expect(dialog.locator('h3')).not.toHaveText(firstTitle!);
  await page.keyboard.press('ArrowLeft');
  await expect(dialog.locator('h3')).toHaveText(firstTitle!);
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('native navigation, themes, and image budgets work at desktop, tablet, and mobile widths', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/msfs-history/');
    await expect(page.locator('.msfs-history')).toHaveAttribute('data-ready', 'true');
    if (width <= 1100) await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.getByRole('button', { name: 'Tools & Resources' }).click();
    await expect(page.locator('#tools-dropdown a[data-link="/msfs-history"]')).toHaveAttribute('aria-current', 'page');
    await page.locator('#tools-dropdown a[data-link="/msfs-history"]').click();
    await expect(page).toHaveURL(/\/msfs-history\/$/);
    const lightBefore = await page.locator('html').evaluate(element => element.classList.contains('light'));
    await page.locator('.theme-toggle').click();
    await expect.poll(() => page.locator('html').evaluate(element => element.classList.contains('light'))).toBe(!lightBefore);
    const hero = page.locator('.hero-backdrop img');
    await hero.evaluate((image: HTMLImageElement) => image.decode());
    const url = await hero.evaluate((image: HTMLImageElement) => image.currentSrc);
    expect(url).toMatch(/\.avif/);
    expect((await (await request.get(url)).body()).length).toBeLessThan(width <= 768 ? 65_000 : 140_000);
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    await expect(page.locator('.era-shot-media img').first()).toHaveAttribute('loading', 'lazy');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('deep links resolve below the sticky navbar with and without motion, including refresh', async ({ page }) => {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/msfs-history/#era-3');
    await expect(page.locator('.msfs-history')).toHaveAttribute('data-ready', 'true');
    const target = page.locator('#era-3');
    await expect.poll(() => target.evaluate(element => {
      const top = element.getBoundingClientRect().top;
      const bottom = document.querySelector('.navbar')!.getBoundingClientRect().bottom;
      return top >= bottom && top <= bottom + 30;
    })).toBe(true);
    if (reducedMotion === 'reduce') await expect(page.locator('.pin-spacer')).toHaveCount(0);
    else await expect(page.locator('.pin-spacer')).toHaveCount(1);
    await page.reload();
    await expect.poll(() => target.evaluate(element => {
      const top = element.getBoundingClientRect().top;
      const bottom = document.querySelector('.navbar')!.getBoundingClientRect().bottom;
      return top >= bottom && top <= bottom + 30;
    })).toBe(true);
  }
});
