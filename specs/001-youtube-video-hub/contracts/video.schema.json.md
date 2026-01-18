# Video Schema Contract

**Type**: Data Schema (JSON)  
**Purpose**: Define the structure and validation rules for YouTube video data  
**Generated**: 2026-01-18  
**Status**: Production Ready

## Overview

This schema defines the contract for Video data objects used throughout the YouTube Video Hub. Videos are stored as JSON files in `src/content/videos/` and are validated both at creation time (by GitHub Action) and at build time (by Astro).

## JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://highinthefssky.github.io/schemas/video.schema.json",
  "title": "YouTube Video",
  "description": "A YouTube video synchronized from the channel owner's YouTube channel",
  "type": "object",
  "required": [
    "id",
    "title",
    "description",
    "publishedAt",
    "thumbnail",
    "tags"
  ],
  "properties": {
    "id": {
      "type": "string",
      "description": "YouTube Video ID (11 characters)",
      "pattern": "^[a-zA-Z0-9_-]{11}$",
      "example": "dQw4w9WgXcQ"
    },
    "title": {
      "type": "string",
      "description": "Video title",
      "minLength": 1,
      "maxLength": 200,
      "example": "Rick Astley - Never Gonna Give You Up"
    },
    "description": {
      "type": "string",
      "description": "Video description",
      "minLength": 1,
      "maxLength": 5000,
      "example": "Official music video for Rick Astley's Never Gonna Give You Up"
    },
    "publishedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 publication date and time",
      "example": "2009-10-25T06:57:33Z"
    },
    "thumbnail": {
      "type": "string",
      "format": "uri",
      "description": "HTTPS URL to video thumbnail image",
      "pattern": "^https://",
      "example": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    },
    "tags": {
      "type": "array",
      "description": "Array of content tags for categorization",
      "minItems": 0,
      "maxItems": 20,
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 50,
        "pattern": "^[a-z0-9-]+$"
      },
      "example": ["music", "80s", "pop"]
    },
    "series": {
      "type": "string",
      "description": "Optional video series identifier",
      "minLength": 1,
      "maxLength": 100,
      "example": "Top 10 Songs"
    },
    "duration": {
      "type": "integer",
      "description": "Video duration in seconds",
      "minimum": 0,
      "example": 213
    },
    "viewCount": {
      "type": "integer",
      "description": "YouTube view count (informational only)",
      "minimum": 0,
      "example": 1234567890
    }
  },
  "additionalProperties": false
}
```

## TypeScript Type Definition

```typescript
interface Video {
  id: string;           // 11-char YouTube Video ID
  title: string;        // 1-200 chars
  description: string;  // 1-5000 chars
  publishedAt: string;  // ISO 8601 datetime
  thumbnail: string;    // HTTPS URL
  tags: string[];       // 0-20 tags, each 1-50 chars
  series?: string;      // Optional series name
  duration?: number;    // Duration in seconds
  viewCount?: number;   // View count from YouTube
}
```

## Example Usage

### Valid Video

```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
  "description": "Official Music Video for Rick Astley's 'Never Gonna Give You Up'. The song was a single from his debut album Whenever You Need Somebody.",
  "publishedAt": "2009-10-25T06:57:33Z",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "tags": ["music", "80s", "pop", "official-music-video"],
  "series": "Classic Hits",
  "duration": 213,
  "viewCount": 1234567890
}
```

### File Location

```
src/content/videos/dQw4w9WgXcQ.json
```

## Validation Rules

| Field | Validation | Failure Behavior |
|-------|-----------|-----------------|
| `id` | Exactly 11 chars, alphanumeric + underscore/hyphen | Build fails, clear error message |
| `title` | 1-200 chars, non-empty | Build fails |
| `description` | 1-5000 chars, non-empty | Build fails |
| `publishedAt` | Valid ISO 8601 datetime | Build fails |
| `thumbnail` | Valid HTTPS URL | Build fails |
| `tags` | Array of 0-20 strings, each 1-50 chars matching `^[a-z0-9-]+$` | Build fails |
| `series` | Optional, 1-100 chars if provided | Build fails if invalid |
| `duration` | Optional, positive integer if provided | Build fails if invalid |
| `viewCount` | Optional, non-negative integer if provided | Build fails if invalid |

## Implementation Notes

### Generation (GitHub Action)

```javascript
// Fetch from YouTube API v3
const video = {
  id: item.id,
  title: item.snippet.title,
  description: item.snippet.description || '',
  publishedAt: item.snippet.publishedAt,
  thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high.url,
  tags: (item.snippet.tags || []).map(t => t.toLowerCase().replace(/\s+/g, '-')),
  duration: parseDuration(item.contentDetails.duration),
  viewCount: parseInt(item.statistics.viewCount, 10),
};

// Validate against schema
const valid = await videoSchema.parseAsync(video);
```

### Consumption (Astro Component)

```astro
---
import { getCollection } from 'astro:content';
const videos = await getCollection('videos');
---

{videos.map(video => (
  <article data-video-id={video.data.id}>
    <img src={video.data.thumbnail} alt={video.data.title} />
    <h2>{video.data.title}</h2>
    <p>{video.data.description}</p>
  </article>
))}
```

## API Compatibility

This schema is compatible with:
- **Astro Content Collections**: Zod validation
- **JSON Schema Draft 7**: Full compliance
- **TypeScript**: Interface above
- **REST APIs**: Can be extended for future API usage

## Versioning

**Current Version**: 1.0.0  
**Format**: JSON (file-based, not versioned in field)  
**Migration Path**: If schema changes, old videos remain compatible (new fields optional, removed fields handled gracefully)

## Testing

Validate videos against this schema using:
```bash
# Node.js
const Ajv = require('ajv');
const ajv = new Ajv();
const validate = ajv.compile(schema);
const valid = validate(videoData);

# Python
import jsonschema
jsonschema.validate(video_data, schema)
```
