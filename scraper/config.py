"""Shared config for the scraper: target page, request headers, rate limiting."""

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

TARGET_URL = "https://en.wikipedia.org/wiki/List_of_most-subscribed_YouTube_channels"
TARGET_TABLE_CAPTION_HINT = "100+ million subscribers"

# Wikipedia asks bots to identify themselves with a descriptive User-Agent that
# includes contact info, rather than spoofing a real browser to dodge detection.
# See https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy
USER_AGENT = (
    "scraper-etl-pipeline-portfolio-project/1.0 "
    "(https://github.com/brightza234/scraper-etl-pipeline; contact: bright.jirayu@gmail.com) "
    "python-requests"
)
REQUEST_HEADERS = {"User-Agent": USER_AGENT}

REQUEST_TIMEOUT_SECONDS = 15
REQUEST_DELAY_SECONDS = 2.0  # self-imposed pause between requests
MAX_RETRIES = 3
BACKOFF_BASE_SECONDS = 2.0  # retry N waits BACKOFF_BASE_SECONDS * 2**(N-1)

RAW_HTML_DIR = PROJECT_ROOT / "data" / "raw_html"
DB_PATH = PROJECT_ROOT / "data" / "scraped.db"
