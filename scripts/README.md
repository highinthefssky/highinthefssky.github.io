# YouTube sync script

This folder contains `fetch_youtube.py`, a small script used by the GitHub Actions workflow to generate `_videos/*.md` files from a YouTube channel.

Required repository secrets (Settings → Secrets):

- `YT_API_KEY` — YouTube Data API v3 key
- `YT_CHANNEL_ID` — The channel ID to sync

How the Action runs:

1. The workflow runs manually or on a daily schedule.
2. The script fetches public video metadata and writes `_videos/{slug}.md` files.
3. The workflow commits any changed/new files back to the repository.

Local testing

PowerShell example:

```powershell
$env:YT_API_KEY = 'your_api_key'
$env:YT_CHANNEL_ID = 'UCxxxxxxxxxxxx'
python -m pip install -r requirements.txt
python scripts/fetch_youtube.py
```

Notes:
- The script writes YouTube thumbnail URLs into the `thumbnail` front matter; you can later download and store thumbnails locally if desired.
- The script is intentionally minimal; feel free to request additional fields (duration, tags, playlist mapping).
