# YouTube Live Status Worker

A Cloudflare Worker that securely proxies requests to check if the YouTube channel is currently live streaming.

## Why a Worker?

This keeps your YouTube API key secret. Instead of exposing the key in the browser, the website calls this worker, which then calls YouTube with the secret key.

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

After deploying, add your YouTube credentials as secrets:

```bash
wrangler secret put YOUTUBE_API_KEY
# Paste your API key when prompted

wrangler secret put YOUTUBE_CHANNEL_ID
# Paste your channel ID (starts with UC) when prompted
```

Alternatively, add them in the Cloudflare Dashboard:
1. Go to Workers & Pages → highinthesky-live-status → Settings → Variables
2. Add `YOUTUBE_API_KEY` and `YOUTUBE_CHANNEL_ID` as encrypted secrets

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
  "thumbnail": "https://i.ytimg.com/..."
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
