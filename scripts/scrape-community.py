"""
YouTube Community Tab Scraper
Scrapes community posts from a YouTube channel.
Designed to run locally or in GitHub Actions.
"""

import requests
import re
import json
import os
import sys
import argparse
from datetime import datetime, timezone, timedelta
from typing import Optional


# CONFIGURATION (can be overridden via command line or environment variables)
DEFAULT_CHANNEL_URL = "https://www.youtube.com/@Highintheflightsimsky/community"
OUTPUT_DIR = "data"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "posts.json")
POSTS_MD_DIR = os.path.join("src", "content", "posts")


def get_channel_url() -> str:
    """Get channel URL from environment variable or use default."""
    return os.environ.get("CHANNEL_URL", DEFAULT_CHANNEL_URL)


def parse_relative_time(relative_time: str) -> Optional[str]:
    """
    Parse YouTube's relative time string and convert to an estimated ISO date.
    
    Examples:
        '2 days ago' -> '2026-01-18T12:00:00Z'
        '3 years ago' -> '2023-01-20T12:00:00Z'
        '1 hour ago' -> '2026-01-20T11:00:00Z'
    
    Note: This is an approximation since YouTube only provides relative times.
    """
    if not relative_time or relative_time == 'Unknown':
        return None
    
    now = datetime.now(timezone.utc)
    relative_time = relative_time.lower().strip()
    
    # Handle "edited" suffix
    relative_time = relative_time.replace('(edited)', '').strip()
    
    # Parse the relative time
    patterns = [
        (r'(\d+)\s*second', 'seconds'),
        (r'(\d+)\s*minute', 'minutes'),
        (r'(\d+)\s*hour', 'hours'),
        (r'(\d+)\s*day', 'days'),
        (r'(\d+)\s*week', 'weeks'),
        (r'(\d+)\s*month', 'months'),
        (r'(\d+)\s*year', 'years'),
    ]
    
    for pattern, unit in patterns:
        match = re.search(pattern, relative_time)
        if match:
            value = int(match.group(1))
            
            if unit == 'seconds':
                delta = timedelta(seconds=value)
            elif unit == 'minutes':
                delta = timedelta(minutes=value)
            elif unit == 'hours':
                delta = timedelta(hours=value)
            elif unit == 'days':
                delta = timedelta(days=value)
            elif unit == 'weeks':
                delta = timedelta(weeks=value)
            elif unit == 'months':
                # Approximate: 30 days per month
                delta = timedelta(days=value * 30)
            elif unit == 'years':
                # Approximate: 365 days per year
                delta = timedelta(days=value * 365)
            else:
                return None
            
            estimated_date = now - delta
            return estimated_date.strftime('%Y-%m-%d')
    
    return None


def extract_ytInitialData(html: str) -> Optional[dict]:
    """Extract the ytInitialData JSON object from YouTube page HTML."""
    # YouTube embeds all page data in a JS variable called 'ytInitialData'
    patterns = [
        r'var ytInitialData = ({.*?});',
        r'ytInitialData\s*=\s*({.*?});',
        r'window\["ytInitialData"\]\s*=\s*({.*?});',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, html, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue
    return None


def find_community_tab(data: dict) -> Optional[dict]:
    """Navigate the YouTube JSON structure to find the community tab content."""
    try:
        tabs = data['contents']['twoColumnBrowseResultsRenderer']['tabs']
        
        for tab in tabs:
            tab_renderer = tab.get('tabRenderer', {})
            
            # Check by tab title
            if tab_renderer.get('title', '').lower() == 'community':
                return tab_renderer
            
            # Check by endpoint params
            endpoint = tab_renderer.get('endpoint', {}).get('browseEndpoint', {})
            params = endpoint.get('params', '')
            if 'community' in params.lower():
                return tab_renderer
            
            # When navigating directly to /community, the selected tab has content but no title
            # Check if this tab is selected and has the expected community content structure
            if tab_renderer.get('selected', False) and 'content' in tab_renderer:
                content = tab_renderer['content']
                if 'sectionListRenderer' in content:
                    # Verify it contains post-like content
                    sections = content['sectionListRenderer'].get('contents', [])
                    for section in sections:
                        items = section.get('itemSectionRenderer', {}).get('contents', [])
                        for item in items:
                            if 'backstagePostThreadRenderer' in item:
                                return tab_renderer
                
    except (KeyError, TypeError):
        pass
    
    return None


def extract_posts(community_tab: dict) -> list:
    """Extract post data from the community tab structure."""
    posts = []
    
    try:
        sections = community_tab['content']['sectionListRenderer']['contents']
        
        for section in sections:
            items = section.get('itemSectionRenderer', {}).get('contents', [])
            
            for item in items:
                post_thread = item.get('backstagePostThreadRenderer', {})
                post_renderer = post_thread.get('post', {}).get('backstagePostRenderer', {})
                
                if post_renderer:
                    post = extract_post_data(post_renderer)
                    # Exclude posts that contain polls
                    if post and post.get('poll') is None:
                        posts.append(post)
                        
    except (KeyError, TypeError) as e:
        print(f"Warning: Error parsing posts structure: {e}")
    
    return posts


def extract_post_data(post_renderer: dict) -> Optional[dict]:
    """Extract relevant data from a single post renderer."""
    try:
        post_id = post_renderer.get('postId', '')
        
        # Extract post text
        text_runs = post_renderer.get('contentText', {}).get('runs', [])
        full_text = "".join([run.get('text', '') for run in text_runs])
        
        # Extract published time
        published_time_runs = post_renderer.get('publishedTimeText', {}).get('runs', [])
        published_time = published_time_runs[0].get('text', '') if published_time_runs else 'Unknown'
        
        # Extract vote count (likes)
        vote_count = post_renderer.get('voteCount', {}).get('simpleText', '0')
        
        # Extract comment count
        action_buttons = post_renderer.get('actionButtons', {}).get('commentActionButtonsRenderer', {})
        reply_button = action_buttons.get('replyButton', {}).get('buttonRenderer', {})
        comment_count = reply_button.get('text', {}).get('simpleText', '0')
        
        # Extract images if present
        images = []
        backstage_attachment = post_renderer.get('backstageAttachment', {})
        
        # Single image
        if 'backstageImageRenderer' in backstage_attachment:
            img_renderer = backstage_attachment['backstageImageRenderer']
            thumbnails = img_renderer.get('image', {}).get('thumbnails', [])
            if thumbnails:
                # Get highest resolution
                images.append(thumbnails[-1].get('url', ''))
        
        # Multiple images
        if 'postMultiImageRenderer' in backstage_attachment:
            multi_img = backstage_attachment['postMultiImageRenderer']
            for img in multi_img.get('images', []):
                thumbnails = img.get('backstageImageRenderer', {}).get('image', {}).get('thumbnails', [])
                if thumbnails:
                    images.append(thumbnails[-1].get('url', ''))
        
        # Video attachment
        video_id = None
        if 'videoRenderer' in backstage_attachment:
            video_id = backstage_attachment['videoRenderer'].get('videoId', '')
        
        # Poll data
        poll_data = None
        if 'pollRenderer' in backstage_attachment:
            poll_renderer = backstage_attachment['pollRenderer']
            choices = []
            for choice in poll_renderer.get('choices', []):
                choice_text = choice.get('text', {}).get('runs', [{}])[0].get('text', '')
                choices.append(choice_text)
            if choices:
                poll_data = {"choices": choices}
        
        # Parse relative time to get estimated publish date
        published_date = parse_relative_time(published_time)
        
        return {
            "id": post_id,
            "text": full_text,
            "published_relative": published_time,
            "published_date": published_date,
            "url": f"https://www.youtube.com/post/{post_id}",
            "likes": vote_count,
            "comments": comment_count,
            "images": images if images else None,
            "video_id": video_id,
            "poll": poll_data,
            "scraped_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        
    except (KeyError, TypeError, IndexError) as e:
        print(f"Warning: Error extracting post data: {e}")
        return None


def scrape_community(channel_url: Optional[str] = None) -> list:
    """
    Scrape community posts from a YouTube channel.
    
    Args:
        channel_url: URL of the YouTube channel's community tab
        
    Returns:
        List of scraped posts
    """
    url = channel_url or get_channel_url()
    
    # Ensure URL ends with /community
    if not url.endswith('/community'):
        url = url.rstrip('/') + '/community'
    
    print(f"Scraping: {url}")
    
    # Fetch the page with browser-like headers
    # Include cookies to bypass consent page (SOCS cookie accepts cookies)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    
    # Cookies to bypass EU consent screen
    cookies = {
        "SOCS": "CAISHAgBEhJnd3NfMjAyMzA4MTAtMF9SQzIaAmVuIAEaBgiAo_CmBg",
        "CONSENT": "YES+cb.20210720-07-p0.en+FX+410",
    }
    
    try:
        response = requests.get(url, headers=headers, cookies=cookies, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error: Failed to fetch page: {e}")
        sys.exit(1)
    
    # Extract the embedded JSON data
    data = extract_ytInitialData(response.text)
    if not data:
        print("Error: Could not find ytInitialData. YouTube might have changed their layout.")
        sys.exit(1)
    
    # Find the community tab
    community_tab = find_community_tab(data)
    if not community_tab:
        print("Error: Could not find community tab. Check if the channel has public posts.")
        sys.exit(1)
    
    # Extract posts
    posts = extract_posts(community_tab)
    
    # Filter out None values
    posts = [p for p in posts if p is not None]
    
    return posts


def save_posts(posts: list, output_file: str = OUTPUT_FILE):
    """Save posts to JSON file."""
    output_dir = os.path.dirname(output_file)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Load existing posts to merge (avoid duplicates)
    existing_posts = []
    if os.path.exists(output_file):
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                existing_posts = json.load(f)
        except (json.JSONDecodeError, IOError):
            existing_posts = []
    
    # Merge posts (new posts take precedence)
    existing_ids = {p['id'] for p in existing_posts}
    new_posts = [p for p in posts if p['id'] not in existing_ids]
    
    # Update existing posts with new data
    updated_posts = []
    for existing in existing_posts:
        # Find matching new post
        matching = next((p for p in posts if p['id'] == existing['id']), None)
        if matching:
            updated_posts.append(matching)
        else:
            updated_posts.append(existing)
    
    # Add completely new posts
    all_posts = new_posts + updated_posts
    
    # Sort by scraped_at (newest first)
    all_posts.sort(key=lambda x: x.get('scraped_at', ''), reverse=True)
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_posts, f, indent=2, ensure_ascii=False)
    
    return len(new_posts), len(all_posts)


def _slugify(text: str, fallback: str) -> str:
    """Create a URL-friendly slug from text or fall back to provided string."""
    if not text:
        return fallback
    # Keep alphanumerics and spaces, replace others
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", text).strip().lower()
    # Collapse whitespace to single dashes
    slug = re.sub(r"\s+", "-", cleaned)
    # Trim to reasonable length
    if len(slug) < 8:
        return fallback
    return slug[:60]


def _title_from_text(text: str) -> str:
    """Derive a title from the first sentence or truncate."""
    if not text:
        return "Community Update"
    first_sentence = text.split("\n")[0]
    # Split by period for sentence; fallback to truncate
    sentence = first_sentence.split(".")[0].strip()
    title = sentence if sentence else first_sentence.strip()
    return (title[:80]).strip() or "Community Update"


def _description_from_text(text: str) -> str:
    if not text:
        return "YouTube community post"
    desc = text.strip().replace("\n", " ")
    return (desc[:160]).strip()


def write_markdown_posts(posts: list, posts_dir: str = POSTS_MD_DIR) -> int:
    """Generate/update Markdown files for posts in Astro collection."""
    os.makedirs(posts_dir, exist_ok=True)
    written = 0
    for post in posts:
        post_id = post.get("id") or "unknown"
        text = post.get("text") or ""
        pub_date = post.get("published_date") or (post.get("scraped_at", "")[:10] or datetime.now(timezone.utc).strftime('%Y-%m-%d'))
        url = post.get("url") or ""
        images = post.get("images") or []
        likes = post.get("likes") or "0"
        comments = post.get("comments") or "0"

        title = _title_from_text(text)
        description = _description_from_text(text)
        base_slug = f"community-{post_id}"
        content_slug = _slugify(title, base_slug)
        filename = f"{content_slug}.md"
        filepath = os.path.join(posts_dir, filename)

        # Frontmatter for Astro content schema
        frontmatter = [
            "---",
            f"title: \"{title}\"",
            f"description: \"{description}\"",
            f"publishedAt: {pub_date}",
            "tags: [\"community\", \"youtube\"]",
            "draft: false",
            "---",
            "",
        ]

        body_lines = []
        if text:
            body_lines.append(text.strip())
            body_lines.append("")
        if url:
            body_lines.append(f"Original post: {url}")
        meta_line = f"Likes: {likes} | Comments: {comments}"
        body_lines.append(meta_line)
        body_lines.append("")
        if images:
            body_lines.append("Images:")
            for img in images:
                body_lines.append(f"![]({img})")
            body_lines.append("")

        content = "\n".join(frontmatter + body_lines)

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            written += 1
        except IOError as e:
            print(f"Warning: Failed to write {filepath}: {e}")

    return written


def main():
    parser = argparse.ArgumentParser(description="Scrape YouTube community posts")
    parser.add_argument(
        "--url", "-u",
        help="YouTube channel community URL (or set CHANNEL_URL env var)",
        default=None
    )
    parser.add_argument(
        "--output", "-o",
        help="Output JSON file path",
        default=OUTPUT_FILE
    )
    parser.add_argument(
        "--from-json", "-j",
        help="Convert an existing JSON file to Markdown and exit",
        default=None
    )
    parser.add_argument(
        "--no-scrape",
        action="store_true",
        help="Skip scraping; only convert JSON to Markdown (uses --from-json or --output)"
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Suppress output except errors"
    )
    
    args = parser.parse_args()
    
    # Convert-only mode: skip network, just generate Markdown
    if args.no_scrape or args.from_json:
        source_json = args.from_json or args.output
        if not os.path.exists(source_json):
            print(f"Error: JSON file not found: {source_json}")
            sys.exit(1)
        try:
            with open(source_json, "r", encoding="utf-8") as f:
                all_posts = json.load(f)
            md_written = write_markdown_posts(all_posts, POSTS_MD_DIR)
            if not args.quiet:
                print(f"✓ Markdown posts written: {md_written} in {POSTS_MD_DIR}")
            sys.exit(0)
        except Exception as e:
            print(f"Error: Failed to convert JSON to Markdown: {e}")
            sys.exit(1)
    
    # Normal mode: scrape, save JSON, then generate Markdown
    posts = scrape_community(args.url)
    
    if not posts:
        print("Warning: No posts found")
        sys.exit(0)
    
    new_count, total_count = save_posts(posts, args.output)
    
    try:
        with open(args.output, "r", encoding="utf-8") as f:
            all_posts = json.load(f)
        md_written = write_markdown_posts(all_posts, POSTS_MD_DIR)
    except Exception as e:
        md_written = 0
        print(f"Warning: Failed to generate markdown posts: {e}")
    
    if not args.quiet:
        print(f"✓ Scraped {len(posts)} posts")
        print(f"✓ {new_count} new posts added")
        print(f"✓ Total posts saved: {total_count}")
        print(f"✓ Output: {args.output}")
        print(f"✓ Markdown posts written: {md_written} in {POSTS_MD_DIR}")
    
    # Set GitHub Actions output if running in CI
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"posts_count={len(posts)}\n")
            f.write(f"new_posts={new_count}\n")
            f.write(f"total_posts={total_count}\n")


if __name__ == "__main__":
    main()