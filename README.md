# High in the Sky - YouTube Video & Community Hub

A beautiful, performant static site built with Astro for showcasing YouTube videos and community posts. Features a carousel, full-text search, RSS feed, and responsive design.

## 🌟 Features

- **Video Showcase**: Display YouTube videos with automatic thumbnail and metadata fetching
- **Featured Carousel**: Eye-catching carousel of featured videos on the homepage
- **🔴 Live Stream Detection**: Automatic "LIVE NOW" banner when streaming on YouTube
- **Community Posts**: Markdown-based blog for community updates and discussions
- **Full-Text Search**: Fast client-side search across video titles and descriptions
- **Tag Filtering**: Filter content by tags for better discoverability
- **RSS Feed**: Subscribe to latest videos and posts via RSS
- **Activity Feed**: Timeline view of latest videos and posts
- **Responsive Design**: Mobile-first, works beautifully on all devices
- **Dark Mode Ready**: Tailwind CSS configuration ready for theme customization
- **Fast & Static**: Built on Astro for sub-2s load times
- **GitHub Pages Ready**: Automatic deployment via GitHub Actions

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
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
```

See [workers/live-status/README.md](workers/live-status/README.md) for Cloudflare Worker setup instructions.

### Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

Visit `http://localhost:3000` to see your site.

## 📁 Project Structure

```
.
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Navigation.astro
│   │   ├── Carousel.astro
│   │   ├── VideoCard.astro
│   │   └── PostCard.astro
│   ├── content/              # Content collections
│   │   ├── config.ts         # Content schemas
│   │   ├── videos/           # Video data (JSON)
│   │   └── posts/            # Community posts (Markdown)
│   ├── layouts/
│   │   └── BaseLayout.astro  # Main layout wrapper
│   ├── pages/                # Route pages (auto-generated)
│   │   ├── index.astro       # Homepage
│   │   ├── videos.astro      # Videos page
│   │   ├── search.astro      # Search page
│   │   ├── posts.astro       # Community posts list
│   │   ├── posts/[slug].astro # Individual post page
│   │   ├── feed.astro        # Activity feed
│   │   └── feed.xml.ts       # RSS feed endpoint
│   ├── styles/
│   │   └── global.css        # Global Tailwind styles
│   └── utils/
│       └── searchVideos.ts   # Search utilities
├── scripts/
│   └── fetch-videos.js       # YouTube API integration
├── .github/
│   └── workflows/
│       ├── deploy.yml        # GitHub Pages deployment
│       └── fetch-videos.yml  # Daily video sync
├── astro.config.mjs          # Astro configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── package.json
```

## 📝 Adding Content

### Videos

Videos are automatically fetched from YouTube via GitHub Actions daily. To add a video manually:

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

For automated video fetching, set secrets in repository settings:

- `YOUTUBE_API_KEY`: Your YouTube API key
- `YOUTUBE_CHANNEL_ID`: Your channel ID

### Tailwind CSS

Customize colors and theme in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: 'hsl(213, 94%, 47%)',
      secondary: '#764ba2',
    },
  },
}
```

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

Edit `tailwind.config.js` and `src/styles/global.css` for custom color schemes.

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

- Clear `node_modules/` and `dist/`: `rm -rf node_modules dist && npm install`
- Check Node.js version: `node --version` (should be 18+)

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
- [Tailwind CSS](https://tailwindcss.com/) - Utility CSS framework
- [YouTube Data API](https://developers.google.com/youtube/v3) - Video data
- [GitHub Pages](https://pages.github.com/) - Free hosting

---

Made with ❤️ for content creators
