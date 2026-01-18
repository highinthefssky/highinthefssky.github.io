<!--
SYNC IMPACT REPORT
==================
Version Change: Template → 1.0.0
Change Type: Initial Constitution (MAJOR)
Date: 2026-01-18

Principles Defined:
- Principle 1: SSG-First Architecture (NEW)
- Principle 2: Type Safety & Schema Validation (NEW)
- Principle 3: Performance & Core Web Vitals (NEW)
- Principle 4: Automation & Data Integrity (NEW)

Sections Added:
- Technology Stack Standards
- Development & Deployment Workflow
- Governance

Templates Status:
✅ plan-template.md - Reviewed, compatible with constitution
✅ spec-template.md - Reviewed, compatible with constitution  
✅ tasks-template.md - Reviewed, compatible with constitution
✅ checklist-template.md - Not modified, general-purpose
✅ agent-file-template.md - Not modified, general-purpose

Follow-up Actions:
- None required
-->

# High in the Sky - Website Constitution

## Core Principles

### I. SSG-First Architecture (NON-NEGOTIABLE)

**Rule**: All content MUST be statically generated at build time. No client-side data fetching is permitted for core content (videos, posts).

**Rationale**: This project prioritizes performance, SEO, and "Zero JS" where possible. Static Site Generation (SSG) ensures:
- Maximum performance with no runtime data fetching overhead
- Superior SEO through pre-rendered content
- Reduced complexity and attack surface
- Optimal Core Web Vitals scores

**Implementation Requirements**:
- YouTube video data MUST be fetched via GitHub Actions and committed as JSON files
- Blog posts MUST be authored as Markdown/MDX files in the repository
- Astro Content Collections MUST be used for all content with local file sources
- No `useEffect`, `fetch`, or client-side API calls for content retrieval

### II. Type Safety & Schema Validation

**Rule**: All content collections MUST use Zod schemas defined in `src/content/config.ts`. Data structure violations MUST fail at build time, not runtime.

**Rationale**: Type safety prevents deployment of invalid content and catches errors early in the development cycle. Zod validation ensures:
- Automated content validation during build
- Prevention of malformed data reaching production
- Self-documenting data structures
- Confidence in automated content ingestion

**Implementation Requirements**:
- Video collection schema MUST validate: id, title, description, publishedAt (date), thumbnail (URL), tags (array)
- Post collection schema MUST validate: title, pubDate (date), description, author, image (object with url/alt), tags (array)
- Build MUST fail if any content file violates its schema
- Schema changes require version review and migration plan

### III. Performance & Core Web Vitals

**Rule**: Images MUST be optimized. Shared UI components MUST be reusable (DRY). Performance degradation is a blocking issue.

**Rationale**: As a content-heavy site featuring external images (YouTube thumbnails), unoptimized assets directly harm user experience and SEO rankings.

**Implementation Requirements**:
- All images MUST use Astro's `<Image />` component or equivalent optimization
- YouTube thumbnails MUST be processed/proxied for optimization
- Shared components (Cards, Buttons) MUST be used for both Video and Post previews
- No duplicate component logic between content types
- Performance budgets: Core Web Vitals targets must be defined and monitored

### IV. Automation & Data Integrity

**Rule**: The YouTube data pipeline MUST follow the "Pull-and-Commit" pattern. Automation MUST NOT overwrite existing content or create duplicates.

**Rationale**: Automated content ingestion reduces manual work but introduces risk of data corruption or duplication. The commit-based approach provides:
- Full audit trail via Git history
- Rollback capability
- Idempotency (running multiple times doesn't duplicate data)
- Transparent change tracking

**Implementation Requirements**:
- GitHub Action MUST run on cron schedule (every 6-12 hours) or manual dispatch
- Action MUST query YouTube Data API v3 for latest 10 videos
- Action MUST check `src/content/videos/` for existing files by ID before creating new ones
- New video files MUST be named by YouTube Video ID (e.g., `dQw4w9WgXcQ.json`)
- Action MUST commit new files to main branch, triggering deployment
- Failed API calls MUST NOT commit partial/invalid data

## Technology Stack Standards

**Framework**: Astro 4.x+ in SSG mode (Static Site Generation)

**Styling**: Tailwind CSS for utility-first styling

**Deployment**: GitHub Pages with automated deployment via GitHub Actions

**Data Architecture**: Astro Content Collections with Zod validation

**Automation**: GitHub Actions + YouTube Data API v3

**Constraints**:
- Node.js version MUST be specified in `.nvmrc` or `package.json` engines field
- Dependencies MUST be locked with `package-lock.json` or equivalent
- External API keys (YouTube API) MUST be stored in GitHub Secrets, never committed

## Development & Deployment Workflow

**Content Creation**:
- Manual posts: Create Markdown/MDX files in `src/content/posts/` with required frontmatter
- Video content: Automated via GitHub Action, no manual intervention required

**Quality Gates**:
- All builds MUST pass Zod schema validation
- Astro build MUST complete without errors
- No broken internal links (lint via `astro check` or equivalent)

**Deployment Process**:
1. Commit to `main` branch (manual commits or automation bot)
2. GitHub Actions runs Astro build
3. Build artifacts deployed to GitHub Pages
4. Deployment status verified

**Review Requirements**:
- Manual post changes: Standard PR review for content accuracy
- Automation changes: PR review required for any modification to fetch/commit scripts
- Schema changes: MUST include migration plan and impact assessment

## Governance

This constitution defines the architectural and quality standards for the High in the Sky website project. All development work, feature additions, and maintenance MUST align with these principles.

**Amendment Process**:
- Proposed amendments MUST be documented with rationale and impact analysis
- Constitution version MUST be incremented following semantic versioning:
  - **MAJOR**: Principle removal, redefinition, or backward-incompatible governance change
  - **MINOR**: New principle added or material expansion of existing guidance
  - **PATCH**: Clarifications, wording improvements, typo fixes
- Amendments require consensus from project maintainers
- Migration plan required for changes affecting existing content or automation

**Compliance**:
- All feature specifications MUST reference relevant constitutional principles
- Implementation plans MUST include "Constitution Check" section verifying alignment
- Code reviews MUST verify adherence to principles
- Deviations MUST be explicitly justified and documented

**Version**: 1.0.0 | **Ratified**: 2026-01-18 | **Last Amended**: 2026-01-18
