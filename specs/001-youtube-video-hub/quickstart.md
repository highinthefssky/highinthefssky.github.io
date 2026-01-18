# Quickstart: YouTube Video Hub Development

**Feature**: YouTube Video Hub with Community Posts  
**Created**: 2026-01-18  
**Status**: Ready to Implement  
**Time to First Run**: ~15 minutes

## Project Setup (5 minutes)

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git initialized (done)
- GitHub account with repository created

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file for YouTube API
cp .env.example .env.local

# 3. Add YouTube API key to .env.local
# YOUTUBE_API_KEY=your_youtube_api_key_here
# YOUTUBE_CHANNEL_ID=your_channel_id_here
```

### Verify Installation

```bash
# Build the project
npm run build

# Should output:
# ✓ Completed in XXms
```

## Development Workflow (10 minutes)

### Local Development Server

```bash
# Start dev server with hot reload
npm run dev

# Output:
# Local: http://localhost:3000/
# Ctrl+C to stop
```

Visit `http://localhost:3000/` in your browser. You should see:
- Homepage with carousel (if videos exist)
- Navigation to Videos, Posts, and Feed pages
- All pages styled with Tailwind CSS

### Create Your First Post

```bash
# 1. Create a new post file
touch src/content/posts/hello-world.md

# 2. Add frontmatter and content
cat > src/content/posts/hello-world.md << 'EOF'
---
title: Hello World
pubDate: 2026-01-18
author: Your Name
description: Your first community post
image:
  url: /placeholder.jpg
  alt: Placeholder image
tags:
  - introduction
---

# Welcome to the Blog

This is your first post. Write in **Markdown**!
EOF

# 3. Save and check dev server
# Changes auto-reload in browser
```

### Fetch YouTube Videos (First Time Setup)

```bash
# Option 1: Run the fetch script locally
node scripts/fetch-videos.js

# Option 2: Trigger GitHub Action
git push  # Commit your changes
# GitHub Action runs on push (or on cron schedule)

# Videos appear in src/content/videos/ as JSON files
ls src/content/videos/
# Example output:
# dQw4w9WgXcQ.json
# jNQXAC9IVRw.json
```

## Directory Structure (Reference)

```
.
├── src/
│   ├── content/
│   │   ├── config.ts           # Zod schemas
│   │   ├── videos/             # Auto-generated (JSON)
│   │   └── posts/              # Manual (Markdown)
│   ├── components/
│   │   ├── VideoCard.astro
│   │   ├── PostCard.astro
│   │   ├── Carousel.astro
│   │   └── SearchBar.astro
│   ├── pages/
│   │   ├── index.astro         # Homepage
│   │   ├── videos.astro        # All videos
│   │   ├── posts.astro         # All posts
│   │   ├── feed.astro          # Combined feed
│   │   └── [dynamic pages]
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── styles/
│   │   └── global.css
│   └── utils/
│       └── searchVideos.ts
├── scripts/
│   └── fetch-videos.js         # YouTube API polling
├── .github/workflows/
│   ├── fetch-videos.yml        # Cron job
│   └── deploy.yml              # GitHub Pages
├── public/
│   └── [static files]
├── astro.config.mjs
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .env.local                   # (not committed, local only)
```

## Common Tasks

### Add a New Community Post

```bash
# Create new markdown file with today's date
touch src/content/posts/my-new-topic.md

# Edit the file with your frontmatter and content
cat > src/content/posts/my-new-topic.md << 'EOF'
---
title: My New Topic
pubDate: 2026-01-18
author: Your Name
description: A brief description of the post
image:
  url: /images/my-image.jpg
  alt: Descriptive alt text
tags:
  - topic1
  - topic2
---

## Main Content

Your markdown content here...
EOF

# Commit and push
git add src/content/posts/my-new-topic.md
git commit -m "Add: My new topic post"
git push
```

### Configure YouTube Channel

```bash
# 1. Get your YouTube Channel ID:
#    - Go to youtube.com/@your-channel
#    - Open browser dev tools → Console
#    - Paste: document.querySelector('meta[itemprop="identifier"]')?.content
#    - Copy the ID

# 2. Create YouTube API key:
#    - Go to Google Cloud Console
#    - Create new project
#    - Enable YouTube Data API v3
#    - Create API key (restrictions: HTTP referrers)

# 3. Add to .env.local
#    YOUTUBE_API_KEY=your_key_here
#    YOUTUBE_CHANNEL_ID=your_channel_here

# 4. Test the setup
node scripts/fetch-videos.js
```

### Search/Filter Videos

Videos are searchable on the `/videos` page using client-side filtering. Users type keywords and see filtered results instantly (< 200ms).

**How it works**:
1. All video data loaded with page (Astro static)
2. JavaScript filters on keystroke
3. DOM updates in real-time
4. No server calls, no performance penalty

### Customize Styling

Styling uses Tailwind CSS. All components are in `src/components/`.

```astro
---
// src/components/VideoCard.astro
---

<article class="rounded-lg shadow-md hover:shadow-lg transition-shadow">
  <img class="w-full h-auto object-cover" src={video.thumbnail} alt={video.title} />
  <div class="p-4">
    <h3 class="font-bold text-lg">{video.title}</h3>
    <p class="text-gray-600">{video.description}</p>
  </div>
</article>
```

Modify Tailwind config in `tailwind.config.js`:
```javascript
export default {
  theme: {
    extend: {
      colors: {
        primary: '#your-color',
      },
    },
  },
};
```

## Build & Deploy

### Local Build

```bash
# Builds to dist/ directory
npm run build

# Preview built site locally
npm run preview
# Visit http://localhost:3000/
```

### Deploy to GitHub Pages

```bash
# 1. Ensure all changes committed
git add .
git commit -m "Your commit message"

# 2. Push to main branch
git push origin main

# 3. GitHub Actions automatically:
#    a. Runs fetch-videos job (if scheduled/triggered)
#    b. Builds Astro site
#    c. Deploys to GitHub Pages
#    d. Site live at https://username.github.io
```

Check deployment status:
- Go to repository → Actions tab
- See workflow run history
- View logs for debugging

### Troubleshooting Builds

```bash
# Check for errors locally first
npm run build

# Common issues:
# 1. Validation error in video/post
#    → Check schema in data-model.md
#    → Fix file and retry

# 2. YouTube API key missing
#    → Add YOUTUBE_API_KEY to .env.local

# 3. Astro version mismatch
#    → npm install
#    → npm run build
```

## Environment Variables

Create `.env.local` (not committed to git):

```env
# YouTube API v3 Configuration
YOUTUBE_API_KEY=your_youtube_api_key_here
YOUTUBE_CHANNEL_ID=your_channel_id_here

# GitHub Actions will use secrets instead
# (Set in repository Settings → Secrets)
```

GitHub Actions use secrets instead:
```bash
# In .github/workflows/fetch-videos.yml
env:
  YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
  YOUTUBE_CHANNEL_ID: ${{ secrets.YOUTUBE_CHANNEL_ID }}
```

## Testing

### Manual Testing Checklist

- [ ] Homepage loads with carousel (or message if < 3 videos)
- [ ] Videos page shows all videos sorted by date
- [ ] Search filters videos in real-time (< 200ms)
- [ ] Posts page shows all posts
- [ ] Individual video detail pages load with embedded player
- [ ] Individual post pages load with correct formatting
- [ ] Navigation links work between pages
- [ ] Mobile responsive (test on small screens)
- [ ] Images load without layout shift

### Build Validation

```bash
# Validate no build errors
npm run build
# ✓ should complete without errors

# Validate types (if TypeScript)
npm run type-check
# ✓ should pass

# Check for accessibility issues (optional)
npm run a11y
# ✓ should pass most tests
```

## Performance Benchmarks (Targets)

When running `npm run build` and deployed:

| Metric | Target | How to Check |
|--------|--------|------------|
| Homepage load | < 2s | DevTools → Network tab |
| Search response | < 200ms | Type in search, see time in console |
| PageSpeed score | 90+ | Google PageSpeed Insights |
| Image CLS | 0 | Lighthouse → Core Web Vitals |

Check locally:
```bash
# Start dev server
npm run dev

# Open Chrome DevTools
# Lighthouse tab → Analyze page load
# Target: 90+ score
```

## Useful Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build
npm run check            # Astro check (errors, types)

# Utilities
npm run type-check       # TypeScript validation
npm run format           # Format code (if configured)
npm run lint             # Lint code (if configured)

# Cleanup
npm run clean            # Remove build artifacts
npm install --frozen-lockfile  # Install exact deps
```

## Next Steps

### Phase 1 Implementation
1. Set up project structure (done by templates)
2. Configure Astro Content Collections
3. Build homepage with carousel
4. Build videos page with search
5. Build posts page

### Phase 2 Features
1. Detail pages (video, post)
2. Integrated feed page
3. Tag-based filtering
4. Related content suggestions

### Phase 3 Enhancements
1. RSS feed generation
2. Social media sharing
3. Analytics tracking
4. Newsletter subscription

## Support & Debugging

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `VideoSchema validation failed` | Video JSON malformed | Check JSON syntax, validate against schema |
| `PostSchema validation failed` | Post frontmatter invalid | Check YAML syntax, all required fields |
| `YouTube API 403` | API key invalid or quotaexceeded | Check API key, verify quota |
| `Page build failed` | Syntax error in component | Run `npm run build`, check error line |
| `Images not loading` | URL invalid or CORS issue | Check image URL is HTTPS |

### Enable Debug Mode

```bash
# See detailed logs during build
DEBUG=* npm run build

# See Astro-specific debug info
DEBUG=astro npm run build
```

### Check Latest Status

```bash
# View current Astro version
npm info astro version

# Update Astro and dependencies
npm update

# Check for security issues
npm audit
```

## Resources

- **Astro Docs**: https://docs.astro.build
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zod Validation**: https://zod.dev
- **YouTube Data API**: https://developers.google.com/youtube/v3
- **GitHub Pages**: https://pages.github.com

---

**Ready to build?** Start with `npm install` and `npm run dev`. Happy coding!
