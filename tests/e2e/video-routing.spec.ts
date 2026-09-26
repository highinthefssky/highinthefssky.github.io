import { expect, test, type APIRequestContext } from '@playwright/test';

async function expectVideoDestination(request: APIRequestContext, href: string, videoId?: string) {
  const response = await request.get(href);
  expect(response.status(), `${href} must resolve to a video detail page`).toBe(200);
  const html = await response.text();
  expect(html).toContain('"@type":"VideoObject"');
  expect(html, `${href} must use the exact canonical route casing`).toContain(
    `rel="canonical" href="https://highintheflightsimsky.nl${href}"`
  );
  if (videoId) {
    expect(html).toContain(`https://www.youtube.com/embed/${videoId}`);
  }
}

test('homepage carousel links open the intended videos', async ({ page, request }) => {
  await page.goto('/');
  const links = await page.locator('.slide-link').evaluateAll((elements) =>
    elements.map((element) => ({
      href: element.getAttribute('href')!,
      videoId: element.querySelector('img')!.src.split('/vi/')[1].split('/')[0],
    }))
  );
  expect(links).toHaveLength(3);
  for (const link of links) {
    await expectVideoDestination(request, link.href, link.videoId);
  }
});

test('every learning track lesson links to its intended video', async ({ page, request }) => {
  await page.goto('/tracks/');
  const trackLinks = await page.locator('main a[href^="/tracks/"]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('href')!)
  );
  expect(trackLinks.length).toBeGreaterThan(0);
  for (const trackHref of new Set(trackLinks)) {
    await page.goto(trackHref);
    const lessons = await page.locator('.lesson-link-video').evaluateAll((elements) =>
      elements.map((element) => ({
        href: element.getAttribute('href')!,
        videoId: element.closest('[data-lesson-id]')!.getAttribute('data-lesson-id')!.replace(/^\d+-/, ''),
      }))
    );
    expect(lessons.length, trackHref).toBeGreaterThan(0);
    for (const lesson of lessons) {
      await expectVideoDestination(request, lesson.href, lesson.videoId);
    }
  }
});

test('wizard recommendations link to their intended videos', async ({ page, request }) => {
  await page.goto('/controllers/wizard');
  await page.locator('#wizard-controller').selectOption({ index: 1 });
  await page.locator('#aircraft-chips [data-value="general"]').click();
  await page.locator('#goal-chips [data-value="setup"]').click();
  await page.locator('#wizard-run').click();
  await expect(page.locator('#video-results .video-card').first()).toBeVisible();
  const results = await page.locator('#video-results .video-card').evaluateAll((elements) =>
    elements.map((element) => ({
      href: element.querySelector('a.result-link')!.getAttribute('href')!,
      videoId: element.querySelector('img')!.src.split('/vi/')[1].split('/')[0],
    }))
  );
  for (const result of results) {
    await expectVideoDestination(request, result.href, result.videoId);
  }
});

test('saved mixed-case YouTube IDs retain working favorites links', async ({ page, request }) => {
  const videoId = 'fdYyTnh5WFk';
  await page.addInitScript((savedVideoId) => {
    localStorage.setItem('fav-videos', JSON.stringify([savedVideoId]));
  }, videoId);
  await page.goto('/favorites');
  const card = page.locator(`[data-fav-video-id="${videoId}"] .video-card`).first();
  await expect(card).toBeVisible();
  const href = await card.locator('.video-card-link').getAttribute('href');
  expect(href).toBeTruthy();
  await expectVideoDestination(request, href!, videoId);
  const response = await page.goto(href!);
  expect(response?.status()).toBe(200);
  await expect(page.locator('.player-iframe')).toHaveAttribute('src', `https://www.youtube.com/embed/${videoId}`);
  await expect(page.locator('.detail-fav-btn')).toHaveClass(/saved/);
});