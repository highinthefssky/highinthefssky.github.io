import { expect, test } from '@playwright/test';

test('controller wizard page is noindex', async ({ page }) => {
  await page.goto('/controllers/wizard');

  await expect(page.getByRole('heading', { name: 'Controller Match Wizard' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/i);
});

test('controller wizard can generate recommendations', async ({ page }) => {
  await page.goto('/controllers/wizard');

  const controllerSelect = page.locator('#wizard-controller');
  await controllerSelect.selectOption({ index: 1 });

  await page.locator('#aircraft-chips .choice-chip[data-value="general"]').click();
  await page.locator('#goal-chips .choice-chip[data-value="setup"]').click();

  const runButton = page.locator('#wizard-run');
  await expect(runButton).toBeEnabled();
  await runButton.click();

  await expect(page.locator('#wizard-results')).toBeVisible();
  await expect(page.locator('#config-results')).toBeVisible();
  await expect(page.locator('#video-results')).toBeVisible();
});
