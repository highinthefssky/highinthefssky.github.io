#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const VIDEOS_DIR = path.join(__dirname, '../src/content/videos');

if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
  console.error('Error: YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID environment variables are required');
  process.exit(1);
}

// Validate channel ID format (should start with UC and be 24 characters)
if (!YOUTUBE_CHANNEL_ID.startsWith('UC') || YOUTUBE_CHANNEL_ID.length !== 24) {
  console.error(`Error: YOUTUBE_CHANNEL_ID should be a valid channel ID starting with 'UC' (got: ${YOUTUBE_CHANNEL_ID})`);
  console.error('Channel IDs look like: UC1234567890abcdef...');
  process.exit(1);
}

async function fetchVideos() {
  try {
    console.log('Fetching videos from YouTube API...');

    // Get uploads playlist ID
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
    );

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      console.error('YouTube API error response:', errorText);
      throw new Error(`YouTube API error: ${channelResponse.status} ${channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      console.error('Channel not found or API response invalid:', JSON.stringify(channelData, null, 2));
      throw new Error(`Channel with ID "${YOUTUBE_CHANNEL_ID}" not found or API key invalid`);
    }
    
    console.log(`Found channel: ${channelData.items[0].snippet.title}`);
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;
    console.log(`Uploads playlist ID: ${uploadsPlaylistId}`);

    // Get videos from playlist
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    );

    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text();
      console.error('Playlist API error response:', errorText);
      throw new Error(`YouTube API playlist error: ${playlistResponse.status} ${playlistResponse.statusText}`);
    }

    const playlistData = await playlistResponse.json();
    
    if (!playlistData.items || playlistData.items.length === 0) {
      console.log('No videos found in uploads playlist');
      return; // Exit gracefully if no videos
    }
    
    console.log(`Found ${playlistData.items.length} videos in playlist`);

    // Fetch detailed info for each video
    const videoIds = playlistData.items.map((item) => item.contentDetails.videoId);
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.statusText}`);
    }

    const videosData = await videosResponse.json();
    
    if (!videosData.items || videosData.items.length === 0) {
      console.log('No video details retrieved from YouTube API');
      return; // Exit gracefully if no video details
    }
    
    console.log(`Processing ${videosData.items.length} video details`);

    // Transform and save videos
    // Ensure video directory exists
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
      console.log(`Created videos directory: ${VIDEOS_DIR}`);
    }

    const videos = videosData.items.map((item) => {
      const duration = parseDuration(item.contentDetails.duration);
      const filename = `${item.id}.json`;
      const filePath = path.join(VIDEOS_DIR, filename);

      const videoData = {
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        publishedAt: new Date(item.snippet.publishedAt).toISOString(),
        duration: duration,
        tags: item.snippet.tags || [],
        featured: false,
      };

      fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
      console.log(`✓ Saved: ${filename}`);

      return videoData;
    });

    console.log(`\n✓ Successfully fetched and saved ${videos.length} videos`);
  } catch (error) {
    console.error('Error fetching videos:', error.message);
    process.exit(1);
  }
}

function parseDuration(duration) {
  // PT1H2M3S -> seconds
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

fetchVideos();
