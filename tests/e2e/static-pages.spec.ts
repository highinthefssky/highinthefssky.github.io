import { expect, test } from '@playwright/test';

test('privacy page loads with expected heading', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});

test('terms page loads with expected heading', async ({ page }) => {
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
});

test('contact page loads with expected heading', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible();
});
