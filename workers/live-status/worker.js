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

// Cache key for KV storage
const CACHE_KEY = 'live-status';
// Cache TTL in seconds — limits how often we fetch the YouTube page.
// Since this no longer costs API quota, 5 minutes is a comfortable interval
// that balances responsiveness with polite scraping.
const CACHE_TTL_SECONDS = 300; // 5 minutes

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(env);
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Validate origin - require Origin header for security
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
      const liveStatus = await getCachedLiveStatus(env, ctx);
      
      return new Response(JSON.stringify(liveStatus), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
          // Client-side cache matches KV TTL
          'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`,
        },
      });
    } catch (error) {
      console.error('Error checking live status:', error);
      
      return new Response(JSON.stringify({ 
        isLive: false, 
        error: 'Failed to check live status' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || allowedOrigin,
        },
      });
    }
  },
};

/**
 * Get live status from KV cache, falling back to a fresh check.
 * This ensures at most 1 page fetch per CACHE_TTL_SECONDS, regardless of traffic.
 */
async function getCachedLiveStatus(env, ctx) {
  // Try reading from KV cache first
  if (env.LIVE_STATUS_CACHE) {
    const cached = await env.LIVE_STATUS_CACHE.get(CACHE_KEY, { type: 'json' });
    if (cached !== null) {
      return cached;
    }
  }

  // Cache miss — check YouTube channel live page
  const liveStatus = await checkLiveStatus(env);

  // Store the result in KV with TTL so it auto-expires
  if (env.LIVE_STATUS_CACHE) {
    ctx.waitUntil(
      env.LIVE_STATUS_CACHE.put(CACHE_KEY, JSON.stringify(liveStatus), {
        expirationTtl: CACHE_TTL_SECONDS,
      })
    );
  }

  return liveStatus;
}

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
    { headers }
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
  const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`);

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
