# 03 – Content Model

## 1. Overview

This document defines the structured content types used by the  
**High in the Flight Sim Sky** website.

All content is stored as Markdown with YAML front matter to ensure:

- Easy editing directly in GitHub  
- Predictable templates  
- Consistent metadata  
- Fast rendering on GitHub Pages (Jekyll‑compatible)

The three core content types are:

1. **Videos**  
2. **Series**  
3. **Blog posts**

Additional types can be added later without breaking the structure.

---

## 2. Content type: Video

### 2.1 Purpose

Represents a single YouTube video published on the channel.  
Used for:

- Video grids  
- Series episode lists  
- Filtering and search  
- SEO metadata

### 2.2 Storage location

`_videos/{slug}.md`

### 2.3 Required front matter

```yaml
---
title: "Forbidden Skies – Area 51"
youtube_id: "ABC123XYZ"
series: "forbidden-skies"
msfs_version: "2024"
date: 2025-01-10
thumbnail: "/assets/thumbnails/forbidden-skies-area-51.jpg"
---

### 2.4 Optional fields

```yaml
---
duration: "24:13" 
tags: - "Area 51" - "Forbidden Skies" - "IFR" 
aircraft: "F/A-18 Super Hornet" 
location: "Nevada, USA" 
description: "Short description of the episode."
---

### 2.5 Body content
Markdown description (optional).
If omitted, templates fall back to the description field.

---
## 3. Content type: Series

### 3.1 Purpose
Defines a collection of related videos (e.g., Forbidden Skies, A–Z, Tutorials).
Used for:

- Series index page
- Series detail pages
- Filtering videos by series

### 3.2 Storage location
_series/{slug}.md

### 3.3 Required front matter
```yaml
---
title: "Forbidden Skies" 
slug: "forbidden-skies" 
description: "Exploring restricted, dangerous, or forbidden airspaces in MSFS." 
cover_image: "/assets/series/forbidden-skies-cover.jpg" 
order: 1
---

### 3.4 Optional fields
```yaml
---
playlist_url: "https://www.youtube.com/playlist?list=XXXX"
featured: true
long_description: |
  A longer explanation of the series, its goals, and what viewers can expect.
---

### 3.5 Relationship to videos
Videos reference a series via:
```yaml
series: "forbidden-skies"
The series page automatically lists all matching videos.

---

## 4. Content type: Blog post

### 4.1 Purpose
Used for updates, MSFS news, behind‑the‑scenes posts, guides, and announcements.

### 4.2 Storage location
_posts/YYYY-MM-DD-slug.md

### 4.3 Required front matter
```yaml
---
title: "MSFS 2024 – First Impressions" 
date: 2025-01-05
---

### 4.4 Optional fields
```yaml
---
tags: - "MSFS 2024" - "Review" 
thumbnail: "/assets/blog/msfs-2024-first-impressions.jpg" 
summary: "A quick overview of my first hours in MSFS 2024."
---

### 4.5 Body content
Markdown content for the full article.

---
## 5 Global metadata fields
These fields may appear across multiple content types:


---
## 6 Relationshipss

### 6.1 Series → Videos
A series can have many videos.
Videos reference their series via the series field.

### 6.2 Blog posts → Tags
Tags allow grouping posts by topic.

### 6.3 Videos → Tags
Tags allow filtering on the Videos page.

| Field | Type | Purpose |
| :--- | :--- | :--- |
| `title` | string | Display title |
| `slug` | string | URL-friendly identifier |
| `date` | date | Sorting, SEO |
| `tags` | list | Filtering, grouping |
| `thumbnail` | string | Image path |
| `description` | string | Short summary |
| `msfs_version` | string | 2020/2024 filtering |
| `aircraft` | string | Optional metadata |
| `location` | string | Optional metadata |

---

## 7. Naming conventions
- Filenames use lowercase and hyphens: forbidden-skies-area-51.md
- Slugs match filenames unless overridden.
- Image filenames follow the same pattern.

---

## 8. Scalability considerations
The content model supports:

- Hundreds of videos
- Dozens of series
- Multiple MSFS versions
- Future content types (e.g., resources, downloads)
- Automatic generation of indexes and filtered views
- No structural changes are needed as the site grows.

---

### 9. Open questions
Should aircraft become a first‑class filter on the Videos page?
Should series support custom episode ordering (e.g., narrative order)?
Should we add a dedicated content type for “Resources” in v1 or v1.1?