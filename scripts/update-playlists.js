#!/usr/bin/env node

/**
 * update-playlists.js
 *
 * Reads all playlist JSON files and auto-assigns new videos based on matchRules.
 * Playlists without matchRules are left untouched (manual curation).
 *
 * Run after fetch-videos.js:
 *   node scripts/update-playlists.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLAYLISTS_DIR = path.join(__dirname, '../src/content/playlists');
const VIDEOS_DIR = path.join(__dirname, '../src/content/videos');

console.log('📋 Starting playlist auto-update...');
console.log(`📂 Playlists directory: ${PLAYLISTS_DIR}`);
console.log(`📂 Videos directory: ${VIDEOS_DIR}`);

// ── Load all videos ──────────────────────────────────────────────────────────

const videoFiles = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.json'));
console.log(`🎬 Found ${videoFiles.length} videos`);

const videos = videoFiles.map((f) => {
  const data = JSON.parse(fs.readFileSync(path.join(VIDEOS_DIR, f), 'utf-8'));
  return data;
});

// ── Load all playlists ───────────────────────────────────────────────────────

const playlistFiles = fs.readdirSync(PLAYLISTS_DIR).filter((f) => f.endsWith('.json'));
console.log(`📋 Found ${playlistFiles.length} playlists`);

let totalAdded = 0;

for (const file of playlistFiles) {
  const filePath = path.join(PLAYLISTS_DIR, file);
  const playlist = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (!playlist.matchRules) {
    console.log(`  ⏭️  ${playlist.title} — no matchRules, skipping`);
    continue;
  }

  const rules = playlist.matchRules;
  const titlePatterns = (rules.titlePatterns || []).map((p) => new RegExp(p, 'i'));
  const tagPatterns = (rules.tagPatterns || []).map((p) => new RegExp(p, 'i'));
  const mode = rules.mode || 'any';

  const existingIds = new Set(playlist.videos);

  // Find matching videos not already in the playlist
  const newMatches = videos
    .filter((v) => !existingIds.has(v.videoId))
    .filter((v) => {
      const titleMatch = titlePatterns.some((re) => re.test(v.title));
      const tagMatch = tagPatterns.some((re) => v.tags.some((tag) => re.test(tag)));

      if (mode === 'all') {
        // Must match at least one title pattern AND at least one tag pattern
        const hasTitle = titlePatterns.length === 0 || titleMatch;
        const hasTag = tagPatterns.length === 0 || tagMatch;
        return hasTitle && hasTag;
      }
      // mode === 'any': match any rule
      return titleMatch || tagMatch;
    })
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

  if (newMatches.length === 0) {
    console.log(`  ✅ ${playlist.title} — up to date (${playlist.videos.length} videos)`);
    continue;
  }

  // Append new video IDs
  const newIds = newMatches.map((v) => v.videoId);
  playlist.videos.push(...newIds);

  // Update thumbnail to the newest video's thumbnail
  const newestVideo = newMatches[newMatches.length - 1];
  if (newestVideo.thumbnail) {
    playlist.thumbnail = newestVideo.thumbnail;
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(playlist, null, 2) + '\n');

  console.log(`  ➕ ${playlist.title} — added ${newIds.length} new videos (total: ${playlist.videos.length})`);
  totalAdded += newIds.length;
}

if (totalAdded > 0) {
  console.log(`\n🎉 Done! Added ${totalAdded} video(s) across playlists.`);
} else {
  console.log('\n✅ All playlists are up to date.');
}
