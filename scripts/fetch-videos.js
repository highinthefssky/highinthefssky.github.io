#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleAuth } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Starting YouTube video fetch script...');
console.log(`📁 Script location: ${__filename}`);
console.log(`📂 Working directory: ${process.cwd()}`);

const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const VIDEOS_DIR = path.join(__dirname, '../src/content/videos');

// Check if using OIDC (GOOGLE_APPLICATION_CREDENTIALS) or legacy API key
const useOIDC = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

console.log(`🎯 Target directory: ${VIDEOS_DIR}`);
console.log(`🔐 Authentication mode: ${useOIDC ? 'Google Cloud OIDC' : 'API Key'}`);
console.log(`📺 Channel ID: ${YOUTUBE_CHANNEL_ID || 'Not set'}`);

if (!YOUTUBE_CHANNEL_ID) {
  console.error('❌ Error: YOUTUBE_CHANNEL_ID environment variable is required');
  process.exit(1);
}

if (!useOIDC && !YOUTUBE_API_KEY) {
  console.error('❌ Error: Either GOOGLE_APPLICATION_CREDENTIALS (OIDC) or YOUTUBE_API_KEY is required');
  process.exit(1);
}

// Validate channel ID format (should start with UC and be 24 characters)
if (!YOUTUBE_CHANNEL_ID.startsWith('UC') || YOUTUBE_CHANNEL_ID.length !== 24) {
  console.error(`❌ Error: YOUTUBE_CHANNEL_ID should be a valid channel ID starting with 'UC' (got: ${YOUTUBE_CHANNEL_ID})`);
  console.error('💡 Channel IDs look like: UC1234567890abcdef...');
  process.exit(1);
}

console.log('✅ Environment validation passed');
console.log(`🔍 Channel ID format valid: ${YOUTUBE_CHANNEL_ID}`);

// Helper function to make authenticated YouTube API requests
async function youtubeApiFetch(url, accessToken) {
  const headers = {};
  let finalUrl = url;
  
  if (useOIDC && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  } else if (YOUTUBE_API_KEY) {
    finalUrl = `${url}${url.includes('?') ? '&' : '?'}key=${YOUTUBE_API_KEY}`;
  }
  
  return fetch(finalUrl, { headers });
}

// Get access token for OIDC authentication
async function getAccessToken() {
  if (!useOIDC) return null;
  
  console.log('🔐 Obtaining Google Cloud access token via OIDC...');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/youtube.readonly']
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  console.log('✅ Access token obtained successfully');
  return tokenResponse.token;
}

// Helper: handle YouTube API errors with a soft exit for quota exceeded
async function handleApiError(response, context) {
  let parsed = null;
  const errorText = await response.text();
  try { parsed = JSON.parse(errorText); } catch {}
  const isQuotaExceeded = parsed?.error?.errors?.some((e) => e.reason === 'quotaExceeded');
  if (isQuotaExceeded) {
    console.warn(`⚠️ YouTube API quota exceeded (${context}). Quota resets at midnight Pacific Time (≈08:00 UTC).`);
    console.warn('⚠️ Skipping fetch — will retry on next scheduled run.');
    process.exit(0); // soft exit — don't fail the workflow on quota exhaustion
  }
  console.error(`❌ ${context} error response:`, errorText);
  throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
}

async function fetchVideos() {
  const startTime = Date.now();
  try {
    console.log('\n🚀 Starting video fetch process...');

    const refreshExisting = (process.env.REFRESH_EXISTING || '').toLowerCase() === 'true';
    const forceSync = (process.env.FORCE_SYNC || '').toLowerCase() === 'true';
    const minSyncIntervalHours = Number(process.env.MIN_SYNC_INTERVAL_HOURS || 20);
    console.log(`🔄 Refresh mode: ${refreshExisting ? 'full refresh' : 'delta (new only)'}`);
    console.log(`⏱️ Minimum sync interval: ${minSyncIntervalHours} hour(s)${forceSync ? ' (force override enabled)' : ''}`);

    // Pre-load existing video IDs so delta-mode pagination can exit early
    const existingIds = fs.existsSync(VIDEOS_DIR)
      ? new Set(
          fs
            .readdirSync(VIDEOS_DIR)
            .filter((f) => f.endsWith('.json'))
            .map((f) => path.parse(f).name)
        )
      : new Set();
    console.log(`📁 Found ${existingIds.size} existing video files`);

    // Read cached stats to restore fields not managed by this script (e.g. totalControllers)
    const statsFile = path.join(__dirname, '../src/content/stats.json');
    let cachedStats = {};
    if (fs.existsSync(statsFile)) {
      try {
        cachedStats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
      } catch (e) {
        console.warn(`⚠️ Could not read cached stats: ${e.message}`);
      }
    }

    // Guard against repeated manual retries consuming quota in the same window.
    if (!refreshExisting && !forceSync && Number.isFinite(minSyncIntervalHours) && minSyncIntervalHours > 0 && cachedStats.updatedAt) {
      const lastUpdatedAtMs = Date.parse(cachedStats.updatedAt);
      if (!Number.isNaN(lastUpdatedAtMs)) {
        const elapsedMs = Date.now() - lastUpdatedAtMs;
        const minIntervalMs = minSyncIntervalHours * 60 * 60 * 1000;
        if (elapsedMs < minIntervalMs) {
          const remainingMs = minIntervalMs - elapsedMs;
          const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
          console.log(`🛑 Last sync was too recent (${cachedStats.updatedAt}). Skipping API calls to protect quota.`);
          console.log(`⏳ Try again in ~${remainingMinutes} minute(s), or set FORCE_SYNC=true to override.`);
          return;
        }
      }
    }

    // Get access token if using OIDC
    const accessToken = await getAccessToken();

    // Get public IP for debugging
    const publicIpResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
    const publicIpData = publicIpResponse ? await publicIpResponse.json() : { ip: 'Unknown' };
    console.log(`📍 Public IP: ${publicIpData.ip}`);

    // Step 1: Get uploads playlist ID — use cached value in delta mode to save one quota unit
    let uploadsPlaylistId = cachedStats.uploadsPlaylistId || null;
    let subscriberCount = cachedStats.youtubeSubscribers || 0;

    if (!uploadsPlaylistId || refreshExisting) {
      console.log('\n📡 Step 1: Fetching channel information...');
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${YOUTUBE_CHANNEL_ID}`;
      console.log(`🌐 Channel API URL: ${channelUrl}`);

      const channelResponse = await youtubeApiFetch(channelUrl, accessToken);
      console.log(`📊 Channel API response status: ${channelResponse.status} ${channelResponse.statusText}`);

      if (!channelResponse.ok) {
        await handleApiError(channelResponse, 'Channel API');
      }

      const channelData = await channelResponse.json();
      console.log('📦 Channel API response received');

      if (!channelData.items || channelData.items.length === 0) {
        console.error('❌ Channel not found or API response invalid:', JSON.stringify(channelData, null, 2));
        throw new Error(`Channel with ID "${YOUTUBE_CHANNEL_ID}" not found or API key invalid`);
      }

      subscriberCount = parseInt(channelData.items[0].statistics?.subscriberCount || 0);
      console.log(`👥 Channel subscribers: ${subscriberCount.toLocaleString()}`);

      uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        console.error('❌ Channel does not have an uploads playlist');
        throw new Error(`Channel "${YOUTUBE_CHANNEL_ID}" does not have an uploads playlist`);
      }
      console.log(`📋 Uploads playlist ID: ${uploadsPlaylistId}`);
    } else {
      console.log(`\n📋 Step 1: Using cached uploads playlist ID (skipping channels API call)`);
      console.log(`  playlist ID: ${uploadsPlaylistId}`);
      console.log(`  subscribers: ${subscriberCount.toLocaleString()} (cached)`);
    }

    // Step 2: Get videos from playlist (paginated, with early-exit for delta mode)
    console.log('\n📡 Step 2: Fetching playlist videos (paginated)...');
    async function fetchAllPlaylistItems(playlistId) {
      let pageToken = '';
      const allItems = [];
      let page = 1;
      while (true) {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}`;
        console.log(`🌐 Playlist API URL (page ${page}): ${url}`);
        const res = await youtubeApiFetch(url, accessToken);
        console.log(`📊 Playlist API response status (page ${page}): ${res.status} ${res.statusText}`);
        if (!res.ok) {
          await handleApiError(res, `Playlist API page ${page}`);
        }
        const data = await res.json();
        const items = data.items || [];
        console.log(`📦 Received ${items.length} items on page ${page}`);
        allItems.push(...items);

        // Early-exit for delta mode: YouTube returns items newest-first, so once all items on a
        // page are already known there is no new content on any subsequent page.
        if (!refreshExisting && items.length > 0) {
          const newOnPage = items.filter((item) => {
            const id = item.contentDetails?.videoId;
            return id && !existingIds.has(id);
          });
          if (newOnPage.length === 0) {
            console.log(`🚫 All ${items.length} items on page ${page} already exist — stopping pagination early (saved quota)`);
            break;
          }
        }

        if (!data.nextPageToken) {
          break;
        }
        pageToken = data.nextPageToken;
        page += 1;
      }
      return allItems;
    }

    const playlistItems = await fetchAllPlaylistItems(uploadsPlaylistId);
    if (!playlistItems || playlistItems.length === 0) {
      console.log('⚠️ No videos found in uploads playlist');
      return; // Exit gracefully if no videos
    }
    console.log(`📹 Found ${playlistItems.length} total videos in playlist (all pages)`);

    // Determine delta: which video IDs are new (not yet saved)
    const videoIds = playlistItems.map((item) => item.contentDetails.videoId).filter(Boolean);
    const idsToFetch = refreshExisting ? videoIds : videoIds.filter((id) => !existingIds.has(id));
    console.log(`🧮 Existing files: ${existingIds.size} | New to fetch: ${idsToFetch.length}${refreshExisting ? ' (refreshing all)' : ''}`);

    if (idsToFetch.length === 0) {
      console.log('✅ No new videos to import. Skipping details fetch.');
    }

// Save stats — merge with existing file to preserve fields from other scripts (e.g. totalControllers).
    // totalVideos is only reliable after a full-refresh paginate; in delta mode keep the cached count.
    const totalVideosForStats = refreshExisting ? videoIds.length : (cachedStats.totalVideos || videoIds.length);
    const stats = {
      ...cachedStats,
      youtubeSubscribers: subscriberCount,
      totalVideos: totalVideosForStats,
      uploadsPlaylistId: uploadsPlaylistId,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(`✅ Saved stats to ${statsFile} (totalVideos: ${totalVideosForStats})`);

    // Helper: chunk IDs into batches of 50 (API limit)
    function chunkArray(arr, size) {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    }

    // Fetch detailed info for each video (in batches)
    console.log('\n📡 Step 3: Fetching detailed video information in batches...');
    const idBatches = chunkArray(idsToFetch, 50);
    const detailedItems = [];
    for (let i = 0; i < idBatches.length; i++) {
      const batch = idBatches[i];
      const batchUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${batch.join(',')}`;
      console.log(`🌐 Videos API URL (batch ${i + 1}/${idBatches.length}): ${batchUrl}`);
      const res = await youtubeApiFetch(batchUrl, accessToken);
      console.log(`📊 Videos API response status (batch ${i + 1}): ${res.status} ${res.statusText}`);
      if (!res.ok) {
        await handleApiError(res, `Videos API batch ${i + 1}`);
      }
      const data = await res.json();
      const items = data.items || [];
      console.log(`📦 Received ${items.length} details in batch ${i + 1}`);
      detailedItems.push(...items);
    }

    if (idsToFetch.length > 0 && detailedItems.length === 0) {
      console.log('⚠️ No video details retrieved from YouTube API');
      return; // Exit gracefully if no video details
    }

    console.log(`🎯 Processing ${detailedItems.length} video details (new/refresh)`);

    // Transform and save videos
    console.log('\n💾 Step 4: Saving video files...');

    // Ensure video directory exists
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
      console.log(`📁 Created videos directory: ${VIDEOS_DIR}`);
    } else {
      console.log(`📁 Videos directory exists: ${VIDEOS_DIR}`);
    }

    const videos = (idsToFetch.length === 0 ? [] : detailedItems)
      .filter((item) => {
        if (!item.id || !item.snippet) {
          console.log(`⚠️ Skipping video: missing id or snippet`);
          return false;
        }

        const duration = parseDuration(item.contentDetails?.duration || 'PT0S');
        if (duration <= 0) {
          console.log(`⚠️ Skipping video ${item.id}: invalid duration (${item.contentDetails?.duration || 'unknown'} → ${duration}s)`);
          return false;
        }

        return true;
      })
      .map((item) => {
        console.log(`🔄 Processing video: ${item.id}`);

        const duration = parseDuration(item.contentDetails?.duration || 'PT0S');
        const filename = `${item.id}.json`;
        const filePath = path.join(VIDEOS_DIR, filename);

        const videoData = {
          videoId: item.id,
          title: item.snippet?.title || 'Untitled Video',
          description: item.snippet?.description || '',
          thumbnail: item.snippet?.thumbnails?.maxresdefault?.url || item.snippet?.thumbnails?.standard?.url || item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          thumbnailMedium: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt).toISOString() : new Date().toISOString(),
          duration: duration,
          viewCount: parseInt(item.statistics?.viewCount || '0', 10),
          tags: item.snippet?.tags || [],
          featured: false,
        };

        fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
        console.log(`✅ Saved: ${filename} - "${videoData.title}"`);

        return videoData;
      });

    // Delta import summary
    const addedCount = videos.length;
    const totalIds = videoIds.length;
    const skippedCount = refreshExisting ? 0 : (totalIds - idsToFetch.length);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n🎉 Successfully processed ${addedCount} new/updated videos`);
    console.log(`🧾 Summary: paged IDs=${totalIds}, toFetch=${idsToFetch.length}, skipped=${skippedCount}${refreshExisting ? ' (full refresh)' : ' (delta)'}`);
    console.log(`⏱️ Total execution time: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Videos saved to: ${VIDEOS_DIR}`);

  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.error(`❌ Error fetching videos after ${duration.toFixed(2)} seconds:`, error.message);
    process.exit(1);
  }
}

function parseDuration(duration) {
  console.log(`⏱️ Parsing duration: ${duration}`);
  // PT1H2M3S -> seconds
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    console.log(`⚠️ Could not parse duration: ${duration}, defaulting to 1 second`);
    return 1; // Return minimum 1 second instead of 0
  }

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Ensure minimum duration of 1 second
  const finalDuration = Math.max(totalSeconds, 1);

  console.log(`✅ Parsed duration: ${duration} → ${finalDuration} seconds`);
  return finalDuration;
}

console.log('\n🎬 Starting video fetch execution...');
fetchVideos().then(() => {
  console.log('\n🏁 Script execution completed successfully');
}).catch((error) => {
  console.error('\n💥 Script execution failed:', error);
  process.exit(1);
});
