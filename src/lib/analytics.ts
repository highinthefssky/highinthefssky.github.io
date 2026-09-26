export const ANALYTICS_ORIGIN = 'https://highintheflightsimsky.nl';
export const ANALYTICS_ENDPOINT = 'https://plausible.io/api/event';
export const ANALYTICS_OPT_OUT = 'analytics-opt-out';
export const analyticsEvents = [
  'pageview', 'Wizard Results', 'XML Download Started', 'Preset Download Started', 'YouTube Click',
] as const;
export type AnalyticsEvent = typeof analyticsEvents[number];

export function analyticsPage(pathname: string): string | undefined {
  const path = pathname.replace(/\/+$/, '') || '/';
  const publicPages = ['/', '/videos', '/controllers', '/controllers/wizard', '/controllers/moza', '/playlists', '/tracks', '/posts', '/feed', '/privacy', '/terms', '/contact', '/community2024', '/tools/community-folder-troubleshooter'];
  if (publicPages.includes(path)) return path === '/' ? '/' : `${path}/`;
  if (/^\/videos\/page\/\d+$/.test(path)) return '/videos/page/';
  if (/^\/controllers\/download\/xml\/[^/]+$/.test(path)) return '/controllers/download/xml/';
  if (/^\/controllers\/download\/preset\/[^/]+$/.test(path)) return '/controllers/download/preset/';
  for (const category of ['videos', 'playlists', 'tracks', 'posts']) {
    if (new RegExp(`^/${category}/[^/]+$`).test(path)) return `/${category}/detail/`;
  }
  return undefined;
}

export function analyticsPayload(name: string, href: string) {
  if (!analyticsEvents.includes(name as AnalyticsEvent)) return undefined;
  let url: URL;
  try { url = new URL(href); } catch { return undefined; }
  if (url.origin !== ANALYTICS_ORIGIN) return undefined;
  const path = analyticsPage(url.pathname);
  if (!path) return undefined;
  return { name, domain: new URL(ANALYTICS_ORIGIN).hostname, url: `${ANALYTICS_ORIGIN}${path}` };
}

export function isYouTubeLink(href: string): boolean {
  let url: URL;
  try { url = new URL(href); } catch { return false; }
  if (url.protocol !== 'https:') return false;
  return url.hostname === 'youtu.be' || url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com');
}