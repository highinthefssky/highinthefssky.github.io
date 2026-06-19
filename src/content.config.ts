import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

// Video collection schema
const videoCollection = defineCollection({
  loader: glob({ base: './src/content/videos', pattern: '**/*.json' }),
  schema: z.object({
    videoId: z.string().describe('YouTube video ID'),
    title: z.string().describe('Video title'),
    description: z.string().describe('Video description'),
    thumbnail: z.string().url().describe('Thumbnail URL'),
    publishedAt: z.coerce.date().describe('Publication date'),
    duration: z.number().positive().describe('Duration in seconds'),
    viewCount: z.number().nonnegative().default(0).describe('YouTube view count'),
    tags: z.array(z.string()).describe('Content tags/categories'),
    featured: z.boolean().default(false).describe('Featured on homepage'),
  }),
});

// Post collection schema
const postCollection = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().describe('Post title'),
    description: z.string().describe('Post summary'),
    image: z.string().url().optional().describe('Optional OG image URL for social sharing'),
    publishedAt: z.coerce.date().describe('Publication date'),
    tags: z.array(z.string()).describe('Content tags/categories'),
    draft: z.boolean().default(false).describe('Draft status'),
  }),
});

// Controller config collection schema
const controllerCollection = defineCollection({
  loader: glob({ base: './src/content/controllers', pattern: '**/*.json' }),
  schema: z.object({
    filename: z.string().describe('Original filename from repository'),
    controller: z.string().describe('Controller device name'),
    settingsType: z.string().describe('Type: Airplanes controls or General controls'),
    description: z.string().describe('Short description of the config'),
    aircraft: z.string().optional().describe('Specific aircraft or engine config (e.g., A321, TBM930, 2 engines)'),
    downloadUrl: z.string().url().describe('GitHub raw URL to download XML file'),
    tags: z.array(z.string()).describe('Searchable tags for filtering'),
  }),
});

// Playlist collection schema
const playlistCollection = defineCollection({
  loader: glob({ base: './src/content/playlists', pattern: '**/*.json' }),
  schema: z.object({
    slug: z.string().describe('URL-friendly slug'),
    title: z.string().describe('Playlist title'),
    description: z.string().describe('Playlist description'),
    thumbnail: z.string().url().optional().describe('Custom thumbnail URL (falls back to first video)'),
    videos: z.array(z.string()).min(1).describe('Ordered list of video IDs'),
    matchRules: z
      .object({
        titlePatterns: z.array(z.string()).optional().describe('Regex patterns matched against video titles'),
        tagPatterns: z.array(z.string()).optional().describe('Regex patterns matched against video tags'),
        mode: z.enum(['any', 'all']).default('any').describe('any = match any rule, all = match all rules'),
      })
      .optional()
      .describe('Auto-match rules for adding new videos (omit for manual playlists)'),
  }),
});

// Learning tracks collection schema
const trackCollection = defineCollection({
  loader: glob({ base: './src/content/tracks', pattern: '**/*.json' }),
  schema: z.object({
    slug: z.string().describe('URL-friendly slug'),
    title: z.string().describe('Track title'),
    description: z.string().describe('Short overview of the learning track'),
    level: z.enum(['beginner', 'intermediate', 'advanced']).describe('Target learner level'),
    lessons: z.array(
      z.object({
        week: z.number().int().positive().describe('Week number in the track'),
        title: z.string().describe('Lesson title'),
        objective: z.string().describe('What the learner will achieve this week'),
        videoId: z.string().describe('Primary curated lesson video ID'),
        playlistSlug: z.string().describe('Referenced playlist slug'),
        postSlug: z.string().describe('Referenced community post slug'),
        controllerId: z.string().describe('Referenced controller config entry id (without .json)'),
        aircraft: z.enum(['airliner', 'general', 'turboprop', 'multi-engine', 'custom']).optional(),
        goal: z.enum(['setup', 'airliner-ops', 'navigation', 'landing', 'sightseeing']).optional(),
      })
    ).min(1).describe('Ordered multi-week lessons'),
  }),
});

// Moza flight profile collection schema
const mozaProfileCollection = defineCollection({
  loader: glob({ base: './src/content/moza-profiles', pattern: '**/*.json' }),
  schema: z.object({
    filename: z.string().describe('Original filename from repository'),
    device: z.string().describe('Moza device name (e.g. AB6)'),
    aircraft: z.string().describe('Aircraft or aircraft type this profile is for'),
    msfsVersion: z.string().describe('Target MSFS version (e.g. 2024)'),
    description: z.string().describe('Short description of the profile'),
    downloadUrl: z.string().url().describe('GitHub raw URL to download the .preset file'),
    tags: z.array(z.string()).describe('Searchable tags for filtering'),
  }),
});

// Export collections
export const collections = {
  videos: videoCollection,
  posts: postCollection,
  controllers: controllerCollection,
  playlists: playlistCollection,
  tracks: trackCollection,
  mozaProfiles: mozaProfileCollection,
};