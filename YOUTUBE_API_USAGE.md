# YouTube Data API v3 — Usage Documentation

> Prepared for the YouTube API Services quota increase request for the project **High in the Flight Sim Sky** ([highintheflightsimsky.nl](https://highintheflightsimsky.nl)).

## Project Overview

High in the Flight Sim Sky is a **static website** (built with [Astro](https://astro.build)) that serves as a companion hub for a YouTube channel focused on Microsoft Flight Simulator content. The site displays video metadata, curated playlists, and a live-streaming indicator — all powered by the YouTube Data API v3.

The site is deployed on GitHub Pages and uses **no server-side rendering at runtime**. All YouTube API calls happen exclusively in:

1. **GitHub Actions CI/CD pipelines** (scheduled, server-side, fully automated)

Live stream detection runs via a **Cloudflare Worker** that fetches the channel's public `/live` page — it uses **zero YouTube API quota**.

**No API calls are ever made directly from the browser.** The API key is never exposed to end users.

---

## YouTube API Endpoints Used

| # | Endpoint | Quota cost | Where called | Purpose |
|---|----------|-----------|--------------|---------|
| 1 | `channels.list` | 1 unit | `scripts/fetch-videos.js` (GitHub Actions) | Fetch the channel's uploads playlist ID and subscriber count |
| 2 | `playlistItems.list` | 1 unit/page | `scripts/fetch-videos.js` (GitHub Actions) | Paginate through the uploads playlist to discover all video IDs |
| 3 | `videos.list` | 1 unit/batch | `scripts/fetch-videos.js` (GitHub Actions) | Fetch detailed metadata (title, description, tags, duration, statistics) for videos in batches of 50 |

> **Note:** Live stream detection previously used `search.list` (100 units/call) via a Cloudflare Worker. This has been replaced with a zero-quota approach that parses the channel's public `/live` page. See [Live Stream Detection](#3-live-stream-detection--cloudflare-worker-zero-api-quota) below.

---

## Detailed Usage by Feature

### 1. Daily Video Sync — `fetch-videos.js`

**Trigger:** GitHub Actions cron `0 0 * * *` (once daily at 00:00 UTC)
**Workflow:** `.github/workflows/fetch-videos.yml`

This script runs **server-side only** in a CI pipeline. It:

1. Calls **`channels.list`** (1 call, 1 unit) to get the uploads playlist ID, subscriber count, and total video count.
2. Calls **`playlistItems.list`** for the **2 most recent pages only** (100 videos). New uploads always appear at the top of the playlist, so 2 pages provides a comfortable buffer. This uses **2 units**.
3. Compares discovered video IDs against already-saved JSON files on disk. **Only new videos** trigger detail fetches.
4. Calls **`videos.list`** for new videos only (batched at 50 IDs per request). On a typical day with 0–2 new uploads, this is **0–1 calls = 0–1 units**.

**Typical daily quota usage: ~4 units** (1 channel + 2 playlist pages + 0–1 video detail batch)

Authentication: Google Cloud Workload Identity Federation (OIDC) — no API key in CI.

### 2. Monthly Full Refresh — `fetch-videos.js` (REFRESH_EXISTING=true)

**Trigger:** GitHub Actions cron `0 3 1 * *` (1st of each month at 03:00 UTC)
**Workflow:** `.github/workflows/refresh-videos-weekly.yml`

Same script as above, but paginates **all** playlist pages and re-fetches metadata for **all** existing videos to update statistics (view counts). This triggers `videos.list` for all ~1,864 videos.

**Monthly quota usage: ~78 units** (1 channel + 38 playlist pages + 38 video detail batches of 50)

### 3. Live Stream Detection — Cloudflare Worker (zero API quota)

**Trigger:** Client-side polling from the website, proxied through a Cloudflare Worker
**Worker:** `workers/live-status/worker.js`
**YouTube API quota used: 0**

#### Architecture

```
Browser  ──GET──▶  Cloudflare Worker  ──(cache miss)──▶  youtube.com/channel/.../live
                   (KV cache: 5 min TTL)                  (public HTML page, no API)
```

The browser **never** calls YouTube directly. The Cloudflare Worker:

1. Receives a GET request from the website (origin-validated via CORS allowlist).
2. Checks **Cloudflare KV** for a cached result (key: `live-status`, TTL: 300 seconds).
3. On cache **hit**: returns the cached JSON immediately — **0 fetches**.
4. On cache **miss**: fetches the channel's public `/live` page and parses the embedded JSON for live indicators (`"isLive":true`), the video ID, and the stream title. Stores the result in KV.

This approach uses **zero YouTube Data API quota** because it reads the publicly accessible channel page instead of calling the API.

#### Why not `search.list`?

The previous implementation used `search.list` (100 quota units per call). With a 5-minute cache TTL, this consumed up to 28,800 quota units/day — nearly 3× the default 10,000-unit daily limit. Replacing it with a page fetch eliminated this entirely.

#### Security Controls

- **Origin validation**: Only requests from `https://highintheflightsimsky.nl` (and optionally `localhost` during development) are accepted. All other origins receive HTTP 403.
- **Rate limiting via cache**: KV caching ensures the channel page is fetched at most once per 5 minutes, regardless of traffic volume.
- **No API key required**: This feature no longer needs a YouTube API key.
- **Dismissible**: Users can close the banner, which sets a `sessionStorage` flag so no further requests are made for that session.

### 4. Playlist Auto-Assignment — `update-playlists.js`

**Trigger:** Runs after `fetch-videos.js` in both daily and monthly workflows
**YouTube API calls: 0** — This script reads local JSON files only and assigns videos to playlists based on title/tag matching rules. No API interaction.

---

## Quota Budget Summary

| Source | Frequency | API calls | Quota units (per occurrence) |
|--------|-----------|-----------|------------------------------|
| Daily video sync | Once/day | ~4 | ~4 |
| Monthly full refresh | Once/month (1st) | ~78 | ~78 |
| Live status worker | Continuous (5-min cache) | 0 | **0** (page fetch, no API) |
| Playlist updates | Daily + monthly | 0 | 0 |

**Typical daily total: ~4 units**
**1st of month (refresh day): ~82 units** (4 daily + 78 refresh)
**Theoretical maximum daily total: ~82 units**

All quota usage comes exclusively from the scheduled CI pipelines. The live status feature uses zero API quota.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions (CI)                      │
│                                                              │
│  fetch-videos.js                                             │
│    ├─ channels.list        → channel info + uploads playlist │
│    ├─ playlistItems.list   → recent video IDs (2 pages daily, all on refresh)  │
│    └─ videos.list          → detailed metadata (batched)     │
│                                                              │
│  update-playlists.js                                         │
│    └─ (local JSON only, no API calls)                        │
│                                                              │
│  Output: JSON files committed to repo → GitHub Pages deploy  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Worker (Edge)                    │
│                                                              │
│  live-status/worker.js                                       │
│    ├─ KV cache check (5-min TTL)                             │
│    └─ Fetches channel /live page (zero API quota)            │
│                                                              │
│  Response: { isLive, videoId, title }                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Browser (Client-Side)                       │
│                                                              │
│  LiveBanner.astro                                            │
│    └─ GET → Cloudflare Worker (not YouTube directly)         │
│    └─ Polls every 5 minutes while page is open               │
│    └─ Dismissible (stops polling for session)                 │
│                                                              │
│  ⚠ NO direct YouTube API calls from the browser              │
│  ⚠ NO API keys exposed to the client                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Compliance with YouTube API Terms of Service

- **API key security**: The API key is used only in GitHub Actions CI pipelines (via Google Cloud OIDC). The Cloudflare Worker does not use an API key. No keys are included in client-side code, committed to the repository, or exposed in network responses.
- **No data storage beyond caching**: Video metadata is fetched and stored as static JSON files for site generation. Cloudflare KV caches the live status result for 5 minutes only. No user data from YouTube is collected or stored.
- **Attribution**: All video links point back to YouTube. The site serves as a discovery interface, driving traffic to YouTube for viewing.
- **No content re-hosting**: Videos are not downloaded or re-hosted. The site displays metadata and thumbnails, linking to YouTube for playback.
- **Rate limiting**: Server-side caching (KV) and delta-only fetching ensure minimal API usage.

---

## Technical Stack

| Component | Technology | Role |
|-----------|-----------|------|
| Website | Astro (static site generator) | Renders video hub from JSON data |
| Hosting | GitHub Pages | Serves static HTML/CSS/JS |
| CI/CD | GitHub Actions | Scheduled data fetching & deployment |
| Live status checker | Cloudflare Worker + KV | Fetches channel `/live` page (zero API quota) |
| Authentication (CI) | Google Cloud Workload Identity Federation | Keyless OIDC auth for GitHub Actions |

---

## Source Files Reference

| File | Description |
|------|-------------|
| `scripts/fetch-videos.js` | Fetches video metadata via `channels.list`, `playlistItems.list`, `videos.list` |
| `scripts/update-playlists.js` | Assigns videos to playlists based on local matching rules (no API calls) |
| `workers/live-status/worker.js` | Cloudflare Worker that checks live status via channel `/live` page (zero API quota) |
| `workers/live-status/wrangler.toml` | Worker configuration (KV binding, allowed origin) |
| `src/components/LiveBanner.astro` | Client-side component that polls the Worker for live status |
| `.github/workflows/fetch-videos.yml` | Daily CI pipeline for video sync |
| `.github/workflows/refresh-videos-weekly.yml` | Monthly CI pipeline for full metadata refresh |
