# 01 – Product spec

## 1. Basic information

**Product name:** High in the Flight Sim Sky – Web Hub  
**Owner:** Johan (High in the Flight Sim Sky)  
**Domain:** https://highintheflightsimsky.nl  
**Hosting:** GitHub Pages  
**Primary content source:** YouTube channel “High in the Flight Sim Sky”

---

## 2. Purpose and vision

The website is the central hub for all content related to the “High in the Flight Sim Sky” YouTube channel.

It should:

- Extend the channel with a clear, structured home base.
- Make it easier to browse videos, series, and topics than on YouTube alone.
- Support future content types such as blog posts, guides, and resources.
- Reflect the aviation/MSFS identity visually and tonally.

**Vision statement:**  
*A clean, fast, aviation‑themed hub where MSFS simmers can quickly find, watch, and explore High in the Flight Sim Sky content.*

---

## 3. Goals

### 3.1 Primary goals

- **G1 – Content discovery:**  
  Visitors can easily discover relevant videos, series, and topics from the YouTube channel.

- **G2 – Series presentation:**  
  Present major series (Forbidden Skies, A–Z, Tutorials) in a structured, professional way.

- **G3 – Brand home base:**  
  Provide a recognizable, independent home for the High in the Flight Sim Sky brand outside YouTube.

- **G4 – Future‑proof content:**  
  Support additional content types (blog posts, guides, resources, newsletters) without redesigning the site.

### 3.2 Secondary goals

- **G5 – SEO & shareability:**  
  Improve discoverability via search engines and make it easy to share specific videos/series pages.

- **G6 – Maintainability:**  
  Allow Johan to add or update content quickly using markdown and GitHub workflows.

---

## 4. Target audience

### 4.1 Primary audience

- **MSFS 2020/2024 simmers** who:
  - Want tutorials, tips, and inspiration.
  - Enjoy structured series like Forbidden Skies or A–Z.
  - Prefer curated, organized content over YouTube’s default interface.

### 4.2 Secondary audience

- **New viewers** discovering the channel via search or shared links.  
- **Flight sim enthusiasts** curious about setups, workflows, and add‑ons.  
- **Potential collaborators** looking for a clear overview of Johan’s work.

---

## 5. Core user journeys

### 5.1 “I want to find a cool video to watch now”
- Lands on **Home** or **Videos**.  
- Sees latest or featured videos.  
- Filters or scans by series/topic.  
- Clicks through to YouTube to watch.

### 5.2 “I want to explore a specific series”
- Lands on **Home** or **Series**.  
- Clicks a series card (e.g., Forbidden Skies).  
- Reads description, sees playlist/episode list.  
- Opens an episode on YouTube.

### 5.3 “I want to know who’s behind this channel”
- Lands on **About**.  
- Reads Johan’s story, MSFS focus, and setup.  
- Follows links to YouTube and socials.

### 5.4 “I want updates, news, or extra context”
- Lands on **Blog**.  
- Reads posts about MSFS updates, new series, behind‑the‑scenes, or guides.

---

## 6. Success criteria

### 6.1 User‑facing success

- **S1:** A visitor can reach a relevant video or series page within **2 clicks** from the homepage.  
- **S2:** Navigation to **Home, Videos, Series, Blog, About, Contact** is always visible and clear.  
- **S3:** The site is fully usable on **mobile, tablet, and desktop**.

### 6.2 Operational success

- **S4:** Adding a new video entry (markdown file) takes **under 2 minutes**.  
- **S5:** No complex build tools required beyond GitHub Pages defaults.  
- **S6:** The site supports:
  - Videos  
  - Series  
  - Blog posts  
  - Static pages (About, Contact)

---

## 7. Constraints and assumptions

- **C1 – Hosting:** Must remain on GitHub Pages.  
- **C2 – Stack:** Prefer Jekyll or another static approach compatible with GitHub Pages.  
- **C3 – Performance:** Pages should load quickly on typical home internet and mobile data.  
- **C4 – Branding alignment:** Visual style should match the YouTube channel’s aviation/MSFS theme.  
- **C5 – Content source:** Videos are hosted on YouTube; the site embeds or links to them.

---

## 8. Out of scope (for now)

- User accounts or login system.  
- Comments system.  
- Complex backend search.  
- Forum or community platform.

---

## 9. Open questions

- **Q1:** Should a newsletter signup be included in v1?  
- **Q2:** Should video syncing be manual (markdown) or automated (API)?  
- **Q3:** Should a “Resources / Downloads” section be part of v1?