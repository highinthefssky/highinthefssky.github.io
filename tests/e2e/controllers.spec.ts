import { expect, test } from '@playwright/test';

test('controller page exposes synced Moza profiles', async ({ page }) => {
  await page.goto('/controllers');

  const profiles = page.locator('[data-profile-filename]');
  await expect(profiles).toHaveCount(3);
  await expect(page.getByRole('link', { name: /AB6 A320 MSFS 2024/ })).toHaveAttribute(
    'href',
    /ab6-a320-msfs2024\.preset$/
  );
});

test('controller cards expand control abbreviations and identify T16000M as a joystick', async ({ page }) => {
  await page.goto('/controllers');

  const generalControlsCard = page.locator('[data-controller="t16000m"][data-settings="gc"]');
  const helicopterControlsCard = page.locator('[data-controller="t16000m"][data-settings="hc"]');

  await expect(generalControlsCard.locator('.controller-icon')).toHaveText('🕹️');
  await expect(generalControlsCard.locator('.type-badge')).toHaveText('General Controls');
  await expect(generalControlsCard.locator('.config-description')).toContainText('General Controls for T16000M');
  await expect(helicopterControlsCard.locator('.type-badge')).toHaveText('Helicopter Controls');
});

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
