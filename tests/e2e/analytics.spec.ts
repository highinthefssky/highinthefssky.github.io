import { expect, test } from '@playwright/test';
import type { Page, Request } from '@playwright/test';
import { ANALYTICS_ENDPOINT, ANALYTICS_ORIGIN, analyticsPayload, isYouTubeLink } from '../../src/lib/analytics';

async function mockProduction(page: Page, enabled = true) {
  const events: Request[] = [];
  await page.route('**/*', async (route) => {
    const request = route.request();
    if (request.url() === ANALYTICS_ENDPOINT) {
      events.push(request);
      await route.fulfill({ status: 202, body: '{}', headers: { 'access-control-allow-origin': '*' } });
      return;
    }
    const url = new URL(request.url());
    if (url.origin !== ANALYTICS_ORIGIN) {
      await route.abort();
      return;
    }
    const response = await page.request.get(`${url.pathname}${url.search}`);
    if (response.headers()['content-type']?.includes('text/html')) {
      const body = (await response.text()).replace(/(<meta name="site-analytics" content=")[^"]+("[^>]*>)/, `$1${enabled ? 'plausible' : 'disabled'}$2`);
      await route.fulfill({ response, body });
    } else await route.fulfill({ response });
  });
  return events;
}

function eventNames(events: Request[]) {
  return events.map((request) => JSON.parse(request.postData()!).name);
}

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: 'wait' });
});

test('analytics payloads contain only fixed events and broad page categories', () => {
  expect(analyticsPayload('Wizard Results', 'https://highintheflightsimsky.nl/controllers/wizard/?controller=private#q=secret')).toEqual({
    name: 'Wizard Results', domain: 'highintheflightsimsky.nl', url: 'https://highintheflightsimsky.nl/controllers/wizard/',
  });
  expect(analyticsPayload('XML Download Started', 'https://highintheflightsimsky.nl/controllers/download/xml/private-filename/')).toEqual({
    name: 'XML Download Started', domain: 'highintheflightsimsky.nl', url: 'https://highintheflightsimsky.nl/controllers/download/xml/',
  });
  expect(analyticsPayload('pageview', 'https://highintheflightsimsky.nl/videos/private-title/')).toHaveProperty('url', 'https://highintheflightsimsky.nl/videos/detail/');
  for (const url of ['http://127.0.0.1:4321/', 'http://highintheflightsimsky.nl/', 'https://preview.example.com/', 'https://highintheflightsimsky.nl/favorites/', 'https://highintheflightsimsky.nl/unknown/', 'invalid']) {
    expect(analyticsPayload('pageview', url)).toBeUndefined();
  }
  expect(analyticsPayload('user-provided-search-text', 'https://highintheflightsimsky.nl/')).toBeUndefined();
});

test('outbound event detection recognizes only intended YouTube destinations', () => {
  expect(isYouTubeLink('https://www.youtube.com/watch?v=abc')).toBe(true);
  expect(isYouTubeLink('https://youtu.be/abc')).toBe(true);
  for (const url of ['https://youtube.com.evil.example/', 'https://notyoutube.com/', 'https://bit.ly/34eNWDP', 'javascript:alert(1)']) {
    expect(isYouTubeLink(url)).toBe(false);
  }
});

test('enabled transport strips URL and referrer data and never sends credentials', async ({ page, context }) => {
  const events = await mockProduction(page);
  await context.addCookies([{ name: 'private-cookie', value: 'secret', domain: 'plausible.io', path: '/', secure: true, sameSite: 'None' }]);
  await page.goto(`${ANALYTICS_ORIGIN}/videos/?utm_source=private#private-fragment`, { referer: 'https://example.com/private-referrer' });
  await expect.poll(() => events.length).toBe(1);
  expect(JSON.parse(events[0].postData()!)).toEqual({ name: 'pageview', domain: 'highintheflightsimsky.nl', url: `${ANALYTICS_ORIGIN}/videos/` });
  const headers = await events[0].allHeaders();
  expect(headers.referer).toBeUndefined();
  expect(headers.cookie).toBeUndefined();
  expect(headers['content-type']).toBe('text/plain');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('site-analytics-event', { detail: { name: 'private' } }));
    window.dispatchEvent(new CustomEvent('site-analytics-event', { detail: 'private-search' }));
    window.dispatchEvent(new CustomEvent('site-analytics-event', { detail: 'pageview' }));
    const link = document.createElement('a');
    link.href = 'https://www.youtube.com/watch?v=private-title';
    link.addEventListener('click', (event) => event.preventDefault());
    document.body.append(link);
    link.click();
  });
  await expect.poll(() => eventNames(events)).toEqual(['pageview', 'YouTube Click']);
  expect(JSON.stringify(events.map((request) => JSON.parse(request.postData()!)))).not.toContain('private');
});

for (const mode of ['disabled', 'dnt', 'window-dnt', 'gpc', 'opt-out', 'storage-blocked']) {
  test(`analytics sends nothing with ${mode}`, async ({ page }) => {
    const events = await mockProduction(page, mode !== 'disabled');
    await page.addInitScript((mode) => {
      if (mode === 'dnt') Object.defineProperty(navigator, 'doNotTrack', { value: '1' });
      if (mode === 'window-dnt') Object.defineProperty(window, 'doNotTrack', { value: '1' });
      if (mode === 'gpc') Object.defineProperty(navigator, 'globalPrivacyControl', { value: true });
      if (mode === 'opt-out') localStorage.setItem('analytics-opt-out', 'true');
      if (mode === 'storage-blocked') Object.defineProperty(window, 'localStorage', { get() { throw new Error('Blocked'); } });
    }, mode);
    await page.goto(`${ANALYTICS_ORIGIN}/privacy/`);
    await expect(page.locator('#analytics-preference-status')).not.toBeEmpty();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('site-analytics-event', { detail: 'Wizard Results' })));
    await page.waitForLoadState('networkidle');
    expect(events).toHaveLength(0);
    if (['dnt', 'window-dnt', 'gpc'].includes(mode)) {
      await expect(page.getByRole('checkbox', { name: 'Disable analytics' })).toBeChecked();
      await expect(page.getByRole('checkbox', { name: 'Disable analytics' })).toBeDisabled();
    }
  });
}

test('privacy opt-out persists and can be removed without sending stored preferences', async ({ page }) => {
  const events = await mockProduction(page);
  await page.goto(`${ANALYTICS_ORIGIN}/privacy/`);
  await expect.poll(() => events.length).toBe(1);
  await page.getByRole('checkbox', { name: 'Disable analytics' }).check();
  await expect(page.locator('#analytics-preference-status')).toContainText('disabled in this browser');
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Disable analytics' })).toBeChecked();
  await page.waitForLoadState('networkidle');
  expect(events).toHaveLength(1);
  await page.getByRole('checkbox', { name: 'Disable analytics' }).uncheck();
  await page.reload();
  await expect.poll(() => events.length).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('analytics-opt-out'))).toBeNull();
});

test('wizard counts successful results, not failed attempts', async ({ page }) => {
  const events = await mockProduction(page);
  let attempts = 0;
  await page.route('**/controllers/matches/*.json', async (route) => {
    attempts++;
    if (attempts === 1) await route.fulfill({ status: 503, body: 'Unavailable' });
    else await route.fallback();
  });
  await page.goto(`${ANALYTICS_ORIGIN}/controllers/wizard/`);
  await page.getByRole('combobox', { name: 'Controller', exact: true }).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'General Aviation', exact: true }).click();
  await page.getByRole('button', { name: 'Quick setup', exact: true }).click();
  await page.locator('#wizard-run').click();
  await expect(page.locator('#wizard-status')).toContainText('could not be loaded');
  expect(eventNames(events)).toEqual(['pageview']);
  await page.locator('#wizard-run').click();
  await expect(page.locator('#wizard-results')).toBeVisible();
  await expect.poll(() => eventNames(events)).toEqual(['pageview', 'Wizard Results']);
});

for (const kind of ['xml', 'preset']) {
  test(`${kind} counts only downloads handed to the browser`, async ({ page }) => {
    const events = await mockProduction(page);
    await page.goto(`${ANALYTICS_ORIGIN}/controllers/`);
    const link = kind === 'xml' ? page.locator('.config-card .btn-download').first() : page.locator('[data-profile-filename]').first();
    await link.click();
    const button = page.locator('#profile-download');
    const source = await button.getAttribute('data-url');
    let attempts = 0;
    await page.route(source!, (route) => {
      attempts++;
      return route.fulfill({ status: attempts === 1 ? 503 : 200, contentType: 'application/octet-stream', body: 'profile fixture', headers: { 'access-control-allow-origin': '*' } });
    });
    await button.click();
    await expect(page.locator('#download-status')).toContainText('could not be downloaded');
    expect(eventNames(events).filter((name) => name !== 'pageview')).toEqual([]);
    const downloading = page.waitForEvent('download');
    await button.click();
    await downloading;
    await expect.poll(() => eventNames(events).filter((name) => name !== 'pageview')).toEqual([kind === 'xml' ? 'XML Download Started' : 'Preset Download Started']);
    expect(JSON.parse(events.at(-1)!.postData()!).url).toBe(`${ANALYTICS_ORIGIN}/controllers/download/${kind}/`);
  });
}

test('local preview does not send analytics even with configuration enabled', async ({ page }) => {
  const events: string[] = [];
  await page.route(ANALYTICS_ENDPOINT, (route) => { events.push(route.request().url()); return route.abort(); });
  await page.route('**/privacy/', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('name="site-analytics" content="disabled"', 'name="site-analytics" content="plausible"') });
  });
  await page.goto('/privacy/');
  await expect(page.locator('#analytics-preference-status')).not.toBeEmpty();
  await page.waitForLoadState('networkidle');
  expect(events).toHaveLength(0);
});

test('a failed opt-out write still suppresses events for the current page', async ({ page }) => {
  const events = await mockProduction(page);
  await page.goto(`${ANALYTICS_ORIGIN}/privacy/`);
  await expect.poll(() => events.length).toBe(1);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error('Storage full'); };
  });
  await page.getByRole('checkbox', { name: 'Disable analytics' }).check();
  await expect(page.locator('#analytics-preference-status')).toContainText('disabled for this page');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('site-analytics-event', { detail: 'YouTube Click' })));
  await page.waitForLoadState('networkidle');
  expect(events).toHaveLength(1);
});

test('favorites remain unmeasured even when analytics is enabled', async ({ page }) => {
  const events = await mockProduction(page);
  await page.goto(`${ANALYTICS_ORIGIN}/favorites/`);
  await page.waitForLoadState('networkidle');
  expect(events).toHaveLength(0);
});

test('blocked analytics cannot prevent a profile download or cause an unhandled error', async ({ page }) => {
  await mockProduction(page);
  const errors: string[] = [];
  const attempts: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(ANALYTICS_ENDPOINT, (route) => {
    attempts.push(JSON.parse(route.request().postData()!).name);
    return route.abort();
  });
  await page.goto(`${ANALYTICS_ORIGIN}/controllers/download/preset/ab6-a320-msfs2024/`);
  const button = page.locator('#profile-download');
  const source = await button.getAttribute('data-url');
  await page.route(source!, (route) => route.fulfill({ contentType: 'application/octet-stream', body: 'fixture', headers: { 'access-control-allow-origin': '*' } }));
  const downloading = page.waitForEvent('download');
  await button.click();
  await downloading;
  await expect(page.locator('#download-status')).toContainText('Download started');
  await page.waitForLoadState('networkidle');
  expect(attempts).toEqual(['pageview', 'Preset Download Started']);
  expect(errors).toEqual([]);
});