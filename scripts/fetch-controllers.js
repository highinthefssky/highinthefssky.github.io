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
const CONTROLLERS_DIR = path.join(__dirname, '../src/content/controllers');
const STATS_FILE = path.join(__dirname, '../src/content/stats.json');

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
  const settingsType = parts[parts.length - 1];
  
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
  
  // Add controller type tags
  if (controller.includes('T.16000M')) tags.push('T.16000M', 'Thrustmaster');
  if (controller.includes('TWCS')) tags.push('TWCS', 'Throttle', 'Thrustmaster');
  if (controller.includes('VelocityOne')) tags.push('VelocityOne', 'Turtle Beach');
  if (controller.includes('Yoke')) tags.push('Yoke');
  if (controller.includes('Quad')) tags.push('Throttle Quadrant');
  if (controller.includes('WinWingSim')) tags.push('WinWingSim', 'Ursa Minor');
  
  // Add settings type tags
  if (settingsType.toLowerCase().includes('airplane')) tags.push('Airplane Controls');
  if (settingsType.toLowerCase().includes('general')) tags.push('General Controls');
  
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
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'highinthefssky-website'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    const files = await response.json();
    console.log(`✅ Found ${files.length} files in profiles directory`);
    
    // Filter for XML files only
    const xmlFiles = files.filter(file => 
      file.type === 'file' && file.name.toLowerCase().endsWith('.xml')
    );
    
    console.log(`🎮 Processing ${xmlFiles.length} controller config files...`);
    
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
      
      // Write to JSON file
      const outputPath = path.join(CONTROLLERS_DIR, `${slug}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
      successCount++;
      
      console.log(`  ✓ ${file.name}`);
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ ${successCount} configs processed`);
    console.log(`   ⚠️  ${skipCount} files skipped`);
    
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
