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

async function fetchVideos() {
  try {
    console.log('Fetching videos from YouTube API...');

    // Get uploads playlist ID
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}`
    );

    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelResponse.statusText}`);
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Get videos from playlist
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`
    );

    if (!playlistResponse.ok) {
      throw new Error(`YouTube API error: ${playlistResponse.statusText}`);
    }

    const playlistData = await playlistResponse.json();

    // Fetch detailed info for each video
    const videoIds = playlistData.items.map((item) => item.contentDetails.videoId);
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
    );

    if (!videosResponse.ok) {
      throw new Error(`YouTube API error: ${videosResponse.statusText}`);
    }

    const videosData = await videosResponse.json();

    // Transform and save videos
    // Ensure video directory exists
    if (!fs.existsSync(VIDEOS_DIR)) {
      fs.mkdirSync(VIDEOS_DIR, { recursive: true });
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
# Test comment
