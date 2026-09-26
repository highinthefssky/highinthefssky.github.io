import { expect, test } from '@playwright/test';
import { videoDescriptionSegments } from '../../src/utils/videoDescription';

test('description tokens preserve markup as text and allow only web links', () => {
  const description = '<script>alert(1)</script>\n<img src=x onerror=alert(2)>\njavascript:alert(3) data:text/html,test ftp://example.com/file https://example.com/?q=%22test%22&mode=1';
  const segments = videoDescriptionSegments(description);
  expect(segments.map((segment) => segment.text).join('')).toBe(description);
  const links = segments.filter((segment) => segment.href);
  expect(links).toHaveLength(1);
  expect(links[0].href).toBe('https://example.com/?q=%22test%22&mode=1');
  expect(segments[0].text).toContain('<script>alert(1)</script>');
});

test('description tokens retain punctuation and line breaks around links', () => {
  const description = 'Resources:\n(https://example.com/guide).\nVisit www.example.com or email pilot@example.com.';
  const segments = videoDescriptionSegments(description);
  expect(segments.map((segment) => segment.text).join('')).toBe(description);
  expect(segments.filter((segment) => segment.href).map((segment) => segment.href)).toEqual([
    'https://example.com/guide',
    'https://www.example.com/',
  ]);
  expect(videoDescriptionSegments('')).toEqual([]);
});

test('video descriptions render resource links and preserve line breaks', async ({ page }) => {
  await page.goto('/videos/fdyytnh5wfk/');
  const description = page.locator('.video-description');
  await expect(description.getByRole('link', { name: 'https://bit.ly/34eNWDP', exact: true })).toHaveAttribute('href', 'https://bit.ly/34eNWDP');
  await expect(description.getByRole('link', { name: 'https://bit.ly/3l6fRdL', exact: true })).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(description.locator('p').first()).toHaveCSS('white-space', 'pre-line');
  await expect(description.locator('script, img, iframe')).toHaveCount(0);
  await expect(description).toContainText('0:26 - Defining the "Cold and Dark" state');
  const favorite = page.locator('.detail-fav-btn');
  await favorite.focus();
  await page.keyboard.press('Space');
  await expect(favorite).toHaveAttribute('aria-pressed', 'true');
  await expect(favorite).toHaveAccessibleName('Remove from favorites');
  await expect(page.locator('#fav-nav-count')).toHaveText('1');
});