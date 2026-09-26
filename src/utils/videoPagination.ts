export const VIDEO_PAGE_SIZE = 9;

export function videoPageUrl(page: number): string {
  return page === 1 ? '/videos/' : `/videos/page/${page}/`;
}

export function videoPageWindow(current: number, total: number): number[] {
  const start = Math.max(1, Math.min(current - 2, total - 4));
  return Array.from({ length: Math.min(5, total) }, (_, offset) => start + offset);
}