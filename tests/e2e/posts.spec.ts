import { expect, test } from '@playwright/test';

test('posts index opens a post detail page', async ({ page }) => {
  await page.goto('/posts/');

  await expect(page.getByRole('heading', { name: 'Community Posts' })).toBeVisible();

  const firstPost = page.locator('a.post-card').first();
  await expect(firstPost).toBeVisible();
  await firstPost.click();

  await expect(page).toHaveURL(/\/posts\/[^/]+\/?$/);
  await expect(page.locator('article.post-page h1.post-title')).toBeVisible();
});

test('post tag filter updates visible cards', async ({ page }) => {
  await page.goto('/posts/');

  const tagSelect = page.locator('#tag-filter');
  if (await tagSelect.count()) {
    const initialCount = await page.locator('a.post-card:visible').count();
    expect(initialCount).toBeGreaterThan(0);

    await tagSelect.selectOption({ index: 1 });

    const filteredCount = await page.locator('a.post-card:visible').count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  }
});

test('invalid post slug returns 404', async ({ page }) => {
  const response = await page.goto('/posts/not-a-real-post-404-test/');
  expect(response?.status()).toBe(404);
});
