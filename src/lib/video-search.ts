import MiniSearch from 'minisearch';

export interface SearchVideo {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  tags: string[];
  duration: number;
  publishedAt: string;
  viewCount: number;
}

export const videoSearchOptions = { fields: ['title', 'description', 'tags'] };

export function buildVideoIndex(videos: Array<SearchVideo & { description: string }>) {
  const index = new MiniSearch(videoSearchOptions);
  index.addAll(videos.map((video) => ({ ...video, tags: video.tags.join(' ') })));
  return index;
}

export interface VideoSearchData {
  index: ReturnType<MiniSearch['toJSON']>;
  videos: SearchVideo[];
}

export interface VideoSearchRequest {
  requestId: number;
  query: string;
  tags: string[];
  limit: number;
  offset: number;
}

export interface VideoSearchResponse {
  requestId: number;
  videos: SearchVideo[];
  total: number;
  error?: string;
}

export function findSearchVideos(index: MiniSearch, videos: SearchVideo[], query: string, tags: string[]): SearchVideo[] {
  const fieldMatch = query.trim().match(/^(title|description|tags):\s*(.*)$/is);
  const term = (fieldMatch ? fieldMatch[2] : query).trim();
  const matches = term ? new Set(index.search(term, {
    fields: fieldMatch ? [fieldMatch[1].toLowerCase()] : undefined,
    combineWith: 'AND',
    prefix: true,
  }).map((match) => match.id)) : undefined;
  const selectedTags = new Set(tags.map((tag) => tag.toLowerCase()));
  return videos.filter((video) =>
    (!matches || matches.has(video.id)) &&
    (!selectedTags.size || video.tags.some((tag) => selectedTags.has(tag.toLowerCase())))
  );
}