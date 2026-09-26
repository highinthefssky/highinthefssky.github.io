import MiniSearch from 'minisearch';
import { findSearchVideos, videoSearchOptions } from '../lib/video-search';
import type { VideoSearchData, VideoSearchRequest, VideoSearchResponse } from '../lib/video-search';

let dataPromise: Promise<{ index: MiniSearch; videos: VideoSearchData['videos'] }> | undefined;

async function loadIndex() {
  if (!dataPromise) {
    dataPromise = (async () => {
      const response = await fetch('/videos/search-index.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('Search index unavailable');
      const data: VideoSearchData = await response.json();
      return { index: MiniSearch.loadJS(data.index, videoSearchOptions), videos: data.videos };
    })().catch((error) => {
      dataPromise = undefined;
      throw error;
    });
  }
  return dataPromise;
}

self.addEventListener('message', async (event: MessageEvent<VideoSearchRequest>) => {
  const { requestId, query, tags, limit, offset } = event.data;
  let response: VideoSearchResponse;
  try {
    const { index, videos } = await loadIndex();
    const matches = findSearchVideos(index, videos, query, tags);
    response = { requestId, videos: matches.slice(offset, offset + limit), total: matches.length };
  } catch {
    response = { requestId, videos: [], total: 0, error: 'Search is unavailable. Please retry or browse the video pages.' };
  }
  self.postMessage(response);
});