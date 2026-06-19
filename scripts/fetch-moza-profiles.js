#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🕹️  Starting Moza flight profile fetch script...');

const GITHUB_OWNER = 'highinthefssky';
const GITHUB_REPO = 'moza-flight-profiles';
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const PROFILES_DIR = path.join(__dirname, '../src/content/moza-profiles');
const STATS_FILE = path.join(__dirname, '../src/content/stats.json');
const DATES_FILE = path.join(__dirname, '../data/moza-profile-dates.json');

// Create profiles directory if it doesn't exist
if (!fs.existsSync(PROFILES_DIR)) {
  console.log(`📁 Creating directory: ${PROFILES_DIR}`);
  fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

/**
 * Parse a preset filename to extract metadata.
 * Expected format: "{device}-{aircraft...}-msfs{year}.preset"
 * Examples:
 *   ab6-a320-msfs2024.preset         → device=AB6, aircraft=A320, year=2024
 *   ab6-cessna-172-msfs2024.preset   → device=AB6, aircraft=Cessna 172, year=2024
 *   ab6-piston-msfs2024.preset       → device=AB6, aircraft=Piston, year=2024
 */
function parseFilename(filename) {
  const nameWithoutExt = filename.replace(/\.preset$/i, '');

  // Split off the trailing -msfs{year} suffix
  const msfsMatch = nameWithoutExt.match(/^(.+)-msfs(\d{4})$/);
  if (!msfsMatch) {
    console.warn(`⚠️  Unexpected filename format (no -msfs{year} suffix): ${filename}`);
    return null;
  }

  const [, deviceAndAircraft, msfsVersion] = msfsMatch;

  // First segment (before first dash) is the device slug
  const dashIndex = deviceAndAircraft.indexOf('-');
  if (dashIndex === -1) {
    console.warn(`⚠️  Cannot split device from aircraft in: ${filename}`);
    return null;
  }

  const deviceSlug = deviceAndAircraft.slice(0, dashIndex);
  const aircraftSlug = deviceAndAircraft.slice(dashIndex + 1);

  return {
    device: prettifyDevice(deviceSlug),
    aircraft: prettifyAircraft(aircraftSlug),
    msfsVersion,
  };
}

/**
 * Map a device slug to a display name.
 */
function prettifyDevice(slug) {
  const map = {
    ab6: 'AB6',
    ab6x: 'AB6X',
    ab9: 'AB9',
  };
  return map[slug.toLowerCase()] ?? slug.toUpperCase();
}

/**
 * Convert an aircraft slug into a readable name.
 * "cessna-172" → "Cessna 172", "a320" → "A320", "piston" → "Piston"
 */
function prettifyAircraft(slug) {
  return slug
    .split('-')
    .map((part) => {
      // Uppercase pure letter/number combos that look like model designations (A320, TBM930, etc.)
      if (/^[a-z]+\d+$/i.test(part) || /^\d+[a-z]*$/i.test(part)) {
        return part.toUpperCase();
      }
      // Capitalise first letter otherwise
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

/**
 * Generate searchable tags.
 */
function generateTags(device, aircraft, msfsVersion) {
  const tags = ['Moza', device];

  // MSFS version tag
  tags.push(`MSFS ${msfsVersion}`);

  // Aircraft-type tags
  const aircraftLower = aircraft.toLowerCase();
  if (/a3\d{2}|a320|a321|airliner|b737|b777|b787|crj|e\d{3}/.test(aircraftLower)) {
    tags.push('Airliner');
  }
  if (/cessna|piper|beech|piston|172|182|208|tbm|king air|general aviation|ga/.test(aircraftLower)) {
    tags.push('General Aviation');
  }
  if (/turboprop|tbm|king air|pc-12|c208/.test(aircraftLower)) {
    tags.push('Turboprop');
  }
  if (/helicopter|heli/.test(aircraftLower)) {
    tags.push('Helicopter');
  }
  if (/piston/.test(aircraftLower)) {
    tags.push('Piston');
  }

  return [...new Set(tags)];
}

/**
 * Generate a short description.
 */
function generateDescription(device, aircraft, msfsVersion) {
  return `Moza Cockpit preset for ${device} — ${aircraft} in MSFS ${msfsVersion}`;
}

/**
 * Create a slug from the filename (without extension).
 */
function createSlug(filename) {
  return filename
    .replace(/\.preset$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fetch Moza flight profiles from GitHub.
 */
async function fetchMozaProfiles() {
  const startTime = Date.now();

  try {
    console.log(`\n📡 Fetching file list from GitHub repository...`);
    console.log(`   Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);

    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/profiles?ref=${GITHUB_BRANCH}`;
    const headers = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'highinthefssky-website',
    };

    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
      console.log('🔐 Using authenticated GitHub API requests');
    } else {
      console.log('ℹ️  No GitHub token found (using unauthenticated API requests)');
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      const resetAt = response.headers.get('x-ratelimit-reset');
      const resetDate = resetAt ? new Date(Number(resetAt) * 1000).toISOString() : 'unknown';

      if (response.status === 403 && remaining === '0') {
        throw new Error(
          `GitHub API rate limit exceeded. Remaining: ${remaining}, resets at: ${resetDate}. ` +
            `Set GITHUB_TOKEN in CI/local environment to increase limits.`
        );
      }

      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const files = await response.json();
    console.log(`✅ Found ${files.length} items in profiles directory`);

    // Filter for .preset files only
    const presetFiles = files.filter(
      (file) => file.type === 'file' && file.name.toLowerCase().endsWith('.preset')
    );

    console.log(`🕹️  Processing ${presetFiles.length} Moza preset files...`);

    // Load existing dates tracking file
    let profileDates = {};
    if (fs.existsSync(DATES_FILE)) {
      profileDates = JSON.parse(fs.readFileSync(DATES_FILE, 'utf-8'));
    }

    let successCount = 0;
    let skipCount = 0;

    for (const file of presetFiles) {
      const parsed = parseFilename(file.name);

      if (!parsed) {
        skipCount++;
        continue;
      }

      const { device, aircraft, msfsVersion } = parsed;
      const slug = createSlug(file.name);
      const tags = generateTags(device, aircraft, msfsVersion);
      const description = generateDescription(device, aircraft, msfsVersion);

      const profile = {
        filename: file.name,
        device,
        aircraft,
        msfsVersion,
        description,
        downloadUrl: file.download_url,
        tags,
      };

      // Track first-seen date for new profiles
      if (!profileDates[slug]) {
        profileDates[slug] = new Date().toISOString();
        console.log(`  🆕 New profile: ${slug}`);
      }

      const outputPath = path.join(PROFILES_DIR, `${slug}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(profile, null, 2));
      successCount++;

      console.log(`  ✓ ${file.name}`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ ${successCount} profiles processed`);
    console.log(`   ⚠️  ${skipCount} files skipped`);

    // Write updated dates tracking file
    fs.writeFileSync(DATES_FILE, JSON.stringify(profileDates, null, 2) + '\n');
    console.log(`\n📅 Updated profile dates tracking file (${Object.keys(profileDates).length} entries)`);

    // Update stats.json
    updateStats(successCount);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Moza profile fetch complete in ${duration}s`);
  } catch (error) {
    console.error('\n❌ Error fetching Moza profiles:', error.message);
    process.exit(1);
  }
}

/**
 * Update stats.json with Moza profile count.
 */
function updateStats(profileCount) {
  let stats = {};

  if (fs.existsSync(STATS_FILE)) {
    stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
  }

  stats.totalMozaProfiles = profileCount;
  stats.lastMozaProfileUpdate = new Date().toISOString();

  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  console.log(`\n📈 Updated stats.json:`);
  console.log(`   Total Moza profiles: ${profileCount}`);
}

fetchMozaProfiles();
