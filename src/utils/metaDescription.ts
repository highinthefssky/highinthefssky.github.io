export function metaDescription(text: string, fallback: string): string {
  const normalized = (text.trim() || fallback).replace(/\s+/g, ' ').trim();
  if (normalized.length <= 160) return normalized;

  const prefix = normalized.slice(0, 157);
  const boundary = normalized[157] === ' ' ? prefix.length : prefix.lastIndexOf(' ');
  return `${(boundary > 0 ? prefix.slice(0, boundary) : prefix).trimEnd()}...`;
}