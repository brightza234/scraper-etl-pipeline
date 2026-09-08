"""Orchestrates the full extract -> transform -> load pipeline.

Usage: python -m scraper.run
"""

from __future__ import annotations

from datetime import datetime, timezone

from scraper import extract, load, transform
from scraper.config import TARGET_URL


def main() -> None:
    scraped_at = datetime.now(timezone.utc).isoformat()

    raw_html_path = extract.run()
    records = transform.run(raw_html_path)

    if not records:
        raise SystemExit("[run] transform produced zero records — aborting load")

    load.run(records, source_url=TARGET_URL, scraped_at=scraped_at)


if __name__ == "__main__":
    main()
