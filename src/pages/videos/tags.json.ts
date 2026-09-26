import { getCollection } from 'astro:content';

export async function GET() {
  const videos = await getCollection('videos');
  return Response.json(Array.from(new Set(videos.flatMap((video) => video.data.tags))).sort());
}