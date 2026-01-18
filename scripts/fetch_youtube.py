#!/usr/bin/env python3
"""Fetch public YouTube video metadata for a channel and write Jekyll markdown files.

Requires environment variables:
- YT_API_KEY: YouTube Data API v3 key
- YT_CHANNEL_ID: Channel ID to fetch

Writes files into the `_videos/` folder.
"""
import os
import re
import sys
import time
import requests
import yaml
from pathlib import Path
from datetime import datetime

YT_API_KEY = os.getenv('YT_API_KEY')
YT_CHANNEL_ID = os.getenv('YT_CHANNEL_ID')
TARGET_DIR = Path(os.getenv('TARGET_DIR', '_videos'))

if not YT_API_KEY or not YT_CHANNEL_ID:
    print('Error: set YT_API_KEY and YT_CHANNEL_ID environment variables')
    sys.exit(1)

def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", '-', text)
    text = re.sub(r"-+", '-', text).strip('-')
    return text[:120]

def fetch_all_video_ids():
    url = 'https://www.googleapis.com/youtube/v3/search'
    params = {
        'key': YT_API_KEY,
        'channelId': YT_CHANNEL_ID,
        'part': 'snippet',
        'order': 'date',
        'maxResults': 50,
        'type': 'video',
    }
    ids = []
    while True:
        r = requests.get(url, params=params)
        r.raise_for_status()
        data = r.json()
        for item in data.get('items', []):
            ids.append(item['id']['videoId'])
        if 'nextPageToken' in data:
            params['pageToken'] = data['nextPageToken']
            time.sleep(0.1)
            continue
        break
    return ids

def fetch_videos_metadata(batch):
    url = 'https://www.googleapis.com/youtube/v3/videos'
    params = {
        'key': YT_API_KEY,
        'id': ','.join(batch),
        'part': 'snippet,contentDetails'
    }
    r = requests.get(url, params=params)
    r.raise_for_status()
    return r.json().get('items', [])

def iso8601_to_date(iso):
    # Example: 2025-01-10T12:34:56Z
    return iso.split('T')[0]

def choose_thumbnail(thumbs):
    for key in ('maxres','standard','high','medium','default'):
        if key in thumbs:
            return thumbs[key]['url']
    return ''

def write_video_md(video):
    title = video['snippet']['title']
    vid = video['id']
    date = iso8601_to_date(video['snippet']['publishedAt'])
    description = video['snippet'].get('description', '')
    thumbs = video['snippet'].get('thumbnails', {})
    thumbnail = choose_thumbnail(thumbs)

    base_slug = slugify(title)
    filename = f"{base_slug}.md"
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    path = TARGET_DIR / filename

    # Avoid collisions: if file exists but different youtube_id, append suffix
    if path.exists():
        with path.open('r', encoding='utf-8') as f:
            text = f.read()
        if f'youtube_id: "{vid}"' in text:
            print(f'skip (exists): {path.name}')
            return
        else:
            filename = f"{base_slug}-{vid[-8:]}.md"
            path = TARGET_DIR / filename

    front = {
        'title': title,
        'youtube_id': vid,
        'date': date,
        'thumbnail': thumbnail,
    }

    content = '---\n' + yaml.safe_dump(front, sort_keys=False) + '---\n\n' + description.strip() + '\n'
    with path.open('w', encoding='utf-8') as f:
        f.write(content)
    print(f'written: {path}')

def main():
    print('Fetching video ids...')
    ids = fetch_all_video_ids()
    print(f'Found {len(ids)} videos')
    # fetch in batches of 50
    for i in range(0, len(ids), 50):
        batch = ids[i:i+50]
        items = fetch_videos_metadata(batch)
        for v in items:
            write_video_md(v)

if __name__ == '__main__':
    main()
