/**
 * Cloudflare Worker: YouTube Live Status Proxy
 * 
 * This worker securely proxies requests to the YouTube API,
 * keeping the API key hidden from the client.
 * 
 * Environment Variables Required (set in Cloudflare Dashboard):
 * - YOUTUBE_API_KEY: Your YouTube Data API v3 key
 * - YOUTUBE_CHANNEL_ID: Your YouTube channel ID (starts with UC)
 * - ALLOWED_ORIGIN: Your website origin (e.g., https://highintheflightsimsky.nl)
 */

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
      const liveStatus = await checkLiveStatus(env);
      
      return new Response(JSON.stringify(liveStatus), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin || allowedOrigin,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
          // Cache for 30 seconds to reduce API calls
          'Cache-Control': 'public, max-age=30',
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

async function checkLiveStatus(env) {
  const { YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID } = env;

  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    throw new Error('Missing environment variables');
  }

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', YOUTUBE_CHANNEL_ID);
  searchUrl.searchParams.set('eventType', 'live');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('key', YOUTUBE_API_KEY);
  searchUrl.searchParams.set('maxResults', '1');

  const response = await fetch(searchUrl.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const liveVideo = data.items[0];
    return {
      isLive: true,
      videoId: liveVideo.id.videoId,
      title: liveVideo.snippet.title,
      thumbnail: liveVideo.snippet.thumbnails?.medium?.url || null,
    };
  }

  return { isLive: false };
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
