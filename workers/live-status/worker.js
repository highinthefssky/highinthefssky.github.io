/**
 * Cloudflare Worker: YouTube Live Status Checker
 * 
 * Checks if a YouTube channel is currently live by fetching the
 * channel's /live page — uses ZERO YouTube API quota.
 * 
 * Environment Variables Required (set in Cloudflare Dashboard):
 * - YOUTUBE_CHANNEL_ID: Your YouTube channel ID (starts with UC)
 * - ALLOWED_ORIGIN: Your website origin (e.g., https://highintheflightsimsky.nl)
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
 * Check if the channel is live by fetching the YouTube channel's /live page.
 * 
 * When a channel is streaming, youtube.com/channel/CHANNEL_ID/live serves a
 * page containing the live video's metadata in embedded JSON (ytInitialPlayerResponse).
 * When not live, the page either redirects to the channel's featured tab or
 * shows the most recent VOD.
 * 
 * This approach uses ZERO YouTube Data API quota.
 */
async function checkLiveStatus(env) {
  const { YOUTUBE_CHANNEL_ID } = env;

  if (!YOUTUBE_CHANNEL_ID) {
    throw new Error('Missing YOUTUBE_CHANNEL_ID environment variable');
  }

  const liveUrl = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}/live`;

  const response = await fetch(liveUrl, {
    headers: {
      // Request English to ensure consistent parsing of status text
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (compatible; LiveStatusBot/1.0)',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`YouTube page fetch error: ${response.status}`);
  }

  const html = await response.text();

  const scheduledStartTimeMatch = html.match(/"scheduledStartTime":\s*"([^"]+)"/) ||
                                  html.match(/"startTimestamp":\s*"([^"]+)"/) ||
                                  html.match(/<meta\s+(?:name|property)="video:release_date"\s+content="([^"]+)"/);
  const scheduledStartTime = scheduledStartTimeMatch ? scheduledStartTimeMatch[1] : null;

  // Check for robust live indicators in the page's embedded JSON data.
  // Relying on isLiveContent alone causes false positives for upcoming/ended streams.
  const isLiveNow = html.includes('"isLive":true') || html.includes('"isLiveNow":true');
  const isOfflineOrUpcoming =
    html.includes('"LIVE_STREAM_OFFLINE"') ||
    html.includes('"status":"LIVE_STREAM_OFFLINE"') ||
    html.includes('"isUpcoming":true');

  if (isOfflineOrUpcoming || !isLiveNow) {
    return { isLive: false };
  }

  // Safety guard: if a valid scheduled start time is still in the future,
  // treat the stream as not live even if other markers are stale/inconsistent.
  if (scheduledStartTime) {
    const scheduledStartMs = Date.parse(scheduledStartTime);
    if (!Number.isNaN(scheduledStartMs) && Date.now() < scheduledStartMs) {
      return { isLive: false };
    }
  }

  // Extract video ID from the canonical URL or og:url meta tag
  // Pattern: /watch?v=VIDEO_ID
  const videoIdMatch = html.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  if (!videoId) {
    // Page says live but we can't find a video ID — treat as not live
    return { isLive: false };
  }

  // Extract the stream title from og:title meta tag
  const titleMatch = html.match(/<meta\s+(?:name|property)="og:title"\s+content="([^"]*)"/) ||
                     html.match(/<meta\s+content="([^"]*)"\s+(?:name|property)="og:title"/);
  const title = titleMatch ? decodeHTMLEntities(titleMatch[1]) : 'Live now!';

  // Extract thumbnail
  const thumbMatch = html.match(/<meta\s+(?:name|property)="og:image"\s+content="([^"]*)"/) ||
                     html.match(/<meta\s+content="([^"]*)"\s+(?:name|property)="og:image"/);
  const thumbnail = thumbMatch ? thumbMatch[1] : null;

  return {
    isLive: true,
    videoId,
    title,
    thumbnail,
    scheduledStartTime,
  };
}

/**
 * Decode basic HTML entities in extracted text.
 */
function decodeHTMLEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&');
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
