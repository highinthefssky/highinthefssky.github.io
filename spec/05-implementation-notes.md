# 05 – Implementation Notes

## 1. Overview

This document describes the technical implementation details for the  
**High in the Flight Sim Sky** website.  
It defines the stack, folder structure, build behavior, and practical considerations for deploying and maintaining the site on GitHub Pages.

The goal is to keep the implementation simple, stable, and easy to update while supporting the content model and UI defined in earlier specs.

---

## 2. Tech stack

### 2.1 Hosting

- **GitHub Pages** (public repository)
- Automatic deployment from the `main` branch

### 2.2 Static site generator

- **Jekyll** (native GitHub Pages support)
- No external build pipeline required
- Supports:
  - Collections (`_videos`, `_series`)
  - Markdown content
  - Liquid templates
  - Automatic routing
  - SEO plugins (optional)

### 2.3 Styling

- Custom CSS or SCSS
- Optional utility layer (e.g., small set of spacing/typography helpers)
- No heavy frameworks required

### 2.4 JavaScript

- Minimal, client‑side only
- Used for:
  - Filtering videos
  - Search field on Videos page
  - Mobile navigation toggle

### 2.5 Images

- Stored in `/assets/`
- Optimized for web (JPG/WEBP preferred)
- Thumbnails follow naming conventions defined in the content model

---

## 3. Repository structure

Recommended folder layout:
.
├─ _config.yml
├─ _videos/
│  └─ *.md
├─ _series/
│  └─ *.md
├─ _posts/
│  └─ *.md
├─ _layouts/
│  ├─ default.html
│  ├─ home.html
│  ├─ videos.html
│  ├─ series.html
│  ├─ series-detail.html
│  ├─ post.html
│  └─ page.html
├─ _includes/
│  ├─ header.html
│  ├─ footer.html
│  ├─ video-card.html
│  ├─ series-card.html
│  └─ filters.html
├─ assets/
│  ├─ css/
│  │  └─ style.css
│  ├─ js/
│  │  └─ filters.js
│  └─ images/
├─ pages/
│  ├─ index.md
│  ├─ videos.md
│  ├─ series.md
│  ├─ blog.md
│  ├─ about.md
│  └─ contact.md
└─ README.md


---

## 4. Jekyll configuration

### 4.1 `_config.yml` essentials

```yaml
title: "High in the Flight Sim Sky"
description: "Microsoft Flight Simulator 2020/2024 videos, tutorials, and adventures."
baseurl: ""
url: "https://highintheflightsimsky.nl"

collections:
  videos:
    output: true
    permalink: /videos/:slug/
  series:
    output: true
    permalink: /series/:slug/

markdown: kramdown
theme: minima

plugins:
  - jekyll-sitemap
  - jekyll-seo-tag

### 4.2 Collections
- _videos and _series are treated as first‑class content types
- Each item generates its own page (optional)
- Series detail pages aggregate videos automatically

---
## 5. Templates
### 5.1 Layouts
- default.html  
Base layout with header, footer, and content block.

- home.html  
Hero, latest videos, featured series.

- videos.html  
Filter bar + video grid.

- series.html  
Grid of all series.

- series-detail.html  
Series hero + episode list.

- post.html  
Blog post layout.

- page.html  
Generic static page layout (About, Contact).

### 5.2 Includes
Reusable components:

- header.html
- footer.html
- video-card.html
- series-card.html
- filters.html

---

## 6. Filtering logic (client‑side)
### 6.1 Data attributes
Each video card includes:

<div class="video-card"
     data-series="forbidden-skies"
     data-msfs="2024"
     data-tags="area-51,ifr">

### 6.2 JavaScript behavior
- Dropdowns filter by data-series and data-msfs
- Search field filters by title and description
- Filtering is instant and does not reload the page

---
## 7 Performance considerations
- Use compressed images (JPG/WEBP)
- Avoid large JS bundles
- Keep CSS modular and small
- Leverage GitHub Pages caching
- Use lazy loading for thumbnails:
<img src="..." loading="lazy">

---
## 8. SEO considerations
- Use jekyll-seo-tag plugin
- Add OpenGraph metadata for videos and series
- Generate sitemap automatically
- Clean URLs with trailing slashes
- Descriptive titles and meta descriptions

---

## 9 Deployment workflow
### 9.1 Automatic deployment
Push to main → GitHub Pages rebuilds the site automatically

### 9.2 Local development (optional)
If you want to preview locally:
bundle install
bundle exec jekyll serve

(Not required — GitHub Pages can build everything.)

---

## 10. Content workflow
### 10.1 Adding a new video
1. Create a new file in _videos/  
Example: _videos/forbidden-skies-area-51.md

2. Add YAML front matter
3. Add optional description
4. Commit and push

### 10.2 Adding a new series
1. Create a file in _series/
2. Add metadata
3. Add cover image
4. Push

### 10.3 Adding a blog post
1. Create a file in _posts/YYYY-MM-DD-title.md
2. Write markdown content
3. Push

---

## 11. Future enhancements (v1.1+)
- Dark mode toggle
- Automated YouTube sync (GitHub Action)
- Dedicated Resources section
- Aircraft‑based filtering
- Tag pages for videos and blog posts

---

## 12. Open questions
- Should video pages themselves be visible, or should all video links go directly to YouTube?
- Should series pages support custom episode ordering?
- Should we add a global search bar in v1 or v1.1?