# Deployment Guide

This guide explains how to deploy High in the Sky to GitHub Pages and set up automated updates.

## Prerequisites

- GitHub account and repository
- Git installed locally
- Node.js 18+ installed
- YouTube API credentials

## GitHub Pages Setup

### 1. Initial Repository Configuration

The site is configured to deploy to GitHub Pages automatically. Ensure your repository is set up correctly:

```bash
# Clone your repository
git clone https://github.com/yourusername/highinthefssky.github.io.git
cd highinthefssky.github.io

# Set up deployment branch (usually main)
git branch -M main
```

### 2. Repository Settings

In your GitHub repository Settings:

1. Go to **Settings → Pages**
2. Select **Deploy from a branch**
3. Choose **main** branch and **/root** directory
4. Click **Save**

### 3. Add Secrets for Automation

For automated video fetching, add GitHub Secrets:

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add:
   - `YOUTUBE_API_KEY`: Your YouTube API key
   - `YOUTUBE_CHANNEL_ID`: Your channel ID

## YouTube API Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **YouTube Data API v3**
4. Create an API key:
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → API Key**
   - Restrict to YouTube Data API v3
   - Copy the key

### 2. Find Your Channel ID

Visit your YouTube channel and:
- Right-click → **View page source**
- Search for `"channelId"`
- Copy the value

## Local Development & Testing

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
# Copy template
cp .env.local.example .env.local

# Edit .env.local with your credentials
YOUTUBE_API_KEY=your_key_here
YOUTUBE_CHANNEL_ID=your_channel_id_here
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to preview changes.

### 4. Test Video Fetching (Optional)

```bash
node scripts/fetch-videos.js
```

This will fetch videos from YouTube and save them locally.

## Deployment Process

### 1. Local Build

```bash
# Build production site
npm run build

# Preview production build
npm run preview
```

### 2. Push to GitHub

```bash
# Add all changes
git add .

# Commit with message
git commit -m "Add new videos and posts"

# Push to main branch
git push origin main
```

### 3. Automatic Deployment

GitHub Actions will:
1. Run the build workflow
2. Generate static files
3. Deploy to GitHub Pages
4. Typically available within 1-2 minutes

**Check deployment status:**
- Go to **Actions** tab in your repository
- View the latest workflow run
- See deployment status and any errors

## Domain Configuration

### Using GitHub Pages Default Domain

Your site will be available at: `https://yourusername.github.io`

### Using Custom Domain

1. Create a `CNAME` file in the repository root with your domain:
   ```
   yourdomain.com
   ```

2. Configure DNS records with your registrar:
   - Add an A record pointing to GitHub Pages IP: `185.199.108.153`
   - Or add CNAME record pointing to: `yourusername.github.io`

3. In repository Settings → Pages:
   - Enter your custom domain
   - Enable HTTPS (wait a few minutes for certificate)

## Automated Video Updates

The repository includes a GitHub Actions workflow to fetch videos daily:

**File:** `.github/workflows/fetch-videos.yml`

This workflow:
- Runs daily at specified time
- Fetches latest videos from your channel
- Commits changes automatically
- Redeploys the site

**To modify schedule:**

Edit `.github/workflows/fetch-videos.yml`:
```yaml
schedule:
  - cron: '0 2 * * *'  # Change this time (UTC)
```

## Troubleshooting

### Build Fails

**Check:**
- Node.js version: `node --version` (should be 18+)
- Dependencies: `npm install`
- Environment variables in `.env.local`

**Clear cache:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Not Appearing

**Check:**
- GitHub Actions workflow completed successfully
- Branch protection rules don't block deployment
- GitHub Pages is enabled in Settings

### Videos Not Fetching

**Verify:**
- `YOUTUBE_API_KEY` is valid
- `YOUTUBE_CHANNEL_ID` is correct
- API quota not exceeded (check Google Cloud Console)

**Manual test:**
```bash
node scripts/fetch-videos.js
```

### Custom Domain Issues

**Wait for:**
- DNS propagation (can take up to 24 hours)
- SSL certificate generation (usually 5-10 minutes)

**Check DNS:**
```bash
nslookup yourdomain.com
```

## Monitoring

### Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain
3. Verify ownership
4. Monitor:
   - Indexing status
   - Search performance
   - Mobile usability

### Analytics

Consider adding analytics service:
- Google Analytics
- Plausible Analytics
- Fathom Analytics

Add tracking code to `src/layouts/BaseLayout.astro`

## Maintenance

### Regular Tasks

- **Weekly:** Monitor GitHub Actions for errors
- **Monthly:** Check search console for issues
- **Quarterly:** Review and update documentation
- **Yearly:** Update dependencies: `npm update`

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Update specific package
npm install package-name@latest
```

## Support

For deployment issues:
- Check [Astro Deployment Docs](https://docs.astro.build/en/guides/deploy/)
- Review [GitHub Pages Help](https://docs.github.com/en/pages)
- Open an issue in the repository
- Check [Troubleshooting Guide](README.md#troubleshooting)

---

Your site should now be live! Visit your domain to confirm everything is working correctly.
