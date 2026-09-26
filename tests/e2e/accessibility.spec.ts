import { expect, test } from '@playwright/test';

test('hidden live banner is excluded from keyboard navigation', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('liveBannerDismissed', 'true'));
  await page.goto('/');
  await expect(page.locator('#live-banner')).toHaveAttribute('inert', '');
  await expect(page.locator('#live-banner')).toHaveAttribute('aria-hidden', 'true');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('.navbar-logo')).toBeFocused();
});

test('visible live banner restores focus when dismissed', async ({ page }) => {
  await page.goto('/?testlive=true');
  await expect(page.locator('#live-banner')).not.toHaveAttribute('inert');
  await expect(page.locator('#live-banner-link')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=test123');
  const closeButton = page.getByRole('button', { name: 'Close banner' });
  await closeButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#live-banner')).toHaveAttribute('inert', '');
  await expect(page.locator('.navbar-logo')).toBeFocused();
  await page.reload();
  await expect(page.locator('#live-banner')).toHaveAttribute('inert', '');
});

test('video card favorites are visible on focus and save without navigation', async ({ page }) => {
  await page.goto('/videos/');
  const favorite = page.locator('.video-card .fav-btn').first();
  const videoId = await favorite.getAttribute('data-fav-id');
  await favorite.focus();
  await expect(favorite).toHaveCSS('opacity', '1');
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Space');
  await expect(page).toHaveURL(/\/videos\/$/);
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await expect(favorite).toHaveAccessibleName('Remove from favorites');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fav-videos') || '[]'))).toContain(videoId);
  await page.keyboard.press('Enter');
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await expect(favorite).toHaveAccessibleName('Save to favorites');
  await expect(page.locator('.video-card a button, .video-card a a')).toHaveCount(0);
});

test('video card favorites are visible without hover on touch devices', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(new URL('/videos/', baseURL).href);
  await expect(page.locator('.video-card .fav-btn').first()).toHaveCSS('opacity', '1');
  await context.close();
});

test('carousel keeps attribution outside the video link', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.carousel-slide > .slide-link')).toHaveCount(3);
  await expect(page.locator('.carousel-slide > .yt-brand-feature')).toHaveCount(3);
  await expect(page.locator('.slide-link .slide-overlay')).toHaveCount(3);
  await expect(page.locator('.slide-link a, .slide-link button')).toHaveCount(0);
});

test('video tag filters expose expanded and selected state', async ({ page }) => {
  await page.goto('/videos/');
  const toggle = page.getByRole('button', { name: 'Filter by tags', exact: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const tag = page.locator('#tags-list .tag-filter').first();
  await tag.click();
  await expect(tag).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#result-count')).toHaveAttribute('role', 'status');
  const remove = page.locator('#selected-tags button');
  await remove.focus();
  await page.keyboard.press('Enter');
  await expect(tag).toHaveAttribute('aria-pressed', 'false');
  await expect(tag).toBeFocused();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#tag-container')).toBeHidden();
});

test('wizard labels, selection states, and results focus support keyboard use', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/controllers/wizard');
  const controller = page.getByRole('combobox', { name: 'Controller', exact: true });
  await expect(controller).toBeVisible();
  await expect(page.locator('#aircraft-chips [aria-pressed="false"]')).toHaveCount(6);
  await controller.selectOption({ index: 1 });
  const aircraft = page.getByRole('button', { name: 'General Aviation', exact: true });
  await aircraft.focus();
  await page.keyboard.press('Space');
  await expect(aircraft).toHaveAttribute('aria-pressed', 'true');
  const goal = page.getByRole('button', { name: 'Quick setup', exact: true });
  await goal.focus();
  await page.keyboard.press('Enter');
  await expect(goal).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Find my best matches' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#results-summary')).toBeFocused();
  await expect.poll(() => page.locator('#results-summary').evaluate((summary) =>
    summary.getBoundingClientRect().top >= document.querySelector('.navbar')!.getBoundingClientRect().bottom
  )).toBe(true);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(aircraft).toHaveAttribute('aria-pressed', 'false');
  await expect(goal).toHaveAttribute('aria-pressed', 'false');
  await expect(aircraft).toBeDisabled();
});

test('controller filters announce selection and restore focus after removal', async ({ page }) => {
  await page.goto('/controllers');
  const toggle = page.getByRole('button', { name: 'Filter by controller', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const controller = page.locator('#controllers-list .controller-filter').first();
  await controller.click();
  await expect(controller).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#selected-filters button').click();
  await expect(toggle).toBeFocused();
  await expect(controller).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Filter by tags', exact: true }).click();
  const tag = page.locator('#tags-list .tag-filter').first();
  await tag.click();
  await expect(tag).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Clear all filters' }).click();
  await expect(tag).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#result-count')).toHaveAttribute('role', 'status');
});

test('focused carousel titles and controls fit narrow mobile frames', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.locator('.carousel-slide:not([inert]) .slide-link').focus();
    await expect(page.locator('.carousel-slide:not([inert]) .slide-overlay')).toHaveCSS('opacity', '1');
    const fits = await page.evaluate(() => {
      const carousel = document.querySelector('.carousel')!.getBoundingClientRect();
      const title = document.querySelector('.carousel-slide:not([inert]) .slide-title')!.getBoundingClientRect();
      const controls = document.querySelector('.carousel-controls')!.getBoundingClientRect();
      return title.top >= carousel.top && title.bottom <= controls.top &&
        controls.left >= carousel.left && controls.right <= carousel.right && controls.bottom <= carousel.bottom;
    });
    expect(fits, `Carousel content must fit at ${width}px`).toBe(true);
  }
});

test('main navigation links are accessible by role', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Home' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Videos' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Playlists' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact' }).first()).toBeVisible();
});

test('keyboard can focus video search input using slash shortcut', async ({ page }) => {
  await page.goto('/videos/');

  await page.keyboard.press('/');
  await expect(page.locator('#search-input')).toBeFocused();
});

test('search fields have persistent labels', async ({ page }) => {
  await page.goto('/videos/');
  await expect(page.getByLabel('Search videos')).toBeVisible();

  await page.goto('/controllers');
  await expect(page.getByLabel('Search controller configurations')).toBeVisible();
});

test('skip link bypasses repeated navigation', async ({ page }) => {
  await page.goto('/');

  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await skipLink.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});

test('mobile menu restores focus when closed with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menuToggle = page.getByRole('button', { name: 'Open navigation menu' });
  await menuToggle.click();
  await page.getByRole('link', { name: 'Home' }).first().focus();
  await page.keyboard.press('Escape');

  await expect(menuToggle).toBeFocused();
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
});

test('current navigation link is exposed to assistive technology', async ({ page }) => {
  await page.goto('/videos/');

  await expect(page.locator('#primary-navigation [aria-current="page"]')).toHaveText('Videos');
});

test('carousel exposes one active slide and user-controlled motion', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.carousel-slide:not([inert])')).toHaveCount(1);
  await expect(page.locator('.carousel-slide[inert]')).toHaveCount(2);
  await expect(page.locator('.slide-overlay button.play-button')).toHaveCount(0);

  const pauseButton = page.getByRole('button', { name: 'Pause carousel' });
  await pauseButton.click();
  await expect(page.getByRole('button', { name: 'Play carousel' })).toBeVisible();
});

test('carousel respects reduced motion preferences', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Play carousel' })).toBeVisible();
});

test('post content reflows without horizontal page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });

  for (const route of ['/', '/posts']) {
    await page.goto(route);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow, `${route} should not overflow horizontally`).toBe(false);
  }
});
