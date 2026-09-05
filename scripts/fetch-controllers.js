#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎮 Starting controller config fetch script...');

const GITHUB_OWNER = 'highinthefssky';
const GITHUB_REPO = 'msfs-2024-controls-settings';
const GITHUB_BRANCH = 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const CONTROLLERS_DIR = path.join(__dirname, '../src/content/controllers');
const STATS_FILE = path.join(__dirname, '../src/content/stats.json');
const DATES_FILE = path.join(__dirname, '../data/controller-dates.json');

// Create controllers directory if it doesn't exist
if (!fs.existsSync(CONTROLLERS_DIR)) {
  console.log(`📁 Creating directory: ${CONTROLLERS_DIR}`);
  fs.mkdirSync(CONTROLLERS_DIR, { recursive: true });
}

/**
 * Parse filename to extract config metadata
 * Example: "T.16000M - msfs custom - airplanes controls.xml"
 * Example: "VelocityOne Flight (Quad) - A321 - airplanes controls.xml"
 */
function parseFilename(filename) {
  // Remove .xml extension
  const nameWithoutExt = filename.replace(/\.xml$/i, '');
  
  // Split by ' - '
  const parts = nameWithoutExt.split(' - ').map(p => p.trim());
  
  if (parts.length < 2) {
    console.warn(`⚠️  Unexpected filename format: ${filename}`);
    return null;
  }
  
  const controller = parts[0];
  const rawSettingsType = parts[parts.length - 1];
  const settingsType = {
    gc: 'General Controls',
    hc: 'Helicopter Controls',
  }[rawSettingsType.toLowerCase()] || rawSettingsType;
  
  // Middle part(s) could be aircraft/config type
  const middleParts = parts.slice(1, -1);
  const aircraft = middleParts.join(' - ');
  
  return {
    controller,
    aircraft: aircraft || null,
    settingsType,
  };
}

/**
 * Generate tags from config metadata
 */
function generateTags(controller, aircraft, settingsType) {
  const tags = [];
  const normalizedController = controller.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Add controller type tags
  if (normalizedController.includes('t16000m')) tags.push('T16000M', 'Thrustmaster', 'Joystick');
  if (controller.includes('TWCS')) tags.push('TWCS', 'Throttle', 'Thrustmaster');
  if (controller.includes('VelocityOne')) tags.push('VelocityOne', 'Turtle Beach');
  if (controller.includes('Yoke')) tags.push('Yoke');
  if (controller.includes('Quad')) tags.push('Throttle Quadrant');
  if (controller.includes('WinWingSim')) tags.push('WinWingSim', 'Ursa Minor');
  
  // Add settings type tags
  if (settingsType.toLowerCase().includes('airplane')) tags.push('Airplane Controls');
  if (settingsType.toLowerCase().includes('general')) tags.push('General Controls');
  if (settingsType.toLowerCase().includes('helicopter')) tags.push('Helicopter Controls');
  
  // Add aircraft-specific tags
  if (aircraft) {
    if (aircraft.includes('A321') || aircraft.includes('Airliner')) {
      tags.push('Airliner');
    }
    if (aircraft.includes('TBM')) tags.push('TBM930', 'Turboprop');
    if (aircraft.includes('GA')) tags.push('General Aviation');
    if (aircraft.match(/\d+ engines?/i)) {
      const engineMatch = aircraft.match(/(\d+) engines?/i);
      if (engineMatch) tags.push(`${engineMatch[1]} Engines`);
    }
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate description from config metadata
 */
function generateDescription(controller, aircraft, settingsType) {
  let desc = `${settingsType} for ${controller}`;
  if (aircraft && !aircraft.toLowerCase().includes('custom') && !aircraft.toLowerCase().includes('msfs')) {
    desc += ` - ${aircraft}`;
  }
  return desc;
}

/**
 * Create slug from filename
 */
function createSlug(filename) {
  return filename
    .replace(/\.xml$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Fetch controller configs from GitHub
 */
async function fetchControllers() {
  const startTime = Date.now();
  
  try {
    console.log(`\n📡 Fetching file list from GitHub repository...`);
    console.log(`   Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
    
    // Fetch the profiles directory listing
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/profiles?ref=${GITHUB_BRANCH}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'highinthefssky-website',
    };

    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
      console.log('🔐 Using authenticated GitHub API requests');
    } else {
      console.log('ℹ️ No GitHub token found (using unauthenticated API requests)');
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
    console.log(`✅ Found ${files.length} files in profiles directory`);
    
    // Filter for XML files only
    const xmlFiles = files.filter(file => 
      file.type === 'file' && file.name.toLowerCase().endsWith('.xml')
    );
    
    console.log(`🎮 Processing ${xmlFiles.length} controller config files...`);
    
    // Load existing dates tracking file
    let controllerDates = {};
    if (fs.existsSync(DATES_FILE)) {
      controllerDates = JSON.parse(fs.readFileSync(DATES_FILE, 'utf-8'));
    }

    let successCount = 0;
    let skipCount = 0;
    
    for (const file of xmlFiles) {
      const parsed = parseFilename(file.name);
      
      if (!parsed) {
        skipCount++;
        continue;
      }
      
      const { controller, aircraft, settingsType } = parsed;
      const slug = createSlug(file.name);
      const tags = generateTags(controller, aircraft, settingsType);
      const description = generateDescription(controller, aircraft, settingsType);
      
      // Create config object
      const config = {
        filename: file.name,
        controller,
        settingsType,
        description,
        ...(aircraft && { aircraft }),
        downloadUrl: file.download_url,
        tags,
      };
      
      // Track first-seen date for new controllers
      if (!controllerDates[slug]) {
        controllerDates[slug] = new Date().toISOString();
        console.log(`  🆕 New controller: ${slug}`);
      }

      // Write to JSON file
      const outputPath = path.join(CONTROLLERS_DIR, `${slug}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
      successCount++;
      
      console.log(`  ✓ ${file.name}`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ ${successCount} configs processed`);
    console.log(`   ⚠️  ${skipCount} files skipped`);
    
    // Write updated dates tracking file
    fs.writeFileSync(DATES_FILE, JSON.stringify(controllerDates, null, 2) + '\n');
    console.log(`\n📅 Updated controller dates tracking file (${Object.keys(controllerDates).length} entries)`);

    // Update stats.json
    updateStats(successCount);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✨ Controller fetch complete in ${duration}s`);
    
  } catch (error) {
    console.error('\n❌ Error fetching controllers:', error.message);
    process.exit(1);
  }
}

/**
 * Update stats.json with controller count
 */
function updateStats(controllerCount) {
  let stats = {};
  
  // Read existing stats if available
  if (fs.existsSync(STATS_FILE)) {
    const statsContent = fs.readFileSync(STATS_FILE, 'utf-8');
    stats = JSON.parse(statsContent);
  }
  
  // Update controller count
  stats.totalControllers = controllerCount;
  stats.lastControllerUpdate = new Date().toISOString();
  
  // Write back to file
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  console.log(`\n📈 Updated stats.json:`);
  console.log(`   Total controllers: ${controllerCount}`);
}

// Run the script
fetchControllers();
