import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.js';

const allowedOrigin = 'https://highintheflightsimsky.nl';
const channelId = 'UCyyc5Gnzs5sxgvOmJ96Rfqw';

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
    new Request('https://worker.example', { headers: { Origin: allowedOrigin } }),
    { ALLOWED_ORIGIN: allowedOrigin, YOUTUBE_API_KEY: 'test-key', YOUTUBE_CHANNEL_ID: channelId },
    { waitUntil() {} },
  );

  assert.equal(response.status, 200);
  assert.equal(requests.length, 2);
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
