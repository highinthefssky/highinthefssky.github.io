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
    publishedAt: z.coerce.date().describe('Publication date'),
    tags: z.array(z.string()).describe('Content tags/categories'),
    draft: z.boolean().default(false).describe('Draft status'),
  }),
});

// Export collections
export const collections = {
  videos: videoCollection,
  posts: postCollection,
};
