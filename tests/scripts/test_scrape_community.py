import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch


spec = importlib.util.spec_from_file_location(
    "scrape_community", Path(__file__).resolve().parents[2] / "scripts" / "scrape-community.py"
)
assert spec is not None and spec.loader is not None
scraper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scraper)


class ScraperSecurityTests(unittest.TestCase):
    def test_restricts_channel_urls(self):
        for url in (
            "http://www.youtube.com/@channel/community",
            "https://youtube.com.evil.example/community",
            "https://127.0.0.1/community",
            "https://user:password@www.youtube.com/community",
            "https://www.youtube.com:8443/community",
        ):
            with self.subTest(url=url), self.assertRaises(ValueError):
                scraper.validate_channel_url(url)
        url = "https://www.youtube.com/@channel/community"
        self.assertEqual(scraper.validate_channel_url(url), url)

    def test_rejects_redirect_to_another_host_before_request(self):
        response = Mock(is_redirect=True, headers={"Location": "https://127.0.0.1/community"})
        with patch.object(scraper.requests, "get", return_value=response) as get:
            with self.assertRaises(SystemExit):
                scraper.scrape_community()
        self.assertEqual(get.call_count, 1)
        self.assertFalse(get.call_args.kwargs["allow_redirects"])

    def test_accepts_same_host_redirect(self):
        redirect = Mock(is_redirect=True, headers={"Location": "/@channel/community"})
        final = Mock(is_redirect=False, text="page")
        with patch.object(scraper.requests, "get", side_effect=[redirect, final]) as get:
            with patch.object(scraper, "extract_ytInitialData", return_value={"data": True}):
                with patch.object(scraper, "find_community_tab", return_value={"content": True}):
                    with patch.object(scraper, "extract_posts", return_value=[]):
                        self.assertEqual(scraper.scrape_community(), [])
        self.assertEqual(get.call_count, 2)
        self.assertEqual(get.call_args.args[0], "https://www.youtube.com/@channel/community")

    def test_frontmatter_values_round_trip_without_newlines_or_backslash_escapes(self):
        text = 'A quoted "title" with a backslash \\ and a tab\t\nnext: not metadata'
        post = {"id": "safe-id", "text": text, "published_date": "2026-10-23"}
        with tempfile.TemporaryDirectory() as directory:
            self.assertEqual(scraper.write_markdown_posts([post], directory), 1)
            output = next(Path(directory).glob("*.md")).read_text()
        frontmatter = output.split("---", 2)[1]
        values = dict(line.split(": ", 1) for line in frontmatter.strip().splitlines())
        self.assertEqual(json.loads(values["title"]), scraper._title_from_text(text))
        self.assertEqual(json.loads(values["description"]), scraper._description_from_text(text))
        self.assertEqual(json.loads(values["publishedAt"]), "2026-10-23")
        self.assertEqual(len(values), 5)

    def test_rejects_path_traversal_post_id(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                scraper.write_markdown_posts([{"id": "../../../outside", "text": "short"}], directory)
            self.assertEqual(list(Path(directory).iterdir()), [])


if __name__ == "__main__":
    unittest.main()
