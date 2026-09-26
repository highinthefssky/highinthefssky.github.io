import { expect, test } from '@playwright/test';

test.describe('mobile responsive smoke', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('home page renders on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1.hero-title')).toBeVisible();

    const menuButton = page.locator('#mobile-menu-toggle');
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAccessibleName('Open navigation menu');
    await menuButton.click();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.navbar-menu')).toBeVisible();
  });

  test('videos page renders and search is usable on mobile', async ({ page }) => {
    await page.goto('/videos/');

    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('IFR');
    await expect(page.locator('#result-count')).toContainText(/video/i);
  });

  for (const width of [320, 390]) {
    test(`collapsed tools submenu leaves no blank gap at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
      const tools = page.getByRole('button', { name: 'Tools & Resources' });
      const submenu = page.locator('#tools-dropdown');
      const community = page.locator('#primary-navigation').getByRole('link', { name: 'Community', exact: true });
      await expect(submenu).toHaveCSS('display', 'none');
      const toolsBox = await tools.boundingBox();
      const communityBox = await community.boundingBox();
      expect(communityBox!.y - toolsBox!.y - toolsBox!.height).toBeLessThan(10);

      await tools.click();
      await expect(tools).toHaveAttribute('aria-expanded', 'true');
      await expect(submenu).toHaveCSS('display', 'flex');
      await expect(submenu.getByRole('link', { name: /Controllers/ })).toBeVisible();
      await tools.click();
      await expect(tools).toHaveAttribute('aria-expanded', 'false');
      await expect(submenu).toHaveCSS('display', 'none');
      await tools.click();
      await submenu.getByRole('link', { name: /Controllers/ }).click();
      await expect(page).toHaveURL(/\/controllers\/?$/);
      await expect(page.getByRole('heading', { name: /Controller Configurations/ })).toBeVisible();
    });
  }
});
