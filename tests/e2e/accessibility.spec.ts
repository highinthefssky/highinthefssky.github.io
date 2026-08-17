import { expect, test } from '@playwright/test';

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
