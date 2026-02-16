import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import controllerDates from '../../data/controller-dates.json';

export async function GET(context) {
  const dates = controllerDates as Record<string, string>;
  const videos = await getCollection('videos');
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const controllers = await getCollection('controllers');

  // Combine and sort all content by date
  const allContent = [
    ...videos.map((video) => ({
      title: `Video: ${video.data.title}`,
      description: video.data.description,
      link: `https://www.youtube.com/watch?v=${video.data.videoId}`,
      pubDate: video.data.publishedAt,
      categories: video.data.tags,
    })),
    ...posts.map((post) => ({
      title: `Post: ${post.data.title}`,
      description: post.data.description,
      link: `/posts/${post.slug}`,
      pubDate: post.data.publishedAt,
      categories: post.data.tags,
    })),
    ...controllers.map((config) => ({
      title: `Controller Config: ${config.data.controller} - ${config.data.settingsType}`,
      description: config.data.description,
      link: `/controllers`,
      pubDate: new Date(dates[config.id] || new Date().toISOString()),
      categories: config.data.tags,
    })),
  ].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  return rss({
    title: 'High in the Sky Channel',
    description:
      'Watch videos and join the community. Explore the latest videos and community posts.',
    site: context.site || 'https://yourdomain.com',
    items: allContent.map((item) => ({
      ...item,
      link: item.link.startsWith('http')
        ? item.link
        : new URL(item.link, context.site).href,
    })),
    customData: `<language>en-us</language>`,
  });
}
