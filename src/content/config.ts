import { defineCollection, z } from 'astro:content';

// Video collection schema
const videoCollection = defineCollection({
  type: 'data',
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
  type: 'content',
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
  type: 'data',
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
  type: 'data',
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

// Export collections
export const collections = {
  videos: videoCollection,
  posts: postCollection,
  controllers: controllerCollection,
  playlists: playlistCollection,
};
