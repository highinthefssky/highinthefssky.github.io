# Research: YouTube Video Hub Implementation

**Feature**: YouTube Video Hub with Community Posts  
**Branch**: `001-youtube-video-hub`  
**Date**: 2026-01-18  
**Purpose**: Resolve technical ambiguities and document best practices for implementation

## Research Tasks

All technical context has been provided. The following research validates implementation feasibility and documents best practices:

### 1. Astro Content Collections Best Practices for Dynamic Content

**Question**: How should Astro Content Collections be configured to support both manually-created posts and auto-generated video JSON files?

**Decision**: Use separate collections for videos and posts
- **Videos Collection**: 
  - Schema: Zod validation for id, title, description, publishedAt, thumbnail, tags
  - Location: `src/content/videos/` (auto-populated by GitHub Action)
  - Format: JSON files (one per video, named by YouTube ID)
  - Access: `getCollection('videos')` returns all videos
  
- **Posts Collection**:
  - Schema: Zod validation for title, pubDate, author, description, image, tags, body
  - Location: `src/content/posts/` (manually created markdown files)
  - Format: MDX files with YAML frontmatter
  - Access: `getCollection('posts')` returns all posts

**Rationale**: Astro Content Collections provide type-safe access to both content types with Zod validation at build time. Separate collections allow different file formats (JSON vs Markdown) while maintaining a unified API.

**References**:
- Astro Content Collections: https://docs.astro.build/en/guides/content-collections/
- Zod Validation: https://docs.astro.build/en/guides/content-collections/#defining-a-collection-schema
- Generate JSON from API: Can be done via GitHub Actions or during Astro build

### 2. Client-Side Video Search Implementation

**Question**: How to implement sub-200ms search filtering on potentially hundreds of videos without violating SSG architecture?

**Decision**: Client-side filtering with pre-loaded data array
- Videos collection is serialized to a JSON file at build time
- JavaScript loads this data and filters on keystrokes (using native `Array.filter()`)
- No API calls, no server-side logic
- Performance: Local filtering typically completes in < 10ms for 100+ videos

**Implementation Approach**:
1. During build: `export const searchableVideos = videos.map(v => ({ id: v.id, title: v.title, description: v.description, tags: v.tags }))`
2. In browser: Listen to search input, filter array, update DOM
3. Consider: Debounce search input to further optimize

**Rationale**: Client-side filtering respects SSG constraint (no runtime data fetching), meets sub-200ms requirement, and provides instant feedback to users.

**Alternative Considered**: Pre-rendered category pages (rejected because: less flexible, requires rebuilding for each category change, worse UX than instant filtering)

### 3. YouTube API Integration Pattern for GitHub Actions

**Question**: How to structure the GitHub Actions workflow to fetch videos, validate, and commit idempotently?

**Decision**: Pull-and-Commit pattern with idempotency checks
```yaml
Schedule: Every 6-12 hours via cron
Steps:
1. Fetch latest 10 videos from YouTube API v3
2. For each video:
   a. Check if `src/content/videos/{videoId}.json` exists
   b. If not, create new file with video data (validated against schema)
   c. If exists, skip (idempotent - prevents duplicates)
3. Commit new files to main (if any)
4. Push triggers GitHub Pages deployment
```

**Error Handling**:
- API unavailable: Fail gracefully, retry on next schedule (no partial commits)
- Invalid video data: Skip video, log error, continue with others
- Build failure: Prevent deployment, notify via GitHub Checks

**Rationale**: Idempotent design ensures running multiple times doesn't duplicate data. Commit-based approach provides full audit trail via Git history.

**Implementation Location**: `.github/workflows/fetch-videos.yml` and `scripts/fetch-videos.js`

### 4. Astro Image Optimization for YouTube Thumbnails

**Question**: How to optimize external YouTube thumbnail images within Astro's SSG constraints?

**Decision**: Use Astro's `<Image />` component with remote image optimization
```astro
---
import { Image } from 'astro:assets';
const video = await getEntry('videos', videoId);
---
<Image 
  src={video.thumbnail}
  alt={video.title}
  width={320}
  height={180}
  format="webp"
/>
```

**Benefits**:
- Automatic format conversion (WebP with JPEG fallback)
- Responsive image generation (multiple sizes)
- Eliminates layout shift (Cumulative Layout Shift ~ 0)
- Image is optimized at build time

**Rationale**: Astro's built-in image optimization ensures Core Web Vitals compliance (SC-004, SC-005). External URLs are supported natively.

**Reference**: https://docs.astro.build/en/guides/images/

### 5. Embedded YouTube Player Best Practice

**Question**: How to embed YouTube videos while maintaining SSG and performance?

**Decision**: Use iframe with YouTube's embed URL
```astro
<iframe 
  width="100%" 
  height="600" 
  src={`https://www.youtube.com/embed/${video.id}`}
  title={video.title}
  frameborder="0" 
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
  allowfullscreen>
</iframe>
```

**Considerations**:
- Iframe is static HTML (no JavaScript required, SSG-compliant)
- Content is lazy-loaded by YouTube (doesn't impact page load)
- Respects Constitution Principle I (no client-side API calls)

**Alternative**: Third-party embed components (rejected because: less control, additional dependencies)

### 6. Carousel Component Implementation

**Question**: Should the homepage carousel use a library or be custom-built?

**Decision**: Use a lightweight carousel library or custom component
- **Option A**: Embla Carousel (headless, framework-agnostic, 1kb)
- **Option B**: Splide (pure JS, lightweight, accessible)
- **Option C**: Custom HTML/CSS carousel with minimal JavaScript

**Recommendation**: Custom carousel or Embla Carousel
- Minimal dependencies (Constitution principle: simplicity)
- Easy to customize with Tailwind CSS
- Accessible keyboard navigation included
- No impact on Core Web Vitals

**Implementation**: Astro component with client-side JavaScript for interactivity (carousel doesn't violate SSG since videos are pre-loaded)

### 7. Tailwind CSS Setup with Astro

**Question**: How to integrate Tailwind CSS with Astro for optimal build size?

**Decision**: Official Astro Integration
```bash
npm install -D tailwindcss @astrojs/tailwind
```

Configure in `astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
```

**Benefits**:
- Automatic PurgeCSS (unused styles removed)
- Works with Astro components out of the box
- Hot reload in dev mode

### 8. GitHub Pages Deployment with Astro

**Question**: How to deploy Astro static site to GitHub Pages?

**Decision**: Use GitHub Pages deploy action
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Astro Config**:
```js
export default defineConfig({
  site: 'https://yourusername.github.io',
  base: '/', // or '/repo-name/' if not a user repo
});
```

**Rationale**: GitHub Pages action handles deployment, Astro's SSG output is ready for static hosting.

## Recommendations Summary

| Topic | Approach | Rationale |
|-------|----------|-----------|
| Content Collections | Separate videos + posts collections | Type-safe, SSG-compliant, scalable |
| Video Search | Client-side filtering | Sub-200ms, SSG-compliant, instant feedback |
| YouTube Automation | GitHub Actions with idempotency | Audit trail, prevents duplicates, reliable |
| Image Optimization | Astro `<Image />` component | Automatic WebP, Core Web Vitals compliant |
| Video Playback | YouTube iframe embed | SSG-compliant, lazy-loaded, lightweight |
| Carousel | Custom or Embla Carousel | Minimal deps, tailwind-friendly, accessible |
| Styling | Astro + Tailwind CSS integration | Optimal build size, hot reload, DX |
| Deployment | GitHub Actions + peaceiris action | Automated, reliable, integrated with workflow |

## Implementation Readiness

✅ **All research questions answered**  
✅ **No blocking ambiguities remain**  
✅ **Best practices documented**  
✅ **Ready to proceed to Phase 1: Data Model & Contracts**

### Next Steps

1. Generate data-model.md with:
   - Video entity definition
   - Post entity definition
   - Tag entity definition
   - Data relationships
   - Validation rules (Zod schemas)

2. Generate contracts/ with:
   - Video schema OpenAPI/JSON definition
   - Post schema OpenAPI/JSON definition
   - Content Collection interface types

3. Generate quickstart.md with:
   - Project setup instructions
   - Local development workflow
   - Build and deploy commands
