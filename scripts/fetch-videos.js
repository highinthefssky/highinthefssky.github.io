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

    // Get uploads playlist ID
    console.log('\n📡 Step 1: Fetching channel information...');
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
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

    console.log(`✅ Found channel: ${channelData.items[0].snippet?.title || 'Unknown Channel'}`);
    const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      console.error('❌ Channel does not have an uploads playlist');
      throw new Error(`Channel "${YOUTUBE_CHANNEL_ID}" does not have an uploads playlist`);
    }

    console.log(`📋 Uploads playlist ID: ${uploadsPlaylistId}`);

    // Get videos from playlist
    console.log('\n📡 Step 2: Fetching playlist videos...');
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`;
    console.log(`🌐 Playlist API URL: ${playlistUrl.replace(YOUTUBE_API_KEY, '***API_KEY***')}`);

    const playlistResponse = await fetch(playlistUrl);
    console.log(`📊 Playlist API response status: ${playlistResponse.status} ${playlistResponse.statusText}`);

    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text();
      console.error('❌ Playlist API error response:', errorText);
      throw new Error(`YouTube API playlist error: ${playlistResponse.status} ${playlistResponse.statusText}`);
    }

    const playlistData = await playlistResponse.json();
    console.log('📦 Playlist API response received');

    if (!playlistData.items || playlistData.items.length === 0) {
      console.log('⚠️ No videos found in uploads playlist');
      return; // Exit gracefully if no videos
    }

    console.log(`📹 Found ${playlistData.items.length} videos in playlist`);

    // Fetch detailed info for each video
    console.log('\n📡 Step 3: Fetching detailed video information...');
    const videoIds = playlistData.items.map((item) => item.contentDetails.videoId);
    console.log(`🎬 Processing ${videoIds.length} video IDs: ${videoIds.slice(0, 5).join(', ')}${videoIds.length > 5 ? '...' : ''}`);

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
    console.log(`🌐 Videos API URL: ${videosUrl.replace(YOUTUBE_API_KEY, '***API_KEY***')}`);

    const videosResponse = await fetch(videosUrl);
    console.log(`📊 Videos API response status: ${videosResponse.status} ${videosResponse.statusText}`);

    if (!videosResponse.ok) {
      const errorText = await videosResponse.text();
      console.error('❌ Videos API error response:', errorText);
      throw new Error(`YouTube API videos error: ${videosResponse.status} ${videosResponse.statusText}`);
    }

    const videosData = await videosResponse.json();
    console.log('📦 Videos API response received');

    if (!videosData.items || videosData.items.length === 0) {
      console.log('⚠️ No video details retrieved from YouTube API');
      return; // Exit gracefully if no video details
    }

    console.log(`🎯 Processing ${videosData.items.length} video details`);

    // Transform and save videos
    console.log('\n💾 Step 4: Saving video files...');

    // Ensure video directory exists
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
      console.log(`📁 Created videos directory: ${VIDEOS_DIR}`);
    } else {
      console.log(`📁 Videos directory exists: ${VIDEOS_DIR}`);
    }

    const videos = videosData.items
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
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt).toISOString() : new Date().toISOString(),
          duration: duration,
          tags: item.snippet?.tags || [],
          featured: false,
        };

        fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
        console.log(`✅ Saved: ${filename} - "${videoData.title}"`);

        return videoData;
      });

    // Sort videos by published date (newest first) and mark the latest as featured
    if (videos.length > 0) {
      console.log('\n⭐ Marking latest video as featured...');

      // Sort by published date descending (newest first)
      videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

      // Mark the first video (most recent) as featured
      const latestVideo = videos[0];
      latestVideo.featured = true;

      // Re-save the featured video file
      const featuredFilePath = path.join(VIDEOS_DIR, `${latestVideo.videoId}.json`);
      fs.writeFileSync(featuredFilePath, JSON.stringify(latestVideo, null, 2));

      console.log(`🌟 Featured video: "${latestVideo.title}" (${latestVideo.videoId})`);
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n🎉 Successfully processed ${videos.length} videos (${videosData.items.length - videos.length} skipped due to missing/invalid data)`);
    if (videos.length > 0) {
      console.log(`🌟 Latest video marked as featured: "${videos[0].title}"`);
    }
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
