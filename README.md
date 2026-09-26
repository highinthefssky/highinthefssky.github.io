# High in the Sky - YouTube Video & Community Hub

A beautiful, performant static site built with Astro for showcasing YouTube videos, controller configurations, and community posts. Features a carousel, full-text search, RSS feed, and responsive design.

## 🌟 Features

- **Video Showcase**: Display YouTube videos with automatic thumbnail and metadata fetching
- **Featured Carousel**: Eye-catching carousel of featured videos on the homepage
- **🔴 Live Stream Detection**: Automatic "LIVE NOW" banner when streaming on YouTube
- **🎮 Controller Configs**: Downloadable MSFS 2024 controller configuration files
- **🎙️ SimVoice Packs**: Downloadable SimVoice Copilot Community Packs with import guidance
- **Community Posts**: Markdown-based blog for community updates and discussions
- **Full-Text Search**: Fast client-side search across video titles and descriptions
- **Tag Filtering**: Filter content by tags for better discoverability
- **RSS Feed**: Subscribe to latest videos and posts via RSS
- **Activity Feed**: Timeline view of latest videos and posts
- **Responsive Design**: Mobile-first, works beautifully on all devices
- **Dark Mode Ready**: Tailwind CSS v4 styles with CSS-variable driven theming
- **Fast & Static**: Built on Astro for sub-2s load times
- **GitHub Pages Ready**: Automatic deployment via GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- GitHub repository

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/highinthefssky.github.io.git
cd highinthefssky.github.io

# Install dependencies
npm install

# Create environment variables
cp .env.local.example .env.local
```

### Configuration

Add your YouTube credentials to `.env.local`:

```env
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_channel_id

# For live stream detection (via Cloudflare Worker)
PUBLIC_LIVE_STATUS_URL=https://highinthesky-live-status.your-subdomain.workers.dev

# Optional: hosted contact form (Google Forms example)
PUBLIC_CONTACT_FORM_EMBED_URL=https://docs.google.com/forms/d/e/your-form-id/viewform?embedded=true
PUBLIC_CONTACT_FORM_PUBLIC_URL=https://docs.google.com/forms/d/e/your-form-id/viewform
```

See [workers/live-status/README.md](workers/live-status/README.md) for Cloudflare Worker setup instructions.

### Development

```bash
# Start dev server with hot reload
npm run dev

# Fetch content from external sources
npm run fetch-videos        # Fetch YouTube videos
npm run fetch-controllers   # Fetch controller configs
npm run fetch-all           # Fetch everything

# Build for production
npm run build

# Preview production build locally
npm run preview
```

Visit `http://localhost:3000` to see your site.

### Video Archive and Search

The archive renders nine videos per static page, with ordinary pagination links
that work without JavaScript. The shared page size in
[src/utils/videoPagination.ts](src/utils/videoPagination.ts) also controls sitemap pagination.

Search loads a build-generated MiniSearch index on first use and queries it in a
Web Worker. It searches complete descriptions, titles, and tags. `title:`,
`description:`, and `tags:` restrict the searched field; multiple words use AND
matching with word-prefix support. Selected tag filters use exact,
case-insensitive OR matching. Results remain newest-first and are rendered in
pages of at most 24 cards. Search and selected tags are retained in the URL hash;
legacy `?tag=` links remain supported.

The tag list loads separately when expanded and displays at most 60 matching
tags. Search failures leave static browsing available and offer a retry.
No external search service or search analytics is used.

Run a fresh `npm run build` before
`npx playwright test tests/e2e/video-search.spec.ts`. These tests verify static
archive coverage, description-only matches, lazy loading, favorites, retry,
mobile reflow, and HTML/index size budgets.

### Controller Matching and Downloads

The wizard ranks the full video collection at build time. Each controller,
aircraft, and goal combination has a compact static JSON response, fetched only
when requested. Ranking rules live in
[src/lib/controllerMatches.ts](src/lib/controllerMatches.ts); XML results are
restricted to the selected controller group. Controller groups can include
multiple models, so users must still check the filename and aircraft details.

Controller cards, wizard results, and Moza listings lead to profile-specific
download pages. The download button fetches the original file and uses a local
Blob URL to preserve its filename. Failed requests offer retry and an original-file
link; import guidance and source links also work without JavaScript.

Moza presets are imported into Moza Cockpit, separately from MSFS XML bindings.
XML download pages follow the [official Microsoft Flight Simulator Support guide](https://flightsimulator.zendesk.com/hc/en-us/articles/21862909046428-How-to-Export-and-Import-your-controller-profiles):
open Settings > Controls, select the original controller and matching profile
category, then use the profile cogwheel to Export a backup or Import the file.
Backups should be saved outside the simulator installation directory. General,
Airplane, and Helicopter Controls profiles are not interchangeable.

After `npm run build`, run
`npx playwright test tests/e2e/controller-journey.spec.ts` for ranking, payload,
retry/cancellation, download filename/byte preservation, and mobile fallback checks.

### SimVoice Copilot Community Packs

Pack metadata lives in `src/content/simvoice-packs/`, while downloadable
`.svcpack` files belong in `public/downloads/simvoice-community-packs/`. Each
metadata entry supplies the filename, compatibility details, included content,
and local download path shown on `/simvoice-packs/`.

Keep the file version in the metadata and filename synchronized. The page follows
the [official Community Packs import workflow](https://simvoicecopilot.com/help/manual/en#community-packs):
open Community Packs in SimVoice Copilot, choose Import, select the `.svcpack`,
review compatible content and conflicts, and select Import Pack.

### Privacy-Focused Analytics

Plausible integration is **disabled by default**. No account has been created
and enabling it requires a new build. It runs only on
`https://highintheflightsimsky.nl`, never localhost or preview domains.

Activation steps:

1. Add `highintheflightsimsky.nl` as a site in your hosted Plausible account, with a plan supporting custom events.
2. Review the provider's [data policy](https://plausible.io/data-policy), [DPA](https://plausible.io/dpa), and your applicable privacy/consent obligations before activation. Provider claims are not a blanket legal determination for this website.
3. Create custom event goals with these exact names: `Wizard Results`, `XML Download Started`, `Preset Download Started`, `Community Pack Download Started`, and `YouTube Click`.
4. Analytics is explicitly pinned off in [.github/workflows/deploy.yml](.github/workflows/deploy.yml). After approval to activate it, replace that build step's `PUBLIC_ANALYTICS_ENABLED: 'false'` with `PUBLIC_ANALYTICS_ENABLED: ${{ vars.PUBLIC_ANALYTICS_ENABLED }}` and set the matching repository Actions variable to `true`. Deploy through the normal reviewed release process. No API key or analytics secret is needed. Keep the workflow value `false` to leave it off; after activation, unset the repository variable or set it to `false` and rebuild/deploy to disable collection.
5. Verify events in the Plausible dashboard on the production site. An HTTP 202 response alone is not proof of ingestion; Plausible may silently drop filtered events. Do not install a second tracking snippet.

The small first-party client uses the documented [Events API](https://plausible.io/docs/events-api)
instead of the default script so URLs can be strictly minimized. It sends only
fixed event names, the registered domain, and allowlisted page categories.
Detail pages are grouped (for example `/videos/detail/`), pagination is grouped,
and favorites, search redirects, and unknown routes are excluded. Query strings,
hashes, campaign parameters, referrers, video metadata, filenames, form contents,
and local favorites/progress are never included. This intentionally sacrifices
campaign attribution and per-video reports. Only direct YouTube links are counted;
shortened links and embedded player interactions are not measured.

Requests omit cookies and referrer headers. Plausible still receives IP and
User-Agent data and uses them for device/location statistics and daily
site-specific identifiers, as disclosed on the privacy page. No persistent
analytics identifier is created. Do Not Track, Global Privacy Control, and the
privacy-page opt-out suppress events. The opt-out stores only
`analytics-opt-out=true` locally; clearing browser storage removes that preference.
If storage cannot be read, analytics fails closed. Blocked requests do not affect
browsing or downloads and are not retried or proxied around blockers.

Start with a 2-4 week baseline of page categories, displayed wizard results,
download starts, and outbound YouTube clicks. A download start does not prove a
file was saved or imported, and a YouTube click does not prove a video was watched.
Use these counts to prioritize subsequent usability work, not as proof of growth.

After `npm run build`, run `npx playwright test tests/e2e/analytics.spec.ts`.
Enabled-path tests mock the production origin and intercept all provider traffic;
CI builds remain unconfigured and no test events are sent to Plausible.

## 📁 Project Structure

```text
.
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Navigation.astro
│   │   ├── Carousel.astro
│   │   ├── VideoCard.astro
│   │   ├── ConfigCard.astro
│   │   └── PostCard.astro
│   ├── content/              # Content collections
│   │   ├── videos/           # Video data (JSON)
│   │   ├── controllers/      # Controller configs (JSON)
│   │   └── posts/            # Community posts (Markdown)
│   ├── layouts/
│   │   └── BaseLayout.astro  # Main layout wrapper
│   ├── pages/                # Route pages (auto-generated)
│   │   ├── index.astro       # Homepage
│   │   ├── videos.astro      # Videos page
│   │   ├── controllers.astro # Controller configs page
│   │   ├── search.astro      # Search page
│   │   ├── posts.astro       # Community posts list
│   │   ├── posts/[slug].astro # Individual post page
│   │   ├── feed.astro        # Activity feed
│   │   └── feed.xml.ts       # RSS feed endpoint
│   ├── styles/
│   │   └── global.css        # Global styles + Tailwind v4 import
│   └── utils/
│       └── searchVideos.ts   # Search utilities
├── scripts/
│   ├── fetch-videos.js       # YouTube API integration
│   └── fetch-controllers.js  # GitHub controller config sync
├── .github/
│   └── workflows/
│       ├── deploy.yml        # GitHub Pages deployment
│       └── fetch-videos.yml  # Daily video sync
├── src/content.config.ts     # Astro 6 content collection definitions
├── astro.config.mjs          # Astro configuration
└── package.json
```

## 📝 Adding Content

### Videos

Videos are automatically fetched from YouTube via GitHub Actions daily. To manually fetch videos:

```bash
npm run fetch-videos
```

To add a video manually:

```json
// src/content/videos/videoId.json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "description": "Video description",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  "publishedAt": "2024-01-15",
  "duration": 180,
  "tags": ["tutorial", "javascript"],
  "featured": true
}
```

### Controller Configurations

Controller configs are **automatically synced weekly** from the [msfs-2024-controls-settings](https://github.com/highinthefssky/msfs-2024-controls-settings) repository via GitHub Actions.

#### Manual Sync

To fetch the latest configs manually:

```bash
npm run fetch-controllers
```

The script automatically:
- Fetches XML files from the GitHub repository
- Parses filenames to extract controller, aircraft, and settings type
- Generates searchable tags
- Creates JSON metadata files in `src/content/controllers/`

#### Automated Sync

The GitHub Actions workflow (`.github/workflows/fetch-controllers.yml`):
- Runs every Monday at 00:00 UTC
- Can be triggered manually from Actions tab
- Auto-commits and deploys when configs change
- Supports webhook triggers from the source repository

Controller config files are downloaded directly from GitHub when users click the download button.

### Community Posts

Create Markdown files in `src/content/posts/`:

```markdown
---
title: "Post Title"
description: "Short summary"
publishedAt: 2024-01-15
tags: ["announcement", "update"]
draft: false
---

# Post content using Markdown...
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 🔧 Configuration

### YouTube API

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create an API key
4. Add to `.env.local` as `YOUTUBE_API_KEY`

### GitHub Secrets

For automated content fetching, set secrets in repository settings:

**Required for Videos:**
- `YOUTUBE_API_KEY`: Your YouTube API key
- `YOUTUBE_CHANNEL_ID`: Your channel ID
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Google Cloud workload identity provider (for OIDC)
- `GCP_SERVICE_ACCOUNT`: Google Cloud service account email

**Controllers (No Secrets Required):**
- Controller configs fetch from public GitHub API
- No authentication needed
- Optional: Add webhook for instant updates when msfs-2024-controls-settings changes

### Tailwind CSS (v4 + Vite Plugin)

This project uses Tailwind CSS v4 through the Vite plugin (`@tailwindcss/vite`) configured in `astro.config.mjs`.

Tailwind is enabled from `src/styles/global.css` using:

```css
@import "tailwindcss";
```

Theme and color customization is primarily done through CSS variables in `src/styles/global.css`.

## 📊 Performance

- **PageSpeed Insights**: 90+ score
- **Homepage Load Time**: < 2s
- **Search Response**: < 200ms
- **Build Time**: < 2s
- **Static Output**: No server required

## 🌐 Deployment

### GitHub Pages

Push to `main` branch to automatically deploy:

1. GitHub Actions runs tests
2. Builds static site
3. Deploys to GitHub Pages
4. Accessible at `yourusername.github.io`

### Custom Domain

1. Add `CNAME` file to repo root with your domain
2. Configure DNS to point to GitHub Pages
3. Enable HTTPS in repository settings

## 🎨 Customization

### Colors

Edit CSS variables in `src/styles/global.css` for custom color schemes.

### Fonts

Update `@import` statements in `src/styles/global.css` for different fonts.

### Layout

Modify components in `src/components/` to change page layouts.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding videos and posts.

## 📜 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🆘 Troubleshooting

### Build Fails

- Clear `node_modules/` and `dist/`, then reinstall dependencies.
- Check Node.js version: `node --version` (should be 20+)

### Videos Not Showing

- Verify YouTube API key in `.env.local`
- Check Channel ID is correct
- Run `node scripts/fetch-videos.js` to manually test API

### Search Not Working

- Check browser console for errors
- Clear browser cache
- Verify videos have `tags` property

## 📞 Support

For issues or questions:
- Check [CONTRIBUTING.md](CONTRIBUTING.md)
- Open a GitHub issue
- Review quickstart documentation for detailed setup

## 🙏 Acknowledgments

Built with:

- [Astro](https://astro.build/) - Static site generator
- [Tailwind CSS](https://tailwindcss.com/) - Utility CSS framework (v4 via Vite plugin)
- [YouTube Data API](https://developers.google.com/youtube/v3) - Video data
- [GitHub Pages](https://pages.github.com/) - Free hosting

---

Made with ❤️ for content creators
