# Contributing Guide

Thank you for your interest in contributing to this project! This guide explains how to add content (videos and community posts) to the website.

## Table of Contents

- [Adding Videos](#adding-videos)
- [Adding Community Posts](#adding-community-posts)
- [Development Setup](#development-setup)
- [Testing Your Changes](#testing-your-changes)

## Adding Videos

Videos are automatically fetched from YouTube via the GitHub Actions workflow. However, you can manually add videos by creating JSON files in `src/content/videos/`.

### Manual Video Entry

Create a file `src/content/videos/video-id.json`:

```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "description": "Video description",
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  "publishedAt": "2024-01-15T10:00:00Z",
  "duration": 180,
  "tags": ["tutorial", "javascript"],
  "featured": false
}
```

### Field Guide

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `videoId` | string | Yes | YouTube video ID |
| `title` | string | Yes | Video title |
| `description` | string | Yes | Video description |
| `thumbnail` | string (URL) | Yes | Thumbnail image URL |
| `publishedAt` | date (ISO 8601) | Yes | Publication date |
| `duration` | number | Yes | Duration in seconds |
| `tags` | array of strings | Yes | Content tags/categories |
| `featured` | boolean | No | Mark as featured on homepage (default: false) |

## Adding Community Posts

Community posts are Markdown files stored in `src/content/posts/`.

### Create a New Post

Create a file `src/content/posts/post-title.md`:

```markdown
---
title: "Post Title"
description: "Short description for the post"
publishedAt: 2024-01-15
tags: ["announcement", "update"]
draft: false
---

# Post Content

Write your post content here using Markdown. You can use:

- Bullet lists
- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Code blocks
- And more!
```

### Field Guide

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Post title |
| `description` | string | Yes | Short summary |
| `publishedAt` | date (YYYY-MM-DD) | Yes | Publication date |
| `tags` | array of strings | Yes | Content tags/categories |
| `draft` | boolean | No | Mark as draft (default: false) |

### Markdown Support

Posts support full Markdown syntax including:

- Headings (#, ##, ###, etc.)
- Lists (ordered and unordered)
- Code blocks with language highlighting
- Blockquotes
- Images
- Links
- Tables

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or similar package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/highinthefssky.github.io.git
cd highinthefssky.github.io

# Install dependencies
npm install

# Copy environment template
cp .env.local.example .env.local

# Add your YouTube API credentials to .env.local
```

### Running Locally

```bash
# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing Your Changes

### Building

Always build before submitting a pull request:

```bash
npm run build
```

This ensures your changes don't break the build.

### Validating Content

Check that your video/post files are valid JSON/Markdown:

- Video JSON files should be valid JSON
- Post Markdown files should have valid frontmatter
- All required fields should be present
- URLs should be properly formatted

### Live Preview

```bash
npm run dev
```

Then visit `http://localhost:3000` to see your changes with hot reload.

## Best Practices

### For Videos

- Use descriptive titles and descriptions
- Include relevant tags for discoverability
- Set `featured: true` for important videos only
- Keep thumbnails up-to-date
- Use the official YouTube thumbnail when possible

### For Posts

- Write clear, concise titles
- Include a helpful description (used in previews)
- Use appropriate tags for categorization
- Format with proper Markdown syntax
- Proofread before submitting
- Use `draft: true` while working on posts

## File Naming

- **Videos**: Use the YouTube video ID as filename: `dQw4w9WgXcQ.json`
- **Posts**: Use lowercase with hyphens: `my-first-post.md`

## Questions?

If you have questions about contributing, please open an issue on GitHub.

Happy contributing! 🎉
