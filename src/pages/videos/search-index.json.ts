import { getCollection } from 'astro:content';
import { buildVideoIndex } from '../../lib/video-search';

export async function GET() {
  const entries = await getCollection('videos');
  const videos = entries
    .sort((first, second) => second.data.publishedAt.getTime() - first.data.publishedAt.getTime())
    .map(({ id, data }) => ({
      id,
      videoId: data.videoId,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      tags: data.tags,
      duration: data.duration,
      publishedAt: data.publishedAt.toISOString(),
      viewCount: data.viewCount,
    }));
  return Response.json({
    index: buildVideoIndex(videos).toJSON(),
    videos: videos.map(({ description, ...video }) => video),
  });
}