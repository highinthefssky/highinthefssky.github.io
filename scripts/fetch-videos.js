#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Starting YouTube video fetch script...');
console.log(`📁 Script location: ${__filename}`);
console.log(`📂 Working directory: ${process.cwd()}`);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const VIDEOS_DIR = path.join(__dirname, '../src/content/videos');

console.log(`🎯 Target directory: ${VIDEOS_DIR}`);
console.log(`🔑 API Key present: ${YOUTUBE_API_KEY ? 'Yes' : 'No'}`);
console.log(`📺 Channel ID: ${YOUTUBE_CHANNEL_ID || 'Not set'}`);

if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
  console.error('❌ Error: YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID environment variables are required');
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

async function fetchVideos() {
  const startTime = Date.now();
  try {
    console.log('\n🚀 Starting video fetch process...');

    // Get public IP for debugging
    const publicIpResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
    const publicIpData = publicIpResponse ? await publicIpResponse.json() : { ip: 'Unknown' };
    console.log(`📍 Public IP: ${publicIpData.ip}`);

    // Get uploads playlist ID
    console.log('\n📡 Step 1: Fetching channel information...');
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
    console.log(`🌐 Channel API URL: ${channelUrl.replace(YOUTUBE_API_KEY, '***API_KEY***')}`);

    const channelResponse = await fetch(channelUrl);
    console.log(`📊 Channel API response status: ${channelResponse.status} ${channelResponse.statusText}`);

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      console.error('❌ Channel API error response:', errorText);
      throw new Error(`YouTube API error: ${channelResponse.status} ${channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json();
    console.log('📦 Channel API response received');

    if (!channelData.items || channelData.items.length === 0) {
      console.error('❌ Channel not found or API response invalid:', JSON.stringify(channelData, null, 2));
      throw new Error(`Channel with ID "${YOUTUBE_CHANNEL_ID}" not found or API key invalid`);
    }

    // Extract and save subscriber count
    const subscriberCount = parseInt(channelData.items[0].statistics?.subscriberCount || 0);
    console.log(`👥 Channel subscribers: ${subscriberCount.toLocaleString()}`);
    
    const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      console.error('❌ Channel does not have an uploads playlist');
      throw new Error(`Channel "${YOUTUBE_CHANNEL_ID}" does not have an uploads playlist`);
    }

    console.log(`📋 Uploads playlist ID: ${uploadsPlaylistId}`);

    // Get videos from playlist (paginate all pages)
    console.log('\n📡 Step 2: Fetching ALL playlist videos (paginated)...');
    async function fetchAllPlaylistItems(playlistId) {
      let pageToken = '';
      const allItems = [];
      let page = 1;
      while (true) {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50${pageToken ? `&pageToken=${pageToken}` : ''}&key=${YOUTUBE_API_KEY}`;
        console.log(`🌐 Playlist API URL (page ${page}): ${url.replace(YOUTUBE_API_KEY, '***API_KEY***')}`);
        const res = await fetch(url);
        console.log(`📊 Playlist API response status (page ${page}): ${res.status} ${res.statusText}`);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('❌ Playlist API error response:', errorText);
          throw new Error(`YouTube API playlist error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        const items = data.items || [];
        console.log(`📦 Received ${items.length} items on page ${page}`);
        allItems.push(...items);
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
    const existingIds = fs.existsSync(VIDEOS_DIR)
      ? new Set(
          fs
            .readdirSync(VIDEOS_DIR)
            .filter((f) => f.endsWith('.json'))
            .map((f) => path.parse(f).name)
        )
      : new Set();

    const refreshExisting = (process.env.REFRESH_EXISTING || '').toLowerCase() === 'true';
    const idsToFetch = refreshExisting ? videoIds : videoIds.filter((id) => !existingIds.has(id));
    console.log(`🧮 Existing files: ${existingIds.size} | New to fetch: ${idsToFetch.length}${refreshExisting ? ' (refreshing all)' : ''}`);

    if (idsToFetch.length === 0) {
      console.log('✅ No new videos to import. Skipping details fetch.');
    }

    // Save stats including total video count
    const statsFile = path.join(__dirname, '../src/content/stats.json');
    const stats = { youtubeSubscribers: subscriberCount, totalVideos: videoIds.length, updatedAt: new Date().toISOString() };
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
    console.log(`✅ Saved stats to ${statsFile} (totalVideos: ${videoIds.length})`);

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
      const batchUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${batch.join(',')}&key=${YOUTUBE_API_KEY}`;
      console.log(`🌐 Videos API URL (batch ${i + 1}/${idBatches.length}): ${batchUrl.replace(YOUTUBE_API_KEY, '***API_KEY***')}`);
      const res = await fetch(batchUrl);
      console.log(`📊 Videos API response status (batch ${i + 1}): ${res.status} ${res.statusText}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Videos API error response:', errorText);
        throw new Error(`YouTube API videos error: ${res.status} ${res.statusText}`);
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
    console.log(`🧾 Summary: total IDs=${totalIds}, toFetch=${idsToFetch.length}, skipped=${skippedCount}${refreshExisting ? ' (full refresh)' : ''}`);
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
