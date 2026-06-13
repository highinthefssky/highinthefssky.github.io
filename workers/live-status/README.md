# YouTube Live Status Worker

A Cloudflare Worker that checks if the YouTube channel is currently live streaming by fetching the channel's `/live` page.

## Why a Worker?

Browsers cannot reliably fetch YouTube pages due to CORS restrictions. This worker acts as a proxy that:
- Fetches the channel's `/live` page server-side
- Parses the live status, video ID, and title from the page HTML
- Caches the result in Cloudflare KV (5-minute TTL) to avoid excessive requests
- **Uses ZERO YouTube Data API quota** — no API key needed

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate with your Cloudflare account.

### 3. Deploy the Worker

```bash
cd workers/live-status
wrangler deploy
```

### 4. Add Secrets

After deploying, add your YouTube channel ID as a secret:

```bash
wrangler secret put YOUTUBE_CHANNEL_ID
# Paste your channel ID (starts with UC) when prompted
```

Alternatively, add it in the Cloudflare Dashboard:
1. Go to Workers & Pages → highinthesky-live-status → Settings → Variables
2. Add `YOUTUBE_CHANNEL_ID` as an encrypted secret

> **Note:** `YOUTUBE_API_KEY` is no longer required. If you previously set it, you can safely remove it.

### 5. Get Your Worker URL

After deployment, your worker will be available at:
```
https://highinthesky-live-status.<your-subdomain>.workers.dev
```

Or you can set up a custom domain in the Cloudflare Dashboard.

### 6. Update Your Website

Add the worker URL to your environment variables:

```env
PUBLIC_LIVE_STATUS_URL=https://highinthesky-live-status.<your-subdomain>.workers.dev
```

## Local Development

```bash
cd workers/live-status
wrangler dev
```

This runs the worker locally at `http://localhost:8787`.

## API Response

**When live:**
```json
{
  "isLive": true,
  "videoId": "abc123",
  "title": "Stream Title",
  "thumbnail": "https://i.ytimg.com/...",
  "scheduledStartTime": "2026-06-13T19:00:00Z"
}
```

**When not live:**
```json
{
  "isLive": false
}
```

## Cost

Cloudflare Workers has a generous free tier:
- 100,000 requests per day
- No credit card required

Your usage will be well under this limit.
