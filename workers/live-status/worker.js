/**
 * Cloudflare Worker: YouTube Live Status Checker
 * 
 * Checks if a YouTube channel is currently live by combining its
 * public RSS feed with the YouTube Data API.
 * 
 * Environment Variables Required:
 * - YOUTUBE_CHANNEL_ID: Public YouTube channel ID (starts with UC)
 * - ALLOWED_ORIGIN: Your website origin (e.g., https://highintheflightsimsky.nl)
 * - YOUTUBE_API_KEY: YouTube Data API v3 key (Cloudflare secret)
 */

const CACHE_KEY = 'live-status';
const CACHE_TTL_SECONDS = 300; // 5 minutes
const FAILURE_BACKOFF_MS = 60_000;
const MAX_STALE_MS = 60 * 60_000;
const UPSTREAM_TIMEOUT_MS = 10_000;

const unavailable = () => ({
  status: 503,
  body: { isLive: false, error: 'Failed to check live status' },
});

function cachedResult(entry, now) {
  if (!entry?.data || now >= entry.staleUntil) return unavailable();
  return { status: 200, body: { ...entry.data, stale: true } };
}

export class LiveStatusCoordinator {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.refresh = null;
  }

  async fetch() {
    try {
      const entry = await this.state.storage.get(CACHE_KEY);
      const now = Date.now();
      if (entry?.data && now < entry.freshUntil) {
        return Response.json(entry.data);
      }
      if (!this.refresh && now >= (entry?.retryAt || 0)) {
        this.refresh = this.update(entry).catch((error) => {
          console.error('Live status cache update failed:', error);
          return unavailable();
        }).finally(() => { this.refresh = null; });
      }
      if (entry?.data && now < entry.staleUntil) {
        if (this.refresh) this.state.waitUntil(this.refresh);
        return Response.json(cachedResult(entry, now).body);
      }
      const result = this.refresh ? await this.refresh : unavailable();
      return Response.json(result.body, { status: result.status });
    } catch (error) {
      console.error('Live status coordinator failed:', error);
      return Response.json(unavailable().body, { status: 503 });
    }
  }

  async update(entry) {
    // Persist a reservation before network I/O so an eviction cannot bypass backoff.
    await this.state.storage.put(CACHE_KEY, {
      ...entry,
      retryAt: Date.now() + CACHE_TTL_SECONDS * 1000,
    });
    let data;
    try {
      data = await checkLiveStatus(this.env);
    } catch (error) {
      console.error('YouTube live status refresh failed:', error);
      await this.state.storage.put(CACHE_KEY, {
        ...entry,
        retryAt: Date.now() + FAILURE_BACKOFF_MS,
      });
      return cachedResult(entry, Date.now());
    }
    const now = Date.now();
    await this.state.storage.put(CACHE_KEY, {
      data,
      freshUntil: now + CACHE_TTL_SECONDS * 1000,
      staleUntil: now + MAX_STALE_MS,
      retryAt: now + CACHE_TTL_SECONDS * 1000,
    });
    return { status: 200, body: data };
  }
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(env);
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // CORS limits browser consumers, not clients that can supply their own Origin.
    const origin = request.headers.get('Origin');
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://highintheflightsimsky.nl';
    const allowLocalhost = env.ALLOW_LOCALHOST === 'true';
    
    // Check if origin is allowed
    const isAllowed = origin === allowedOrigin || 
                      (allowLocalhost && (origin?.startsWith('http://localhost:') ||
                                          origin?.startsWith('http://127.0.0.1:')));

    // Require origin header and validate it
    if (!origin || !isAllowed) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      if (!env.LIVE_STATUS_COORDINATOR) {
        throw new Error('Missing LIVE_STATUS_COORDINATOR binding');
      }
      const id = env.LIVE_STATUS_COORDINATOR.idFromName('youtube-channel');
      const response = await env.LIVE_STATUS_COORDINATOR.get(id).fetch('https://live-status.internal/');
      const liveStatus = await response.json();
      
      return new Response(JSON.stringify(liveStatus), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
          'Cache-Control': response.ok && !liveStatus.stale
            ? `public, max-age=${CACHE_TTL_SECONDS}` : 'no-store',
          'Vary': 'Origin',
          ...(!response.ok ? { 'Retry-After': String(FAILURE_BACKOFF_MS / 1000) } : {}),
        },
      });
    } catch (error) {
      console.error('Error checking live status:', error);
      
      return new Response(JSON.stringify({ 
        isLive: false, 
        error: 'Failed to check live status' 
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || allowedOrigin,
          'Cache-Control': 'no-store',
          'Retry-After': String(FAILURE_BACKOFF_MS / 1000),
          'Vary': 'Origin',
        },
      });
    }
  },
};

/**
 * Check recent channel videos using the public RSS feed and one videos.list request.
 * The channel /live page cannot be used reliably because YouTube rate-limits
 * requests from Cloudflare datacenter IPs.
 */
async function checkLiveStatus(env) {
  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = env;

  if (!YOUTUBE_CHANNEL_ID) {
    throw new Error('Missing YOUTUBE_CHANNEL_ID environment variable');
  }
  if (!YOUTUBE_API_KEY) {
    throw new Error('Missing YOUTUBE_API_KEY environment variable');
  }

  const headers = {
    'Accept-Language': 'en-US,en;q=0.9',
    'User-Agent': 'Mozilla/5.0 (compatible; LiveStatusBot/1.0)',
  };
  const feedResponse = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`,
    { headers, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) }
  );

  if (!feedResponse.ok) {
    throw new Error(`YouTube feed fetch error: ${feedResponse.status}`);
  }

  const feed = await feedResponse.text();
  const videoIds = [...feed.matchAll(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/g)]
    .slice(0, 5)
    .map((match) => match[1]);

  if (videoIds.length === 0) {
    throw new Error('YouTube feed contained no video IDs');
  }

  const params = new URLSearchParams({
    part: 'snippet,liveStreamingDetails',
    id: videoIds.join(','),
    key: YOUTUBE_API_KEY,
  });
  const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`, {
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!videosResponse.ok) {
    throw new Error(`YouTube Data API error: ${videosResponse.status}`);
  }

  const videos = await videosResponse.json();
  const liveVideo = videos.items?.find((item) =>
    item.snippet?.liveBroadcastContent === 'live' &&
    !item.liveStreamingDetails?.actualEndTime
  );

  if (!liveVideo) {
    return { isLive: false };
  }

  const thumbnails = liveVideo.snippet.thumbnails || {};
  const thumbnail =
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    null;

  return {
    isLive: true,
    videoId: liveVideo.id,
    title: liveVideo.snippet.title || 'Live now!',
    thumbnail,
    scheduledStartTime:
      liveVideo.liveStreamingDetails?.actualStartTime ||
      liveVideo.liveStreamingDetails?.scheduledStartTime ||
      null,
  };
}

function handleCORS(env) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://highintheflightsimsky.nl',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
