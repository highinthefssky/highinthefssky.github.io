# Implementation Plan: YouTube Video Hub with Community Posts

**Branch**: `001-youtube-video-hub` | **Date**: 2026-01-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-youtube-video-hub/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a high-performance, SEO-optimized static website (using Astro 4.x+) showcasing YouTube videos and community blog posts. The site features an automated YouTube video ingestion pipeline (GitHub Actions + YouTube Data API v3), a homepage carousel displaying the 3 most recent videos, full video catalog browsing, client-side keyword search, community posts with rich formatting, and an integrated chronological feed. All content is statically generated at build time with Zod schema validation, deployed to GitHub Pages, and styled with Tailwind CSS.

## Technical Context

**Language/Version**: Node.js 18+ (via Astro runtime)  
**Primary Dependencies**: Astro 4.x+, Tailwind CSS, Zod (schema validation), React/Preact (for interactive components)  
**Storage**: Astro Content Collections (file-based; `src/content/videos/` and `src/content/posts/`)  
**Testing**: Vitest (for component/utility testing); integration tests via GitHub Actions workflow validation  
**Target Platform**: Static HTML/CSS/JS deployed to GitHub Pages (browser-based, all modern browsers)  
**Project Type**: Single web project (static site generator)  
**Performance Goals**: 
- Homepage load: < 2 seconds (SC-001)
- Search filtering: < 200ms (SC-003)
- PageSpeed Insights: 90+ mobile & desktop (SC-004)
- Fully navigable on 320px+ mobile screens (SC-007)

**Constraints**: 
- SSG-only architecture (no client-side data fetching for videos/posts per Constitution Principle I)
- Build-time schema validation (Zod per Constitution Principle II)
- Images must be optimized (Constitution Principle III)
- YouTube API polling every 6-12 hours via GitHub Actions (Constitution Principle IV)
- Content must be statically generated before deployment

**Scale/Scope**: 
- Initial: 10-50 videos + ongoing community posts
- Expected growth: 1-2 new videos per day (automated)
- Mobile-first responsive design
- Single language (English)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Principle I: SSG-First Architecture** - COMPLIANT
- All video/post content fetched via GitHub Actions and committed as static files
- No client-side API calls for content retrieval
- Video search implemented client-side using pre-loaded data (FR-006a)

✅ **Principle II: Type Safety & Schema Validation** - COMPLIANT
- Video schema: id, title, description, publishedAt, thumbnail, tags (validated with Zod)
- Post schema: title, pubDate, description, author, image (url/alt), tags (validated with Zod)
- Build fails if content violates schema

✅ **Principle III: Performance & Core Web Vitals** - COMPLIANT
- YouTube thumbnails optimized via Astro `<Image />` component
- Shared UI components (VideoCard, PostCard) reusable for both content types
- Performance budgets defined (SC-001 through SC-010)

✅ **Principle IV: Automation & Data Integrity** - COMPLIANT
- GitHub Actions fetches latest 10 videos from YouTube API v3
- Idempotent check: only creates files if video ID not already in `src/content/videos/`
- Files named by YouTube Video ID (e.g., `dQw4w9WgXcQ.json`)
- Commits to main trigger deployment via GitHub Pages action

**GATE RESULT**: ✅ **PASS** - All constitutional principles satisfied. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-youtube-video-hub/
├── plan.md              # This file
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
└── checklists/
    └── requirements.md  # Quality validation (completed)
```

### Source Code (repository root - Astro single project)

```text
src/
├── content/
│   ├── config.ts                    # Zod schemas for videos & posts collections
│   ├── videos/                      # Auto-generated JSON files (one per YouTube video)
│   │   ├── dQw4w9WgXcQ.json
│   │   ├── jNQXAC9IVRw.json
│   │   └── [...]
│   └── posts/                       # Manual markdown files (community posts)
│       ├── first-post.md
│       └── [...]
├── components/
│   ├── VideoCard.astro              # Reusable video display component
│   ├── PostCard.astro               # Reusable post display component
│   ├── Carousel.astro               # Homepage video carousel
│   ├── SearchBar.astro              # Client-side video search input
│   ├── Navigation.astro             # Site header/nav
│   └── [other shared components]
├── layouts/
│   ├── BaseLayout.astro             # Main layout wrapper
│   └── [other layout variants]
├── pages/
│   ├── index.astro                  # Homepage (carousel + featured post + links)
│   ├── videos.astro                 # Video catalog page
│   ├── posts.astro                  # Community posts listing
│   ├── feed.astro                   # Integrated video + posts timeline
│   ├── videos/
│   │   └── [id].astro               # Dynamic video detail page
│   └── posts/
│       └── [slug].astro             # Dynamic post detail page
├── styles/
│   └── global.css                   # Global Tailwind styles
├── utils/
│   ├── searchVideos.ts              # Client-side video filtering logic
│   └── [other helpers]
└── env.d.ts                         # TypeScript environment types

public/
├── [static assets: logo, placeholder images]

scripts/
└── fetch-videos.js                  # GitHub Action script (YouTube API polling)

.github/
└── workflows/
    ├── fetch-videos.yml             # Cron job: fetch latest videos (6-12h interval)
    └── deploy.yml                   # Deploy to GitHub Pages on push to main

astro.config.mjs                     # Astro configuration
tailwind.config.js                   # Tailwind CSS configuration
tsconfig.json                        # TypeScript configuration
package.json                         # Dependencies & scripts
```

**Structure Decision**: Single project Astro structure selected because:
- This is a cohesive static site (not separate frontend/backend)
- Astro Content Collections naturally organize videos and posts
- All content is generated at build time (no runtime separation needed)
- Scalable to add future features (comments, analytics, etc.) without restructuring

## Complexity Tracking

No constitutional violations identified. All constraints are satisfied by the base Astro + GitHub Actions + Zod architecture.
