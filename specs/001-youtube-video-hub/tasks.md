# Tasks: YouTube Video Hub with Community Posts

**Input**: Design documents from `/specs/001-youtube-video-hub/`
**Prerequisites**: ✅ spec.md, ✅ plan.md, ✅ research.md, ✅ data-model.md, ✅ contracts/

**Organization**: Tasks grouped by user story (P1, P2, P3) enabling independent implementation and parallel execution

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story identifier (US1, US2, US3, US4, US5)
- **File paths**: Exact locations for code/config changes

## Path Conventions

**Single project Astro structure**:
- `src/content/` - Astro Content Collections (videos, posts)
- `src/components/` - Reusable Astro components
- `src/pages/` - Dynamic/static pages
- `src/layouts/` - Layout components
- `src/utils/` - Utility functions
- `src/styles/` - Global styles
- `public/` - Static assets
- `scripts/` - Automation scripts
- `.github/workflows/` - GitHub Actions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, configuration, and foundational structure
**Duration**: ~2-3 hours
**Deliverable**: Functional Astro project ready for content collection setup

- [ ] T001 Initialize Astro project with `npm create astro@latest` in repository root
- [ ] T002 [P] Configure `astro.config.mjs` with Tailwind CSS integration and site URL settings
- [ ] T002b [P] Install required dependencies: `@astrojs/tailwind`, `tailwindcss`, `zod`
- [ ] T003 [P] Configure `tailwind.config.js` with theme extensions and layout utilities
- [ ] T004 [P] Create `tsconfig.json` with strict mode and Astro-specific settings
- [ ] T005 [P] Create `src/styles/global.css` with Tailwind directives and global base styles
- [ ] T006 Create `.env.local` template with YouTube API configuration variables (YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID)
- [ ] T007 [P] Create base layout component in `src/layouts/BaseLayout.astro` with navigation skeleton
- [ ] T008 [P] Create navigation component in `src/components/Navigation.astro` with links to home, videos, posts, feed
- [ ] T009 Setup `.github/workflows/deploy.yml` for GitHub Pages deployment on push to main
- [ ] T010 Setup GitHub secrets for YouTube API credentials (YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID)

**Checkpoint**: Astro project compiles successfully, `npm run dev` runs on localhost:3000, base layout renders

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before any user story implementation
**Duration**: ~3-4 hours
**Deliverable**: Content Collections configured, validation schemas in place, automation script ready

### Content Collections & Validation

- [ ] T011 Create `src/content/config.ts` with Zod schemas for videos and posts collections
- [ ] T012 [P] Define Video schema in `src/content/config.ts`:
  - id (11-char YouTube ID), title, description, publishedAt, thumbnail, tags, series?, duration?, viewCount?
  - Validate all required fields, thumbnail as HTTPS URL, tags pattern `^[a-z0-9-]+$`
- [ ] T013 [P] Define Post schema in `src/content/config.ts`:
  - title, pubDate (not future), author, description, image (url, alt), tags
  - Validate all required fields, image.url as HTTPS URL, pubDate <= today
- [ ] T014 Create `src/content/videos/` directory (will be auto-populated by GitHub Action)
- [ ] T015 Create `src/content/posts/` directory with example post file (hello-world.md)
- [ ] T016 [P] Create `src/utils/searchVideos.ts` with client-side video filtering function:
  - Takes searchTerm, videos array; returns filtered videos matching title/description/tags
  - Case-insensitive, handles special characters, returns original sort order

### GitHub Actions Automation

- [ ] T017 Create `scripts/fetch-videos.js` for YouTube API polling:
  - Fetch latest 10 videos from channel (YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID env vars)
  - Validate each video against Video schema (validate before write)
  - Check if `src/content/videos/{videoId}.json` exists (idempotency)
  - Write new videos as JSON files (one per video, named by videoId)
  - Handle errors gracefully (skip invalid, log errors, don't commit partial data)
- [ ] T018 [P] Create `.github/workflows/fetch-videos.yml` GitHub Action:
  - Schedule: cron every 6-12 hours OR manual dispatch
  - Install Node.js, run `scripts/fetch-videos.js`
  - Git commit new video files (if any) to main branch
  - Handle API failures without committing invalid data
- [ ] T019 Create documentation in `CONTRIBUTING.md` for manual post creation workflow

**Checkpoint**: 
- ✅ Astro runs without Content Collection errors
- ✅ Video and Post schemas validated at build time
- ✅ `scripts/fetch-videos.js` executes successfully (test locally)
- ✅ GitHub Actions workflows created and accessible
- ✅ User story implementation can begin in parallel

---

## Phase 3: User Story 1 - View Latest Videos in Homepage Carousel (Priority: P1) 🎯 MVP

**Goal**: Homepage displays 3 most recent YouTube videos in an interactive carousel with thumbnails and titles

**Independent Test**: 
1. Navigate to homepage
2. Verify carousel displays exactly 3 videos (or fewer if < 3 exist)
3. Click next/previous buttons → carousel transitions smoothly
4. Click video thumbnail → navigate to video detail page

### Implementation for US1

#### Components

- [ ] T020 [P] [US1] Create `src/components/VideoCard.astro`:
  - Props: video (Video type), showDescription (bool, default true)
  - Render: thumbnail image, title, publication date, description (if showDescription)
  - Use Astro Image component for thumbnail optimization
  - Link wraps entire card → navigates to video detail page

- [ ] T021 [P] [US1] Create `src/components/Carousel.astro`:
  - Props: videos (Video[], exactly 3 or fewer), featured (optional featured content)
  - Render: carousel with prev/next buttons, dots for navigation
  - Client-side interactivity: use lightweight JS (Embla or custom)
  - Responsive: full width on mobile, constrained width on desktop

- [ ] T022 [US1] Create `src/pages/index.astro` (homepage):
  - Import and sort all videos by publishedAt (descending)
  - Take first 3 videos, pass to Carousel component
  - If < 3 videos: show available videos with message "More videos coming soon"
  - Include featured community post section below carousel (stub for US4)
  - Include navigation links to full videos page, posts page

#### Detail Page

- [ ] T023 [US1] Create `src/pages/videos/[id].astro` (dynamic video detail page):
  - Route: `/videos/{videoId}`
  - Fetch video by ID from collection
  - Render: embedded YouTube player (iframe), title, description, publication date, tags
  - Display tags as clickable links to filter on videos page
  - Show related videos (same tags) below player

#### Styles & Responsive Design

- [ ] T024 [P] [US1] Add carousel styles to `src/styles/global.css`:
  - Carousel transitions (smooth animation)
  - Navigation button styling (hover, active states)
  - Dot indicators (current position highlight)
  - Mobile: full-width carousel, touch-friendly buttons
  - Desktop: constrained width (max 1200px), centered

- [ ] T025 [P] [US1] Ensure `src/components/VideoCard.astro` responsive:
  - Mobile: single column, full-width cards
  - Tablet: adjustable font sizes
  - Desktop: optimized spacing and padding

#### Testing & Validation

- [ ] T026 [US1] Test homepage carousel locally:
  - `npm run build` → check for Content Collection errors
  - `npm run dev` → navigate to localhost:3000
  - Verify carousel displays (3 or fewer videos)
  - Verify next/previous buttons work
  - Verify video card click navigates to detail page
  - Test on mobile screen (DevTools mobile view)

- [ ] T027 [US1] Validate video detail page:
  - Click video from carousel
  - Verify YouTube player embeds and plays
  - Verify video title, description, publication date display
  - Verify tags show (if any)

**Checkpoint**: 
- ✅ Homepage renders with carousel
- ✅ Carousel displays 3 latest videos with proper styling
- ✅ Video cards are clickable and navigate to detail pages
- ✅ YouTube embedded players load without errors
- ✅ Mobile responsive (tested on 320px+ width)
- ✅ US1 is independently testable and deployable

---

## Phase 4: User Story 2 - Browse All YouTube Videos (Priority: P1)

**Goal**: Dedicated videos page displays all YouTube videos in a browsable grid/list, sorted by newest first

**Independent Test**:
1. Navigate to `/videos` page
2. Verify all videos displayed (not just 3)
3. Verify sorted by publication date (newest first)
4. Verify each video shows thumbnail, title, date, description
5. Click video → navigate to detail page

### Implementation for US2

#### Pages

- [ ] T028 [P] [US2] Create `src/pages/videos.astro` (all videos page):
  - Fetch all videos from collection
  - Sort by publishedAt (descending)
  - Display in grid layout (3 columns on desktop, 1-2 on mobile)
  - Each item uses VideoCard component
  - Render heading "All Videos" with count badge

#### Styling

- [ ] T029 [P] [US2] Add video grid styles to `src/styles/global.css`:
  - Grid: 3 columns desktop, 2 columns tablet, 1 column mobile
  - Gap: consistent spacing between cards
  - Hover effects: shadow, scale (subtle)
  - Responsive breakpoints: 1024px (desktop), 768px (tablet), 320px (mobile)

- [ ] T030 [US2] Enhance VideoCard for grid display:
  - Variant: show full description in grid view
  - Truncate title if too long (CSS text-overflow)
  - Consistent card height to maintain grid alignment

#### Testing & Validation

- [ ] T031 [US2] Test videos page locally:
  - `npm run dev` → navigate to /videos
  - Verify all videos display (not capped at 3)
  - Verify sorted newest-to-oldest (check first 3 videos)
  - Verify grid layout (desktop 3 cols, mobile 1 col)
  - Verify video click navigates to detail

- [ ] T032 [US2] Test pagination/performance:
  - If 50+ videos: verify page loads quickly (< 2s)
  - Verify no layout shift as images load
  - Test scrolling performance (smooth)

**Checkpoint**:
- ✅ `/videos` page displays all videos
- ✅ Videos sorted by date (newest first)
- ✅ Grid layout responsive and performant
- ✅ US2 independently testable and deployable
- ✅ US1 + US2 together form core video browsing MVP

---

## Phase 5: User Story 3 - Search for Videos by Keywords (Priority: P2)

**Goal**: Search bar filters video list client-side by title, description, or tags (sub-200ms response)

**Independent Test**:
1. Navigate to `/videos` page
2. Type keyword in search bar
3. Verify results filter in real-time (< 200ms)
4. Verify search matches title, description, or tags
5. Clear search → all videos re-appear

### Implementation for US3

#### Components

- [ ] T033 [P] [US3] Create `src/components/SearchBar.astro`:
  - Input field with placeholder "Search videos..."
  - Client-side event listener (input, debounce 100ms)
  - Dispatch custom event with search term
  - Clear button to reset search
  - Accessible: proper labels, keyboard navigation

#### Pages - Search Integration

- [ ] T034 [US3] Modify `src/pages/videos.astro` to add search functionality:
  - Inject searchableVideos data (titles, descriptions, tags) into page as JSON
  - Add SearchBar component above video grid
  - Client-side: listen to search events, filter videos, update DOM
  - Show "No videos found" message if search yields 0 results with suggestions

#### Utilities

- [ ] T035 [P] [US3] Enhance `src/utils/searchVideos.ts`:
  - Function: `filterVideos(term: string, videos: Video[]): Video[]`
  - Match: case-insensitive search across title, description, tags
  - Return: original sort order maintained
  - Performance: < 10ms for 100 videos on modern hardware

#### Client-Side Script

- [ ] T036 [US3] Add search script to `src/pages/videos.astro`:
  - Initialize with all videos data embedded in page (SSG)
  - On input: call searchVideos() filter function
  - Update DOM: show/hide video cards based on results
  - Maintain sort order (newest first)

#### Styles

- [ ] T037 [P] [US3] Add search styles to `src/styles/global.css`:
  - Search bar container: sticky or fixed top
  - Input styling: border, focus state, placeholder color
  - Clear button: hover, active states
  - "No results" message: centered, friendly styling
  - Result count badge: shows X videos found

#### Testing & Validation

- [ ] T038 [US3] Test search functionality locally:
  - `npm run dev` → navigate to /videos
  - Type single letter → results filter instantly
  - Type video series name → all videos in series appear
  - Type nonsense → "No videos found" message
  - Clear search → all videos reappear
  - Measure response time: should be < 200ms (dev tools)

- [ ] T039 [US3] Test edge cases:
  - Search special characters: `!@#$` → handled gracefully
  - Search very long term: 100+ chars → handled
  - Multiple spaces: normalized
  - Case insensitivity: "TUTORIAL" finds "tutorial"

- [ ] T040 [US3] Test performance:
  - Simulate 100+ videos
  - Verify search still < 200ms response time
  - No layout shift as results update

**Checkpoint**:
- ✅ Search bar appears on videos page
- ✅ Filtering works client-side, < 200ms
- ✅ Results match title, description, tags
- ✅ UX: instant feedback, clear results
- ✅ US3 independently testable

---

## Phase 6: User Story 4 - Read and Browse Community Posts (Priority: P2)

**Goal**: Dedicated posts page displays community blog posts in reverse chronological order with proper formatting

**Independent Test**:
1. Navigate to `/posts` page
2. Verify all posts display with title, date, author, excerpt, featured image
3. Verify sorted newest-to-oldest
4. Click post → navigate to detail page with full content
5. Full post renders markdown/formatting correctly

### Implementation for US4

#### Collections & Entities

- [ ] T041 [P] [US4] Create example post file `src/content/posts/hello-world.md`:
  - Complete YAML frontmatter: title, pubDate, author, description, image, tags
  - Markdown body with heading, paragraphs, bold/italic, link
  - Serves as template for users creating new posts

#### Components

- [ ] T042 [P] [US4] Create `src/components/PostCard.astro`:
  - Props: post (Post type), showExcerpt (bool, default true)
  - Render: featured image, title, publication date, author, excerpt/description
  - Use Astro Image component for featured image optimization
  - Link wraps entire card → navigates to post detail page

- [ ] T043 [P] [US4] Create `src/components/PostList.astro`:
  - Props: posts (Post[])
  - Render: list of PostCard components
  - Sort: newest to oldest (by pubDate)
  - Shows empty state if no posts

#### Pages

- [ ] T044 [US4] Create `src/pages/posts.astro` (all posts page):
  - Fetch all posts from collection
  - Sort by pubDate (descending)
  - Use PostList component to render
  - Include heading "Community Posts" with count

- [ ] T045 [US4] Create `src/pages/posts/[slug].astro` (dynamic post detail page):
  - Route: `/posts/{slug}`
  - Fetch post by slug from collection
  - Render post using MDX renderer: title, featured image, metadata (date, author), content
  - Render markdown body with proper formatting (headings, links, images, code blocks)
  - Show tags below content (optional links to filter posts)
  - Navigation: "← Back to posts" link

#### Markdown Processing

- [ ] T046 [US4] Configure Astro for Markdown rendering:
  - Enable markdown in `astro.config.mjs` (should be default)
  - Test markdown features: headings, bold, italic, links, lists, code blocks
  - Ensure HTML escaping (no XSS vulnerabilities)

#### Styles

- [ ] T047 [P] [US4] Add post list styles to `src/styles/global.css`:
  - Post card layout: image on left (desktop), stacked (mobile)
  - Featured image: max-width 300px desktop, full-width mobile
  - Text hierarchy: title (larger), date/author (smaller), excerpt (regular)
  - Hover effect: subtle shadow or background color change
  - Spacing: consistent gaps between cards

- [ ] T048 [P] [US4] Add post detail styles to `src/styles/global.css`:
  - Featured image: full-width, max-width 800px, centered
  - Content width: max 700px for readability
  - Headings: H2-H4 with proper sizing and spacing
  - Paragraphs: line-height 1.6-1.8 for readability
  - Code blocks: background color, monospace font, syntax highlighting (optional)
  - Links: underlined or colored, hover state

#### Featured Image Optimization

- [ ] T049 [US4] Optimize featured images in post detail:
  - Use Astro Image component for all post images
  - Generate responsive sizes (320px mobile, 800px desktop)
  - Format: WebP with JPEG fallback
  - Alt text required (from frontmatter image.alt)

#### Testing & Validation

- [ ] T050 [US4] Test posts page locally:
  - `npm run dev` → navigate to /posts
  - Verify all posts display (or "no posts yet" message)
  - Verify sorted newest-to-oldest (check first post date)
  - Verify featured images load
  - Verify click navigates to detail

- [ ] T051 [US4] Test post detail page:
  - Click post from listing
  - Verify featured image displays and optimized (no CLS)
  - Verify markdown renders correctly (headings, bold, links, lists)
  - Verify back link navigates to posts page
  - Test on mobile (responsive layout)

- [ ] T052 [US4] Test markdown edge cases:
  - Post with long title → truncate/wrap properly
  - Post with no excerpt → use default
  - Post with broken image URL → placeholder or skip
  - Post with code blocks → formatted correctly
  - Post with inline code → monospace font

**Checkpoint**:
- ✅ `/posts` page displays all community posts
- ✅ Posts sorted newest-to-oldest
- ✅ Post detail pages render markdown properly
- ✅ Featured images optimized (no CLS)
- ✅ US4 independently testable and deployable

---

## Phase 7: User Story 5 - View Integrated Feed of Videos and Posts (Priority: P3)

**Goal**: Unified timeline page displays both videos and posts chronologically (newest first)

**Independent Test**:
1. Navigate to `/feed` page
2. Verify videos and posts both appear
3. Verify sorted chronologically (all mixed by date, newest first)
4. Verify visual distinction between video and post items
5. Click items → navigate to appropriate detail page (video or post)

### Implementation for US5

#### Components

- [ ] T053 [P] [US5] Create `src/components/FeedItem.astro`:
  - Props: item (Video | Post), type ('video' | 'post')
  - Render: different layout based on type
  - Video: thumbnail, title, date (smaller card)
  - Post: featured image, title, date, author, excerpt (larger card)
  - Visual badge or styling to distinguish type

#### Pages

- [ ] T054 [US5] Create `src/pages/feed.astro` (integrated feed page):
  - Fetch videos and posts from collections
  - Merge into single array with type identifier
  - Sort by publication date (newest first) - Videos use publishedAt, Posts use pubDate
  - Render using FeedItem component for each item
  - Include heading "All Updates"

#### Styles

- [ ] T055 [P] [US5] Add feed styles to `src/styles/global.css`:
  - Feed list: timeline or alternating layout
  - Item type badge: different colors (blue for video, green for post)
  - Spacing: consistent gaps between items
  - Responsive: adapt layout for mobile

#### Testing & Validation

- [ ] T056 [US5] Test feed page locally:
  - `npm run dev` → navigate to /feed
  - Verify both videos and posts appear
  - Verify sorted chronologically (mixed together)
  - Verify video and post items visually distinct
  - Verify clicking video navigates to video detail
  - Verify clicking post navigates to post detail

- [ ] T057 [US5] Test sorting accuracy:
  - Create new post with today's date
  - Fetch new video (should have today's date from YouTube)
  - Refresh feed → both items appear at top in correct order

**Checkpoint**:
- ✅ `/feed` page displays videos and posts together
- ✅ Items sorted chronologically (all mixed)
- ✅ Visual distinction between types
- ✅ US5 independently testable

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Performance optimization, accessibility, SEO, and deployment readiness
**Duration**: ~3-4 hours

### Performance Optimization

- [ ] T058 [P] Run `npm run build` and check output:
  - Total build size < 500KB (uncompressed HTML/CSS/JS)
  - No build warnings
  - All images optimized (WebP generated)

- [ ] T059 [P] Test Core Web Vitals locally:
  - Google PageSpeed Insights: target 90+ score (mobile & desktop)
  - Lighthouse audit: run through DevTools
  - Fix any CLS (Cumulative Layout Shift) issues

- [ ] T060 [P] Optimize search performance:
  - Benchmark: measure search filter time with 100+ videos
  - Target: < 200ms on standard hardware
  - Add debounce if needed (already done in T033)

- [ ] T061 [P] Image optimization verification:
  - Verify all images use Astro Image component
  - Check WebP generation in build output
  - Verify no images missing alt text

### Accessibility (a11y)

- [ ] T062 [P] Audit accessibility:
  - WCAG 2.1 AA compliance check (DevTools Lighthouse)
  - Navigation keyboard accessible (Tab key)
  - Images have alt text (check VideoCard, PostCard, featured images)
  - Color contrast: text vs background (DevTools)
  - Focus indicators visible on all interactive elements

- [ ] T063 [P] Fix accessibility issues found:
  - Add missing alt text to any images
  - Ensure form inputs labeled
  - Improve color contrast if needed
  - Test with keyboard-only navigation

### SEO & Metadata

- [ ] T064 [P] Add page metadata:
  - Add Head component to BaseLayout or each page
  - Set meta title for each page (site name + page title)
  - Set meta description for each page (120-160 chars)
  - Set og:image, og:type, og:url for social sharing

- [ ] T065 [P] Create sitemap (optional but recommended):
  - Generate sitemap.xml for all pages
  - Add robots.txt
  - Submit to search engines (Google Search Console)

- [ ] T066 [P] Optimize page titles and descriptions:
  - Homepage: descriptive title + description
  - Videos page: "All Videos | High in the Sky" + description
  - Posts page: "Community Blog | High in the Sky" + description
  - Video detail: "{title} | High in the Sky" + description snippet

### Error Handling & Edge Cases

- [ ] T067 [P] Handle missing data gracefully:
  - No videos available: show friendly message with timeline
  - No posts available: show "No community posts yet"
  - Video with broken thumbnail: fallback placeholder
  - Post with no featured image: fallback placeholder

- [ ] T068 [P] Test error scenarios:
  - API down (no videos fetched): site still works with empty/previous data
  - Invalid video data: build fails with clear error message
  - Invalid post frontmatter: build fails with file path and error
  - Broken external URLs: graceful degradation

### Documentation

- [ ] T069 Update `quickstart.md`:
  - Verify all commands work end-to-end
  - Add troubleshooting section if issues found
  - Document how to create new posts

- [ ] T070 Create deployment guide:
  - Document GitHub Secrets setup
  - Document GitHub Actions configuration
  - Document how to verify successful deployment

### Responsive Design Final Check

- [ ] T071 [P] Test all pages on multiple screen sizes:
  - Mobile: 320px, 375px, 425px
  - Tablet: 768px
  - Desktop: 1024px, 1280px, 1920px
  - All elements visible and accessible
  - No horizontal scroll
  - Touch targets at least 48px (mobile)

### Performance Metrics Final Validation

- [ ] T072 Verify all success criteria met:
  - SC-001: Homepage < 2s load ✓
  - SC-002: Video access within 3 clicks ✓
  - SC-003: Search < 200ms ✓
  - SC-004: PageSpeed 90+ ✓
  - SC-005: Images optimized, no CLS ✓
  - SC-006: Posts render < 1.5s ✓
  - SC-007: Mobile 320px+ functional ✓
  - SC-008: Search accuracy 95%+ ✓
  - SC-009: YouTube automation within 12h ✓
  - SC-010: Content indexed by search engines ✓

### GitHub Pages Deployment

- [ ] T073 [P] Verify GitHub Pages settings:
  - Repository Settings → Pages → Source: GitHub Actions
  - Verify custom domain if applicable
  - Check DNS settings if custom domain

- [ ] T074 Push to main and verify deployment:
  - `git add .`
  - `git commit -m "feat: YouTube Video Hub MVP complete"`
  - `git push origin main`
  - Check GitHub Actions: deploy workflow should run
  - Verify site live at https://username.github.io

- [ ] T075 [P] Final deployment verification:
  - Visit deployed site
  - Verify homepage loads with carousel
  - Test search functionality
  - Test navigation to all pages
  - Verify responsive on mobile (browser dev tools)

### Documentation & Handoff

- [ ] T076 Create README.md for repository:
  - Project overview
  - Quick start instructions
  - Technology stack
  - Development workflow
  - Deployment steps
  - Contributing guidelines

- [ ] T077 Update CONTRIBUTING.md:
  - How to create new community posts
  - Post frontmatter template
  - Commit message conventions
  - How to test locally
  - Code review guidelines

**Checkpoint**:
- ✅ All performance targets met (SC-001 through SC-010)
- ✅ Accessibility verified (WCAG 2.1 AA)
- ✅ SEO metadata added
- ✅ Responsive design tested across devices
- ✅ Deployed to GitHub Pages
- ✅ Documentation complete
- ✅ **READY FOR PRODUCTION**

---

## Task Summary & Dependencies

### User Story Completion Order

1. **Phase 3 (US1)**: Must complete before US2 (carousel component reused knowledge)
2. **Phase 4 (US2)**: Can run in parallel with Phase 5-6, but benefits from US1 completion
3. **Phase 5 (US3)**: Depends on T028+ from US2 (videos page must exist)
4. **Phase 4 & 6 (US4)**: Fully independent from US1-3, can run in parallel
5. **Phase 7 (US5)**: Depends on US1 (videos), US4 (posts) being complete

### Parallelization Opportunities

**Phase 1-2 (Setup & Foundations)**: ~8 tasks marked [P], can run in parallel
- Configure Astro/Tailwind/TypeScript simultaneously
- Create GitHub Actions workflows in parallel
- All independent file modifications

**Phase 3-6 (User Stories)**: Each story mostly independent
- US1 (carousel) and US2 (video grid) can start simultaneously
- US4 (posts) completely independent from US1-3
- US5 (feed) depends on both US1 and US4

**Phase 8 (Polish)**: Many tasks marked [P]
- Performance optimization, accessibility, SEO improvements can run in parallel
- Final testing should be sequential (after previous phases)

### Critical Path

**Fastest route to MVP** (minimum 3 user stories):
1. Phase 1-2: Setup + Foundations (must complete first)
2. Phase 3: US1 - Carousel (2-3 hours)
3. Phase 4: US2 - Video browsing (2-3 hours)
4. Phase 5: US3 - Search (1-2 hours)
5. Phase 8 (partial): Core polish only (1-2 hours)

**Estimated MVP time**: 8-12 hours for one developer

### Additional Considerations

- **Videos prerequisite**: YouTube action must run at least once to populate initial videos (can use mock data for testing)
- **Testing phases**: Each user story includes validation tasks (T026+)
- **Git commits**: Recommended commit after each phase checkpoint for version control
- **Deployment**: Can happen after Phase 3 (MVP carousel) or after all phases (complete feature)

---

## Execution Tips

### For Parallel Work (if team):
1. Assign Phase 1 tasks to one developer (setup)
2. While Phase 1 runs, assign Phase 2 to another (foundations)
3. Once Phase 2 complete, split Phase 3-6 by user story (one dev per story)
4. Merge Phase 8 tasks when all stories complete

### For Solo Development:
1. Follow task order (T001 → T077)
2. Take breaks after each checkpoint (Phases 1-2, 3, 4, 5, 6, 8)
3. Deploy after Phase 5 or 8 (depends on timeline)
4. Use `npm run build` frequently to catch validation errors early

### Testing Strategy:
- After each phase: run `npm run build`
- After each user story: test manually in dev server
- Before Phase 8: comprehensive testing across devices
- Before deployment: full workflow test (homepage → search → detail pages)

---

## Total Task Count

| Phase | Count | User Stories | Status |
|-------|-------|--------------|--------|
| **Phase 1** | 10 | - | Setup |
| **Phase 2** | 9 | - | Foundations |
| **Phase 3** | 8 | US1 | P1 MVP |
| **Phase 4** | 5 | US2 | P1 MVP |
| **Phase 5** | 8 | US3 | P2 |
| **Phase 6** | 12 | US4 | P2 |
| **Phase 7** | 5 | US5 | P3 |
| **Phase 8** | 20 | Polish | Production |
| **TOTAL** | **77** | **5 stories** | Complete |

**Effort Estimate**: 17-25 hours for complete implementation

---

## Implementation Readiness

✅ **All tasks defined**  
✅ **Dependencies mapped**  
✅ **File paths specified**  
✅ **Parallelization identified**  
✅ **Testing criteria included**  
✅ **Success checkpoints defined**  

**Status**: Ready to implement. Select starting phase and execute tasks sequentially within each phase, or assign tasks to team members for parallel execution.
