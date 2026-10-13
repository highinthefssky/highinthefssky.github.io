import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.js';

const allowedOrigin = 'https://highintheflightsimsky.nl';
const channelId = 'UCyyc5Gnzs5sxgvOmJ96Rfqw';

test('returns live metadata from the YouTube live page', async (t) => {
  let requestedUrl;
  let requestedHeaders;

  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requestedUrl = url;
    requestedHeaders = options.headers;

    return new Response(`
      <html>
        <head>
          <meta name="title" content="Test &amp; Live">
          <meta property="og:image" content="https://example.com/live.jpg">
        </head>
        <body>
          {"isLive":true,"videoId":"YTIb1DVt7EU","scheduledStartTime":"2020-01-01T00:00:00Z"}
        </body>
      </html>
    `);
  });

  const response = await worker.fetch(
    new Request('https://worker.example', { headers: { Origin: allowedOrigin } }),
    { ALLOWED_ORIGIN: allowedOrigin, YOUTUBE_CHANNEL_ID: channelId },
    { waitUntil() {} },
  );

  assert.equal(response.status, 200);
  assert.equal(requestedUrl, `https://www.youtube.com/channel/${channelId}/live`);
  assert.match(requestedHeaders.Cookie, /CONSENT=YES/);
  assert.deepEqual(await response.json(), {
    isLive: true,
    videoId: 'YTIb1DVt7EU',
    title: 'Test & Live',
    thumbnail: 'https://example.com/live.jpg',
    scheduledStartTime: '2020-01-01T00:00:00Z',
  });
});

test('reports a missing channel binding as an explicit server failure', async (t) => {
  t.mock.method(console, 'error', () => {});

  const response = await worker.fetch(
    new Request('https://worker.example', { headers: { Origin: allowedOrigin } }),
    { ALLOWED_ORIGIN: allowedOrigin },
    { waitUntil() {} },
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {
    isLive: false,
    error: 'Failed to check live status',
  });
});
