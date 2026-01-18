# Post Schema Contract

**Type**: Data Schema (Markdown Frontmatter + Body)  
**Purpose**: Define the structure and validation rules for community post data  
**Generated**: 2026-01-18  
**Status**: Production Ready

## Overview

This schema defines the contract for Post data objects. Posts are stored as Markdown or MDX files in `src/content/posts/` with YAML frontmatter for metadata and markdown body for content. All frontmatter is validated at build time by Astro using Zod.

## Frontmatter Schema

```yaml
---
title: string                    # 1-200 chars
pubDate: date                    # YYYY-MM-DD, not in future
author: string                   # 1-100 chars
description: string              # 1-500 chars (excerpt)
image:
  url: string                    # HTTPS URL
  alt: string                    # 1-200 chars
tags: [string]                   # 0-20 tags, 1-50 chars each
---
```

## JSON Schema (Frontmatter Only)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://highinthefssky.github.io/schemas/post.schema.json",
  "title": "Community Post",
  "description": "A community blog post created by the channel owner",
  "type": "object",
  "required": [
    "title",
    "pubDate",
    "author",
    "description",
    "image",
    "tags"
  ],
  "properties": {
    "title": {
      "type": "string",
      "description": "Post title",
      "minLength": 1,
      "maxLength": 200,
      "example": "Behind the Scenes: Recording Studio Setup"
    },
    "pubDate": {
      "type": "string",
      "format": "date",
      "description": "Publication date (YYYY-MM-DD), cannot be in future",
      "example": "2026-01-15"
    },
    "author": {
      "type": "string",
      "description": "Author name",
      "minLength": 1,
      "maxLength": 100,
      "example": "Channel Owner Name"
    },
    "description": {
      "type": "string",
      "description": "Post excerpt or summary",
      "minLength": 1,
      "maxLength": 500,
      "example": "A deep dive into the studio equipment and workflow"
    },
    "image": {
      "type": "object",
      "description": "Featured image with accessibility",
      "required": ["url", "alt"],
      "properties": {
        "url": {
          "type": "string",
          "format": "uri",
          "description": "HTTPS URL to featured image",
          "pattern": "^https://",
          "example": "/images/studio-setup.jpg"
        },
        "alt": {
          "type": "string",
          "description": "Accessibility alt text",
          "minLength": 1,
          "maxLength": 200,
          "example": "Studio setup with microphone and mixer"
        }
      },
      "additionalProperties": false
    },
    "tags": {
      "type": "array",
      "description": "Content categorization tags",
      "minItems": 0,
      "maxItems": 20,
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 50,
        "pattern": "^[a-z0-9-]+$"
      },
      "example": ["behind-the-scenes", "studio"]
    }
  },
  "additionalProperties": false
}
```

## TypeScript Type Definition

```typescript
interface PostFrontmatter {
  title: string;          // 1-200 chars
  pubDate: Date;          // Not in future
  author: string;         // 1-100 chars
  description: string;    // 1-500 chars
  image: {
    url: string;          // HTTPS URL
    alt: string;          // 1-200 chars
  };
  tags: string[];         // 0-20 tags, 1-50 chars each
}

interface Post extends PostFrontmatter {
  body: string;           // Markdown/MDX content
  slug: string;           // URL slug (derived from filename)
}
```

## Example Usage

### Valid Post File

**Filename**: `src/content/posts/studio-setup-guide.md`

```markdown
---
title: Behind the Scenes: Recording Studio Setup
pubDate: 2026-01-15
author: Channel Owner Name
description: A deep dive into the studio equipment and workflow used for recording high-quality content
image:
  url: /images/studio-setup.jpg
  alt: Studio setup with microphone and mixer mounted on arm
tags:
  - behind-the-scenes
  - studio
  - equipment
---

## Main Content Here

This is the body of the post written in **Markdown**. You can use all standard markdown features:

- Bullet points
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- `inline code`

### Subsections

Code blocks with syntax highlighting:

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

And more content below...
```

## Validation Rules

| Field | Validation | Failure Behavior |
|-------|-----------|-----------------|
| `title` | 1-200 chars, non-empty | Build fails |
| `pubDate` | Valid date, not in future | Build fails |
| `author` | 1-100 chars, non-empty | Build fails |
| `description` | 1-500 chars, non-empty | Build fails |
| `image.url` | Valid HTTPS URL | Build fails |
| `image.alt` | 1-200 chars, non-empty | Build fails |
| `tags` | Array of 0-20 strings, each 1-50 chars matching `^[a-z0-9-]+$` | Build fails |
| `body` | Valid Markdown/MDX | Build fails if syntax invalid |

## Markdown Features Supported

| Feature | Syntax | Rendered |
|---------|--------|----------|
| Heading 1 | `# Text` | Large bold heading |
| Heading 2 | `## Text` | Medium heading |
| Bold | `**text**` | **bold** |
| Italic | `*text*` | *italic* |
| Link | `[text](url)` | Clickable link |
| Image | `![alt](url)` | Embedded image |
| List | `- item` | Bullet point |
| Numbered | `1. item` | Numbered list |
| Code | `` `code` `` | Inline code |
| Code Block | ` ``` ` | Syntax-highlighted block |
| Quote | `> text` | Indented blockquote |
| HR | `---` | Horizontal line |

## URL Slug Generation

Slugs are automatically derived from the filename:
- `studio-setup-guide.md` → `/posts/studio-setup-guide`
- `my-first-post.md` → `/posts/my-first-post`
- Slugs are URL-safe and lowercase

## Content Length Guidelines

### Recommended Sizes

| Field | Min | Max | Recommended |
|-------|-----|-----|-------------|
| title | 5 | 80 | 50-60 chars |
| description | 10 | 300 | 100-200 chars |
| body | 100 | unlimited | 500-2000 words |
| alt text | 10 | 120 | 50-80 chars |

### Performance Implications

- Posts < 500 words: Load instantly (< 100ms)
- Posts 500-2000 words: Load in < 500ms
- Posts > 5000 words: Consider breaking into series or pagination

## Image Recommendations

### Featured Image Requirements

- **Format**: PNG, JPG, or WebP (JPG recommended for photos)
- **Size**: 1200x600px or 16:9 aspect ratio preferred
- **File size**: < 200KB (will be optimized by Astro)
- **Location**: Relative path from `src/` or absolute public URL

### Example Image URLs

```yaml
image:
  url: /images/studio-setup.jpg        # Local file in public/images/
  url: /blog/post-1/featured.png       # Local with date structure
  url: https://example.com/image.jpg   # External URL (must be HTTPS)
```

## Implementation Notes

### File Organization

```
src/content/posts/
├── first-post.md                 # Date not in filename
├── my-series-part-1.md           # Series indicated in filename/tags
├── my-series-part-2.md           # Related via common tag
└── special-announcement.mdx      # MDX for interactive components
```

### Astro Collection Access

```astro
---
import { getCollection, getEntryBySlug } from 'astro:content';

// Get all posts
const allPosts = await getCollection('posts');

// Get single post by slug
const post = await getEntryBySlug('posts', 'studio-setup-guide');

// Sort by date
const sorted = allPosts.sort((a, b) => 
  new Date(b.data.pubDate) - new Date(a.data.pubDate)
);

// Render post body
const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <img src={post.data.image.url} alt={post.data.image.alt} />
  <Content />
</article>
```

## Versioning

**Current Version**: 1.0.0  
**Format**: Markdown with YAML frontmatter  
**Compatibility**: Astro 4.x+ Content Collections

## Migration & Evolution

If schema changes (e.g., adding required field):
1. Old posts without new field will fail build
2. Add the field to all existing posts before deploying
3. Update frontmatter template for future posts
4. Version bump in constitution

## Testing

Validate posts locally:
```bash
npm run build
# Build will fail if any post violates schema
```

Validate individual post:
```typescript
import { getEntryBySlug } from 'astro:content';
const post = await getEntryBySlug('posts', 'my-post-slug');
// Throws if invalid
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Empty body | Allowed (but unusual) - renders as empty article |
| Markdown syntax errors | Build fails with line number |
| Image URL 404 | Does not fail build; image fails to load at runtime |
| Very long title | Truncated in some UI contexts via CSS |
| Special chars in title | Allowed; escaped properly in HTML |
