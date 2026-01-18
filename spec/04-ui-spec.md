# 04 – UI Specification

## 1. Overview

This document defines the visual layout, components, and responsive behavior for the  
**High in the Flight Sim Sky** website.  
The UI must reflect the aviation/MSFS theme, remain lightweight for GitHub Pages, and make content easy to navigate.

The design emphasizes clarity, discoverability, and consistency across all pages.

---

## 2. Global layout

### 2.1 Header

- Fixed at the top (sticky).
- Slight transparency (e.g., rgba(255,255,255,0.9)).
- Contains:
  - Logo (text or image)
  - Navigation links:
    - Home
    - Videos
    - Series
    - Blog
    - About
    - Contact
- Mobile:
  - Collapses into a hamburger menu.
  - Slide‑down panel for navigation.

### 2.2 Footer

- Simple, clean.
- Contains:
  - Copyright
  - Social icons (YouTube, GitHub, etc.)
  - “Hosted on GitHub Pages” note
- Optional: small site map.

### 2.3 Layout grid

- Max width: 1200px
- Padding: 1.5rem on mobile, 2rem on desktop
- Grid system:
  - 1 column on mobile
  - 2–3 columns for cards on tablet
  - 3–4 columns on desktop

---

## 3. Home page layout

### 3.1 Hero section

- Full‑width section with sky‑themed gradient.
- Elements:
  - Title: **High in the Flight Sim Sky**
  - Subtitle: *Microsoft Flight Simulator 2020/2024 videos, tutorials, and adventures.*
  - CTA buttons:
    - “Watch on YouTube”
    - “Explore Series”
- Optional background elements:
  - Subtle clouds
  - Faint heading indicator or altitude tape

### 3.2 Latest videos section

- Title: **Latest Videos**
- Auto‑sorted from `_videos` by date.
- Card layout:
  - Thumbnail
  - Title
  - Series label
  - “Watch” button linking to YouTube
- 3–6 items displayed.

### 3.3 Featured series section

- Title: **Featured Series**
- Cards for 2–3 series.
- Card layout:
  - Cover image
  - Title
  - Short description
  - “View Series” button

### 3.4 Optional: Blog highlights

- Title: **From the Blog**
- Latest 2–3 posts.
- Each card:
  - Thumbnail (optional)
  - Title
  - Summary
  - “Read more”

---

## 4. Videos page layout

### 4.1 Filter bar

- Horizontal bar at top.
- Components:
  - Dropdown: Series
  - Dropdown: MSFS version (2020/2024)
  - Search field (title/description)
- Filters update results client‑side.

### 4.2 Video grid

- Card layout identical to home page.
- Displays all videos unless filtered.
- Optional: infinite scroll or pagination.

---

## 5. Series index layout

### 5.1 Series grid

- Title: **All Series**
- Cards for each series:
  - Cover image
  - Title
  - Short description
  - “View Series” button

---

## 6. Series detail layout

### 6.1 Series hero

- Large cover image or banner.
- Title + description.
- Optional: playlist embed.

### 6.2 Episode list

- Title: **Episodes**
- List or grid of videos belonging to the series.
- Each item:
  - Thumbnail
  - Title
  - Short description
  - “Watch” button

---

## 7. Blog layout

### 7.1 Blog index

- Title: **Blog**
- List of posts sorted by date.
- Each card:
  - Title
  - Date
  - Summary
  - Thumbnail (optional)
  - “Read more”

### 7.2 Blog post

- Title
- Date
- Tags (optional)
- Markdown content
- Optional: related posts

---

## 8. About page layout

- Title: **About**
- Sections:
  - Johan’s story
  - MSFS background
  - Setup overview
  - Mission of the channel
  - Social links

---

## 9. Contact page layout

- Title: **Contact**
- Elements:
  - Email link
  - Social icons
  - Optional: external form service (e.g., Formspree)

---

## 10. Components

### 10.1 Buttons

- Primary button:
  - Blue aviation theme (#1A73E8)
  - Rounded corners
  - Hover: darker shade
- Secondary button:
  - Outline style
  - Hover: subtle fill

### 10.2 Cards

- Rounded corners
- Soft shadow
- Hover lift effect
- Consistent padding (1rem–1.5rem)

### 10.3 Typography

- Headings: **Montserrat**
- Body: **Inter** or **Roboto**
- Code/technical: **JetBrains Mono**

---

## 11. Responsive behavior

### Mobile (≤ 600px)

- Single‑column layout
- Hamburger menu
- Cards stack vertically
- Hero text centered

### Tablet (600–900px)

- 2‑column grids
- Navigation visible or collapsible depending on width

### Desktop (≥ 900px)

- Full navigation bar
- 3–4 column grids
- Larger hero section

---

## 12. Visual theme

### Colors

- Primary: **#1A73E8** (MSFS sky blue)
- Secondary: **#0D47A1** (deep aviation navy)
- Accent: **#FFC107** (warning light yellow)
- Background: **#F5F7FA** (cloud‑white)
- Text: **#1A1A1A**

### Style cues

- Subtle gradients
- Soft shadows
- Aviation‑inspired elements (heading indicator, altitude tape)
- Clean, modern, minimalistic

---

## 13. Open questions

- Should the hero include animated elements (e.g., slow‑moving clouds)?  
- Should video cards display duration?  
- Should the site support dark mode in v1 or v1.1?
