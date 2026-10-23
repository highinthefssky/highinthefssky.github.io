import assert from 'node:assert/strict';
import test from 'node:test';
import worker, { LiveStatusCoordinator } from './worker.js';

const allowedOrigin = 'https://highintheflightsimsky.nl';
const channelId = 'UCyyc5Gnzs5sxgvOmJ96Rfqw';

function setup(entry) {
  let stored = entry;
  const pending = [];
  const state = {
    storage: {
      async get() { return structuredClone(stored); },
      async put(key, value) { stored = structuredClone(value); },
    },
    waitUntil(promise) { pending.push(promise); },
  };
  const env = { ALLOWED_ORIGIN: allowedOrigin, YOUTUBE_API_KEY: 'test-key', YOUTUBE_CHANNEL_ID: channelId };
  const coordinator = new LiveStatusCoordinator(state, env);
  env.LIVE_STATUS_COORDINATOR = {
    idFromName(name) {
      assert.equal(name, 'youtube-channel');
      return name;
    },
    get() { return coordinator; },
  };
  return { env, coordinator, state, pending };
}

function request(origin = allowedOrigin) {
  return new Request('https://worker.example', { headers: { Origin: origin } });
}

test('returns live metadata from the YouTube live page', async (t) => {
  const requests = [];

  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    requests.push({ url, options });

    if (url.includes('/feeds/videos.xml')) {
      return new Response('<feed><yt:videoId>YTIb1DVt7EU</yt:videoId></feed>');
    }
    return Response.json({
      items: [{
        id: 'YTIb1DVt7EU',
        snippet: {
          title: 'Test Live',
          liveBroadcastContent: 'live',
          thumbnails: {
            high: { url: 'https://example.com/live.jpg' },
          },
        },
        liveStreamingDetails: {
          actualStartTime: '2020-01-01T00:00:00Z',
        },
      }],
    });
  });

  const response = await worker.fetch(
    request(),
    setup().env,
  );

  assert.equal(response.status, 200);
  assert.equal(requests.length, 2);
  assert(requests.every(({ options }) => options.signal instanceof AbortSignal));
  assert.match(requests[0].url, new RegExp(`channel_id=${channelId}$`));
  const videosUrl = new URL(requests[1].url);
  assert.equal(videosUrl.origin, 'https://www.googleapis.com');
  assert.equal(videosUrl.searchParams.get('id'), 'YTIb1DVt7EU');
  assert.equal(videosUrl.searchParams.get('key'), 'test-key');
  assert.deepEqual(await response.json(), {
    isLive: true,
    videoId: 'YTIb1DVt7EU',
    title: 'Test Live',
    thumbnail: 'https://example.com/live.jpg',
    scheduledStartTime: '2020-01-01T00:00:00Z',
  });
});

test('reports a missing coordinator binding as an explicit service failure', async (t) => {
  t.mock.method(console, 'error', () => {});

  const response = await worker.fetch(
    request(),
    { ALLOWED_ORIGIN: allowedOrigin },
    { waitUntil() {} },
  );

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    isLive: false,
    error: 'Failed to check live status',
  });
});

  test('deduplicates 20 cold-cache requests and stores a fresh result', async (t) => {
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async (url) => {
      calls++;
      if (url.includes('/feeds/')) return new Response('<yt:videoId>abcdefghijk</yt:videoId>');
      return Response.json({ items: [] });
    });
    const { env } = setup();
    const responses = await Promise.all(Array.from({ length: 20 }, () => worker.fetch(request(), env)));
    assert(responses.every((response) => response.status === 200));
    for (const response of responses) assert.deepEqual(await response.json(), { isLive: false });
    assert.equal(calls, 2);
    const cached = await worker.fetch(request(), env);
    assert.deepEqual(await cached.json(), { isLive: false });
    assert.equal(calls, 2);
    assert.equal(cached.headers.get('Vary'), 'Origin');
  });

  test('does not refresh before the five-minute freshness deadline', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 100_000 });
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async (url) => {
      calls++;
      if (url.includes('/feeds/')) return new Response('<yt:videoId>abcdefghijk</yt:videoId>');
      return Response.json({ items: [] });
    });
    const { env, pending } = setup();
    await worker.fetch(request(), env);
    t.mock.timers.tick(299_999);
    await worker.fetch(request(), env);
    assert.equal(calls, 2);
    t.mock.timers.tick(1);
    const expired = await worker.fetch(request(), env);
    assert.equal((await expired.json()).stale, true);
    await Promise.all(pending);
    assert.equal(calls, 4);
  });

  test('serves marked stale data during refresh and does not cache it in browsers', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 100_000 });
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async (url) => {
      calls++;
      await gate;
      if (url.includes('/feeds/')) return new Response('<yt:videoId>abcdefghijk</yt:videoId>');
      return Response.json({ items: [] });
    });
    const { env, pending } = setup({
      data: { isLive: true, videoId: 'abcdefghijk' }, freshUntil: 99_000,
      retryAt: 99_000, staleUntil: 200_000,
    });
    const responses = await Promise.all(Array.from({ length: 20 }, () => worker.fetch(request(), env)));
    assert.equal(calls, 1);
    for (const response of responses) {
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.equal((await response.json()).stale, true);
    }
    release();
    await Promise.all(pending);
    assert.equal(calls, 2);
    assert.deepEqual(await (await worker.fetch(request(), env)).json(), { isLive: false });
  });

  test('persists failure backoff across coordinator recreation and retries after a minute', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 100_000 });
    t.mock.method(console, 'error', () => {});
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => {
      calls++;
      return new Response('Unavailable', { status: 503 });
    });
    const { env, state } = setup();
    assert.equal((await worker.fetch(request(), env)).status, 503);
    const recreated = new LiveStatusCoordinator(state, env);
    env.LIVE_STATUS_COORDINATOR.get = () => recreated;
    const backoff = await worker.fetch(request(), env);
    assert.equal(backoff.status, 503);
    assert.equal(backoff.headers.get('Retry-After'), '60');
    assert.equal(calls, 1);
    t.mock.timers.tick(59_999);
    assert.equal((await worker.fetch(request(), env)).status, 503);
    assert.equal(calls, 1);
    t.mock.timers.tick(1);
    assert.equal((await worker.fetch(request(), env)).status, 503);
    assert.equal(calls, 2);
  });

  test('reservation survives eviction before an upstream refresh finishes', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 100_000 });
    t.mock.method(console, 'error', () => {});
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => {
      calls++;
      await gate;
      return new Response('Unavailable', { status: 503 });
    });
    const { env, state } = setup();
    const first = worker.fetch(request(), env);
    while (calls === 0) await new Promise((resolve) => setImmediate(resolve));
    const recreated = new LiveStatusCoordinator(state, env);
    assert.equal((await recreated.fetch()).status, 503);
    assert.equal(calls, 1);
    release();
    await first;
  });

  test('expired stale results are not returned and failed refreshes are explicit', async (t) => {
    t.mock.timers.enable({ apis: ['Date'], now: 100_000 });
    t.mock.method(console, 'error', () => {});
    t.mock.method(globalThis, 'fetch', async () => { throw new Error('timeout'); });
    const { env } = setup({
      data: { isLive: true }, freshUntil: 1, retryAt: 1, staleUntil: 99_999,
    });
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { isLive: false, error: 'Failed to check live status' });
  });

  test('rejects disallowed origins and methods without reaching the coordinator', async () => {
    const env = setup().env;
    env.LIVE_STATUS_COORDINATOR.get = () => { throw new Error('Must not reach coordinator'); };
    assert.equal((await worker.fetch(request('https://evil.example'), env)).status, 403);
    assert.equal((await worker.fetch(new Request('https://worker.example'), env)).status, 403);
    assert.equal((await worker.fetch(new Request('https://worker.example', { method: 'POST' }), env)).status, 405);
    assert.equal((await worker.fetch(new Request('https://worker.example', { method: 'OPTIONS' }), env)).status, 204);
  });

  test('cache storage failures produce an explicit service failure', async (t) => {
    t.mock.method(console, 'error', () => {});
    const { coordinator, state } = setup();
    state.storage.put = async () => { throw new Error('storage unavailable'); };
    assert.equal((await coordinator.fetch()).status, 503);
  });
