import { find } from 'linkifyjs';

interface DescriptionSegment {
  text: string;
  href?: string;
}

export function videoDescriptionSegments(text: string): DescriptionSegment[] {
  const segments: DescriptionSegment[] = [];
  let offset = 0;

  for (const match of find(text, { defaultProtocol: 'https' })) {
    if (match.type !== 'url') continue;
    let url: URL;
    try {
      url = new URL(match.href);
    } catch {
      continue;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;

    if (match.start > offset) segments.push({ text: text.slice(offset, match.start) });
    segments.push({ text: match.value, href: url.href });
    offset = match.end;
  }

  if (offset < text.length) segments.push({ text: text.slice(offset) });
  return segments;
}