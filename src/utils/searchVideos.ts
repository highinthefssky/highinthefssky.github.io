import type { CollectionEntry } from 'astro:content';

interface SearchOptions {
  query: string;
  fields?: ('title' | 'description' | 'tags')[];
}

export function searchVideos(
  videos: CollectionEntry<'videos'>[],
  options: SearchOptions
): CollectionEntry<'videos'>[] {
  const { query, fields = ['title', 'description', 'tags'] } = options;
  const searchTerm = query.toLowerCase();

  if (!searchTerm) return videos;

  return videos.filter((video) => {
    const data = video.data;

    return fields.some((field) => {
      if (field === 'tags') {
        return data.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm)
        );
      }
      if (field === 'title') {
        return data.title.toLowerCase().includes(searchTerm);
      }
      if (field === 'description') {
        return data.description.toLowerCase().includes(searchTerm);
      }
      return false;
    });
  });
}

export function filterVideosByTags(
  videos: CollectionEntry<'videos'>[],
  tags: string[]
): CollectionEntry<'videos'>[] {
  if (tags.length === 0) return videos;

  return videos.filter((video) =>
    tags.every((tag) =>
      video.data.tags.some(
        (videoTag) => videoTag.toLowerCase() === tag.toLowerCase()
      )
    )
  );
}

export function sortVideosByDate(
  videos: CollectionEntry<'videos'>[],
  ascending = false
): CollectionEntry<'videos'>[] {
  return [...videos].sort((a, b) => {
    const dateA = new Date(a.data.publishedAt).getTime();
    const dateB = new Date(b.data.publishedAt).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}
