# YouTube Live Status Worker

A Cloudflare Worker that checks whether the YouTube channel is currently live
using its public RSS feed and a quota-efficient YouTube Data API request.

## Why a Worker?

Browsers cannot reliably fetch YouTube pages due to CORS restrictions. This worker acts as a proxy that:
- Reads recent channel video IDs from the public RSS feed
- Checks those IDs with one `videos.list` request for an active live broadcast
- Returns the live status, video ID, and title from the API response
- Coordinates refreshes globally in one SQLite-backed Durable Object
- Uses one YouTube Data API request per successful refresh, cached for five minutes

## Setup Instructions

### 1. Install Locked Dependencies

```bash
npm ci
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

This opens a browser to authenticate with your Cloudflare account.

### 3. Deploy the Worker

```bash
npx wrangler deploy --config workers/live-status/wrangler.toml
```

Deployment applies the `v1-live-status-coordinator` migration and creates the
`LIVE_STATUS_COORDINATOR` Durable Object binding. SQLite-backed Durable Objects
must be available on the Cloudflare account. The old KV namespace is no longer
used; deploying does not delete it. Do not roll back to the old KV-only
configuration without planning the Durable Object migration.

The repository changes do not deploy themselves until the normal deployment
workflow runs. Local dry runs and tests do not modify the Cloudflare account.

### 4. Configure the Channel and API Key

Set the public YouTube channel ID in `wrangler.toml` as
`YOUTUBE_CHANNEL_ID`. This is public channel metadata, not a secret.

Set a YouTube Data API v3 key as an encrypted Worker secret:

```bash
npx wrangler secret put YOUTUBE_API_KEY --config workers/live-status/wrangler.toml
```

The worker reads recent IDs from RSS and uses one low-cost `videos.list`
request per five-minute successful refresh. A legacy `YOUTUBE_CHANNEL_ID` secret may
be removed after deploying the `wrangler.toml` binding.

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
npx wrangler dev --local --config workers/live-status/wrangler.toml
```

This runs the worker locally at `http://localhost:8787`.
Use a local-only `.dev.vars` file in `workers/live-status/` for development
secrets; never commit API keys. The origin check allows localhost only when
`ALLOW_LOCALHOST` is explicitly enabled for development.

### Validation

```bash
node --test workers/live-status/worker.test.js
npx wrangler deploy --dry-run --config workers/live-status/wrangler.toml
```

## Refresh and Abuse Protection

All public requests use the same Durable Object, regardless of URL or Origin.
Concurrent cold requests share one refresh. A persisted five-minute reservation
is written before network access, so object eviction cannot immediately repeat a
refresh. Each upstream request has a ten-second timeout.

Expired cached results can be served for at most one hour while a refresh is in
progress or failing, with `stale: true` and `Cache-Control: no-store`. The site's
banner does not advertise stale live results. Failed refreshes are logged and
back off for one minute. Without usable cached data, the Worker responds with
HTTP 503, an explicit error, and `Retry-After: 60`; failures are never presented
as a successful current offline status.

The Origin check is CORS policy, not authentication. Non-browser clients can
supply it. Configure Cloudflare edge rate limits and usage alerts to protect
Worker/Durable Object request costs as well as YouTube quota. Restrict the API
key to YouTube Data API v3 and set appropriate Google quota alerts.

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

Worker and Durable Object request/storage usage depends on traffic and the
Cloudflare account plan. Caching bounds upstream refreshes, not incoming request
costs. Review current provider pricing before deployment.
