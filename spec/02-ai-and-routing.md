# 02 – Information Architecture & Routing

## 1. Overview

This document defines the structure, navigation, and URL routing for the redesigned  
**High in the Flight Sim Sky** website.  
It ensures clarity, consistency, and ease of use for visitors while supporting maintainability on GitHub Pages.

The IA is intentionally simple, scalable, and aligned with the content model defined in later specs.

---

## 2. Top‑level navigation

The main navigation appears in the site header and is visible on all pages.

**Primary navigation items:**

- **Home** → `/`
- **Videos** → `/videos/`
- **Series** → `/series/`
- **Blog** → `/blog/`
- **About** → `/about/`
- **Contact** → `/contact/`

These items must remain stable and predictable across desktop and mobile layouts.

---

## 3. Page structure & routing

### 3.1 Home  
**URL:** `/`  
**Purpose:** Introduce the brand, highlight latest content, and guide users to key sections.

**Sections:**
- Hero (title, subtitle, CTA buttons)
- Latest videos (auto‑sorted from `_videos`)
- Featured series
- Optional: blog highlights
- Footer with social links

---

### 3.2 Videos  
**URL:** `/videos/`  
**Purpose:** Provide a complete, filterable overview of all videos.

**Content:**
- Filter bar:
  - Series
  - MSFS version (2020/2024)
  - Search field
- Video grid (thumbnail, title, tags, link to YouTube)
- Pagination optional (client‑side filtering preferred)

---

### 3.3 Series index  
**URL:** `/series/`  
**Purpose:** Present all series in a clean, visual overview.

**Content:**
- Grid of series cards
- Each card links to a series detail page

---

### 3.4 Series detail  
**URL pattern:** `/series/{slug}/`  
**Example:** `/series/forbidden-skies/`

**Content:**
- Series hero (cover image, title, description)
- Playlist embed (optional)
- Episode list (pulled from `_videos` where `series: slug`)
- Optional: behind‑the‑scenes notes

---

### 3.5 Blog  
**URL:** `/blog/`  
**Purpose:** Host updates, MSFS news, guides, and behind‑the‑scenes posts.

**Content:**
- List of posts sorted by date
- Tags optional
- Pagination optional

---

### 3.6 Blog post  
**URL pattern:** `/blog/{slug}/`  
**Example:** `/blog/msfs-2024-first-impressions/`

**Content:**
- Title, date, tags
- Markdown content
- Optional: related posts

---

### 3.7 About  
**URL:** `/about/`  
**Purpose:** Introduce Johan, the channel, and the mission.

**Content:**
- Bio
- MSFS background
- Setup overview
- Links to socials

---

### 3.8 Contact  
**URL:** `/contact/`  
**Purpose:** Provide ways to reach you or follow your work.

**Content:**
- Email link
- Social links
- Optional: simple contact form (static or external service)

---

## 4. Supporting pages (optional for v1)

These can be added later without changing the core IA.

### 4.1 Resources  
**URL:** `/resources/`  
Checklists, downloads, recommended add‑ons, etc.

### 4.2 Newsletter  
**URL:** `/newsletter/`  
Signup page if you introduce email updates.

---

## 5. URL conventions

- All URLs are **lowercase**.  
- Words are separated by **hyphens**.  
- Series and video slugs must be stable and human‑readable.  
- Trailing slashes are used consistently (`/series/forbidden-skies/`).

---

## 6. Navigation rules

- The header navigation is always visible.  
- On mobile, the nav collapses into a hamburger menu.  
- The footer repeats key links and social icons.  
- Breadcrumbs are optional but recommended for:
  - Series detail pages
  - Blog posts

Example breadcrumb for a series episode:
Home > Series > Forbidden Skies > Episode 3


---

## 7. Scalability considerations

The IA must support:

- New series without structural changes  
- Hundreds of videos  
- Additional content types (guides, resources)  
- Future MSFS versions (2026, etc.)

The routing structure is intentionally simple to avoid breaking links over time.

---

## 8. Open questions

- Should series pages support custom ordering (e.g., narrative order vs. date)?  
- Should the Videos page include aircraft filters (e.g., A320, C172, F/A‑18)?  
- Should the Blog be part of v1 or added in v1.1?
