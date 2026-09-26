import SearchWorker from './videoSearch.worker?worker';
import type { SearchVideo, VideoSearchResponse } from '../lib/video-search';

const searchInput = document.querySelector<HTMLInputElement>('#search-input')!;
document.querySelector<HTMLElement>('.search-controls')!.hidden = false;
const tagSearch = document.querySelector<HTMLInputElement>('#tag-search')!;
const toggle = document.querySelector<HTMLButtonElement>('#toggle-tags')!;
const tagContainer = document.querySelector<HTMLElement>('#tag-container')!;
const tagsList = document.querySelector<HTMLElement>('#tags-list')!;
const tagTemplate = document.querySelector<HTMLTemplateElement>('#tag-template')!;
const tagStatus = document.querySelector<HTMLElement>('#tag-status')!;
const selectedTags = document.querySelector<HTMLElement>('#selected-tags')!;
const grid = document.querySelector<HTMLElement>('#videos-grid')!;
const count = document.querySelector<HTMLElement>('#result-count')!;
const empty = document.querySelector<HTMLElement>('#empty-state')!;
const errorPanel = document.querySelector<HTMLElement>('#search-error')!;
const pagination = document.querySelector<HTMLElement>('#archive-pagination')!;
const resultControls = document.querySelector<HTMLElement>('#load-more-container')!;
const previous = document.querySelector<HTMLButtonElement>('#search-previous')!;
const next = document.querySelector<HTMLButtonElement>('#load-more-btn')!;
const resultPage = document.querySelector<HTMLElement>('#search-page')!;
const clear = document.querySelector<HTMLButtonElement>('#clear-btn')!;
const initialCards = Array.from(grid.children);
const cardTemplate = initialCards[0]?.cloneNode(true) as HTMLElement | undefined;
const totalVideos = Number(count.dataset.totalVideos);
const activeTags = new Set<string>();
const RESULT_PAGE_SIZE = 24;
let tags: string[] | undefined;
let tagsPromise: Promise<void> | undefined;
let worker: Worker | undefined;
let requestId = 0;
let offset = 0;
let debounce: ReturnType<typeof setTimeout> | undefined;
let focusResults = false;

function syncFavorites() {
  window.dispatchEvent(new CustomEvent('video-cards-updated'));
}

function renderCard(video: SearchVideo): HTMLElement {
  const card = cardTemplate!.cloneNode(true) as HTMLElement;
  card.dataset.videoId = video.videoId;
  card.dataset.tags = video.tags.join(',').toLowerCase();
  card.querySelectorAll<HTMLAnchorElement>('.video-card-link, .card-image-link').forEach((link) => {
    link.href = `/videos/${encodeURIComponent(video.id)}/`;
  });
  card.querySelector('.video-card-link')!.textContent = video.title;
  const image = card.querySelector<HTMLImageElement>('.card-image')!;
  image.src = video.thumbnail;
  const favorite = card.querySelector<HTMLButtonElement>('.fav-btn')!;
  favorite.dataset.favId = video.videoId;
  const hours = Math.floor(video.duration / 3600);
  const minutes = Math.floor(video.duration % 3600 / 60);
  const seconds = String(video.duration % 60).padStart(2, '0');
  card.querySelector('.duration-badge')!.textContent = hours ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
  card.querySelector('.publish-date')!.textContent = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(video.publishedAt));
  const spanTemplate = card.querySelector('.publish-date')!;
  const views = card.querySelector<HTMLElement>('.view-count') || spanTemplate.cloneNode(false) as HTMLElement;
  views.className = 'view-count';
  views.hidden = !video.viewCount;
  const value = video.viewCount >= 1_000_000 ? `${(video.viewCount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : video.viewCount >= 1_000 ? `${(video.viewCount / 1_000).toFixed(1).replace(/\.0$/, '')}K` : String(video.viewCount);
  views.textContent = `${value} views`;
  card.querySelector('.card-meta')!.append(views);
  const content = card.querySelector('.card-content')!;
  const tagContainer = card.querySelector('.card-tags') || content.cloneNode(false) as HTMLElement;
  (tagContainer as HTMLElement).className = 'card-tags';
  const children = video.tags.slice(0, 2).map((text) => {
    const element = spanTemplate.cloneNode(false) as HTMLElement;
    element.className = 'tag';
    element.textContent = text;
    return element;
  });
  if (video.tags.length > 2) {
    const element = spanTemplate.cloneNode(false) as HTMLElement;
    element.className = 'tag-more';
    element.textContent = `+${video.tags.length - 2}`;
    children.push(element);
  }
  tagContainer.replaceChildren(...children);
  content.append(tagContainer);
  return card;
}

function updateUrl() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
  activeTags.forEach((tag) => params.append('tag', tag));
  const hash = params.toString();
  history.replaceState(null, '', `${location.pathname}${hash ? `#${hash}` : ''}`);
}

function renderTags() {
  if (!tags) return;
  const term = tagSearch.value.trim().toLowerCase();
  const matches = tags.filter((tag) => tag.toLowerCase().includes(term));
  tagsList.replaceChildren(...matches.slice(0, 60).map((tag) => {
    const button = tagTemplate.content.firstElementChild!.cloneNode(true) as HTMLButtonElement;
    button.textContent = tag;
    button.dataset.tag = tag;
    button.classList.toggle('active', activeTags.has(tag));
    button.setAttribute('aria-pressed', String(activeTags.has(tag)));
    return button;
  }));
  tagStatus.textContent = `${Math.min(matches.length, 60)} of ${matches.length} tags`;
}

function renderSelectedTags() {
  tagsList.querySelectorAll<HTMLButtonElement>('[data-tag]').forEach((button) => {
    const selected = activeTags.has(button.dataset.tag!);
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  selectedTags.replaceChildren(...Array.from(activeTags, (tag) => {
    const button = tagTemplate.content.firstElementChild!.cloneNode(true) as HTMLButtonElement;
    button.textContent = `${tag} \u00d7`;
    button.classList.add('active');
    button.removeAttribute('aria-pressed');
    button.setAttribute('aria-label', `Remove ${tag} filter`);
    button.addEventListener('click', () => {
      activeTags.delete(tag);
      renderSelectedTags();
      offset = 0;
      search();
      const original = Array.from(tagsList.querySelectorAll<HTMLButtonElement>('[data-tag]')).find((element) => element.dataset.tag === tag);
      (original?.getClientRects().length ? original : toggle).focus();
    });
    return button;
  }));
}

async function loadTags() {
  if (tags) return;
  if (!tagsPromise) {
    tagStatus.textContent = 'Loading tags...';
    tagsPromise = (async () => {
      const response = await fetch('/videos/tags.json');
      if (!response.ok) throw new Error('Tags unavailable');
      tags = await response.json();
      renderTags();
    })().catch(() => {
      tagStatus.textContent = 'Tags could not be loaded. Close and reopen the filter to retry.';
    }).finally(() => { tagsPromise = undefined; });
  }
  await tagsPromise;
}

function failSearch() {
  grid.setAttribute('aria-busy', 'false');
  grid.replaceChildren(...initialCards);
  syncFavorites();
  pagination.hidden = false;
  resultControls.style.display = 'none';
  empty.style.display = 'none';
  errorPanel.hidden = false;
  count.textContent = 'Search unavailable';
}

function getWorker(): Worker {
  if (!worker) {
    worker = new SearchWorker();
    worker.addEventListener('message', (event: MessageEvent<VideoSearchResponse>) => {
      const response = event.data;
      if (response.requestId !== requestId) return;
      if (response.error) { failSearch(); return; }
      grid.setAttribute('aria-busy', 'false');
      grid.replaceChildren(...response.videos.map(renderCard));
      syncFavorites();
      count.textContent = `${response.total} ${response.total === 1 ? 'video' : 'videos'}`;
      empty.style.display = response.total ? 'none' : 'block';
      resultControls.style.display = response.total > RESULT_PAGE_SIZE ? 'flex' : 'none';
      previous.disabled = offset === 0;
      next.disabled = offset + RESULT_PAGE_SIZE >= response.total;
      resultPage.textContent = `Page ${Math.floor(offset / RESULT_PAGE_SIZE) + 1} of ${Math.ceil(response.total / RESULT_PAGE_SIZE)}`;
      if (focusResults) { grid.focus(); focusResults = false; }
    });
    worker.addEventListener('error', () => {
      worker?.terminate();
      worker = undefined;
      if (searchInput.value.trim() || activeTags.size) failSearch();
    });
  }
  return worker;
}

function search() {
  clearTimeout(debounce);
  requestId++;
  updateUrl();
  errorPanel.hidden = true;
  const hasFilters = Boolean(searchInput.value.trim() || activeTags.size);
  clear.disabled = !hasFilters;
  pagination.hidden = hasFilters;
  empty.style.display = 'none';
  resultControls.style.display = 'none';
  if (!hasFilters) {
    grid.setAttribute('aria-busy', 'false');
    grid.replaceChildren(...initialCards);
    syncFavorites();
    count.textContent = `${totalVideos} videos`;
    focusResults = false;
    return;
  }
  grid.setAttribute('aria-busy', 'true');
  count.textContent = 'Searching...';
  try {
    getWorker().postMessage({ requestId, query: searchInput.value, tags: Array.from(activeTags), offset, limit: RESULT_PAGE_SIZE });
  } catch { failSearch(); }
}

function reset() {
  searchInput.value = '';
  tagSearch.value = '';
  activeTags.clear();
  offset = 0;
  renderTags();
  renderSelectedTags();
  search();
}

toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.classList.toggle('open', open);
  tagContainer.style.display = open ? 'block' : 'none';
  if (open) void loadTags();
});
tagSearch.addEventListener('input', renderTags);
tagsList.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-tag]');
  if (!button) return;
  const tag = button.dataset.tag!;
  if (activeTags.has(tag)) activeTags.delete(tag); else activeTags.add(tag);
  renderSelectedTags();
  offset = 0;
  search();
});
searchInput.addEventListener('input', () => {
  clearTimeout(debounce);
  requestId++;
  offset = 0;
  debounce = setTimeout(search, 180);
});
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { event.preventDefault(); search(); }
});
previous.addEventListener('click', () => { offset = Math.max(0, offset - RESULT_PAGE_SIZE); focusResults = true; search(); });
next.addEventListener('click', () => { offset += RESULT_PAGE_SIZE; focusResults = true; search(); });
clear.addEventListener('click', reset);
document.querySelector('#reset-btn')!.addEventListener('click', () => { reset(); searchInput.focus(); });
document.querySelector('#retry-search')!.addEventListener('click', search);

document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement;
  if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
    if (event.key === 'Escape') target.blur();
    return;
  }
  if (event.ctrlKey || event.altKey || event.metaKey || document.querySelector('#kbd-help.open')) return;
  if (event.key === '/') { event.preventDefault(); searchInput.focus(); }
  if (event.key === 'Escape') { event.preventDefault(); reset(); }
  if (event.key === 't') { event.preventDefault(); toggle.click(); }
});

function restoreUrl() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const query = new URLSearchParams(location.search);
  searchInput.value = hash.get('q') || query.get('q') || '';
  activeTags.clear();
  const requestedTags = [...hash.getAll('tag'), ...query.getAll('tag')];
  requestedTags.forEach((tag) => { if (tag.trim()) activeTags.add(tag); });
  offset = 0;
  if (activeTags.size) {
    tagContainer.style.display = 'block';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('open');
    void loadTags().then(() => {
      const normalized = Array.from(activeTags, (tag) => tags?.find((value) => value.toLowerCase() === tag.toLowerCase()) || tag);
      activeTags.clear();
      normalized.forEach((tag) => activeTags.add(tag));
      renderSelectedTags();
    });
  }
  renderSelectedTags();
  const focusSearch = location.hash === '#search-input';
  search();
  if (focusSearch) searchInput.focus();
}

window.addEventListener('hashchange', restoreUrl);
restoreUrl();