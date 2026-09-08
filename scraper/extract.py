"""Extract step: fetch the target Wikipedia page and cache the raw HTML.

Responsible scraping practices applied here:
- respects robots.txt (checked at runtime, not just by hand once)
- identifies itself with a descriptive User-Agent (no browser spoofing)
- rate-limits itself with a fixed delay between requests
- retries transient failures with exponential backoff instead of crashing
- caches the raw HTML so re-parsing later doesn't require re-fetching
"""

from __future__ import annotations

import sys
import time
import urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import requests

from scraper.config import (
    BACKOFF_BASE_SECONDS,
    MAX_RETRIES,
    RAW_HTML_DIR,
    REQUEST_DELAY_SECONDS,
    REQUEST_HEADERS,
    REQUEST_TIMEOUT_SECONDS,
    TARGET_URL,
    USER_AGENT,
)


class ScrapeNotAllowedError(RuntimeError):
    """Raised when robots.txt disallows fetching the target URL."""


def check_robots_txt(url: str) -> None:
    """Verify robots.txt allows fetching `url` before we touch the network for it.

    Uses `requests` with our real User-Agent rather than `RobotFileParser.read()`'s
    default fetch: Wikipedia's edge returns 403 for the unidentified default
    `Python-urllib/*` User-Agent, and RobotFileParser treats a 403 as "disallow
    everything" instead of raising, which silently blocked a page robots.txt
    actually permits.
    """
    parsed = urlparse(url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"

    response = requests.get(robots_url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()

    parser = urllib.robotparser.RobotFileParser()
    parser.parse(response.text.splitlines())

    if not parser.can_fetch(USER_AGENT, url):
        raise ScrapeNotAllowedError(
            f"robots.txt at {robots_url} disallows fetching {url} for our User-Agent"
        )


def fetch_with_retry(url: str) -> str:
    """GET `url`, retrying transient failures with exponential backoff."""
    last_error: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.get(
                url, headers=REQUEST_HEADERS, timeout=REQUEST_TIMEOUT_SECONDS
            )
            response.raise_for_status()
            return response.text
        except (requests.RequestException,) as exc:
            last_error = exc
            if attempt < MAX_RETRIES:
                wait_seconds = BACKOFF_BASE_SECONDS * (2 ** (attempt - 1))
                print(
                    f"[extract] request failed (attempt {attempt}/{MAX_RETRIES}): {exc}. "
                    f"Retrying in {wait_seconds:.0f}s...",
                    file=sys.stderr,
                )
                time.sleep(wait_seconds)

    raise RuntimeError(f"Failed to fetch {url} after {MAX_RETRIES} attempts") from last_error


def save_raw_html(html: str, scraped_at: datetime) -> Path:
    RAW_HTML_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"most_subscribed_youtube_channels_{scraped_at.strftime('%Y%m%dT%H%M%SZ')}.html"
    path = RAW_HTML_DIR / filename
    path.write_text(html, encoding="utf-8")
    return path


def run() -> Path:
    """Fetch the target page (after a robots.txt check) and cache it to disk."""
    check_robots_txt(TARGET_URL)

    # self-imposed rate limit: pause before every request, even the first,
    # so back-to-back manual runs never hammer the site.
    time.sleep(REQUEST_DELAY_SECONDS)

    html = fetch_with_retry(TARGET_URL)
    scraped_at = datetime.now(timezone.utc)
    path = save_raw_html(html, scraped_at)
    print(f"[extract] saved raw HTML ({len(html):,} bytes) to {path}")
    return path


if __name__ == "__main__":
    run()
