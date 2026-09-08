"""Transform step: parse cached raw HTML into clean, typed records.

Written to be resilient to minor Wikipedia markup changes: every row is parsed
inside its own try/except so one malformed row doesn't take down the whole
run, and every element lookup is checked before use instead of assumed.
"""

from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup, Tag

HEADING_ID = "100_most-subscribed_channels"
EXPECTED_COLUMN_COUNT = 7
# Wikipedia lists subscriber counts as "millions", e.g. 516 -> 516,000,000.
SUBSCRIBERS_UNIT_MULTIPLIER = 1_000_000

DATE_FORMATS = ["%B %d, %Y", "%b %d, %Y", "%B %Y", "%b %Y", "%Y"]


def _strip_citations(cell: Tag) -> str:
    """Remove Wikipedia's [1]-style reference superscripts, then return clean text."""
    for ref in cell.find_all("sup", class_="reference"):
        ref.decompose()
    return cell.get_text(" ", strip=True)


def _find_target_table(soup: BeautifulSoup) -> Tag:
    heading = soup.find(id=HEADING_ID)
    if heading is not None:
        table = heading.find_next("table", class_="wikitable")
        if table is not None:
            return table

    # Fallback if Wikipedia renames the section heading: take the first
    # sortable wikitable on the page, which is the main ranking table.
    print(
        f"[transform] heading #{HEADING_ID} not found, falling back to first "
        "sortable wikitable",
        file=sys.stderr,
    )
    table = soup.find("table", class_=["wikitable", "sortable"])
    if table is None:
        raise ValueError("could not locate the ranking table in the page HTML")
    return table


def parse_subscribers(text: str) -> float | None:
    match = re.search(r"[\d,.]+", text)
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", ""))
    except ValueError:
        return None


def parse_joined_date(text: str) -> str | None:
    text = text.strip()
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(text, fmt)
            return dt.date().isoformat()
        except ValueError:
            continue
    return None


def _parse_row(row: Tag, rank: int) -> dict[str, Any] | None:
    cells = row.find_all(["td", "th"])
    if len(cells) != EXPECTED_COLUMN_COUNT:
        return None  # footer / summary rows ("As of ...") don't match the schema

    name_cell, link_cell, subs_cell, lang_cell, category_cell, joined_cell, country_cell = cells

    name_link = name_cell.find("a")
    name = _strip_citations(name_cell)
    wikipedia_url = None
    if name_link is not None and name_link.get("href"):
        wikipedia_url = "https://en.wikipedia.org" + name_link["href"] if name_link["href"].startswith("/") else name_link["href"]

    youtube_link = link_cell.find("a", class_="external")
    youtube_url = youtube_link["href"] if youtube_link is not None and youtube_link.get("href") else None

    subscribers_raw = _strip_citations(subs_cell)
    joined_raw = _strip_citations(joined_cell)
    subscribers_millions = parse_subscribers(subscribers_raw)
    subscribers = (
        int(round(subscribers_millions * SUBSCRIBERS_UNIT_MULTIPLIER))
        if subscribers_millions is not None
        else None
    )

    return {
        "rank": rank,
        "name": name,
        "wikipedia_url": wikipedia_url,
        "youtube_url": youtube_url,
        "subscribers_millions": subscribers_millions,
        "subscribers": subscribers,
        "primary_language": _strip_citations(lang_cell) or None,
        "category": _strip_citations(category_cell) or None,
        "joined_youtube_raw": joined_raw or None,
        "joined_youtube": parse_joined_date(joined_raw),
        "country": _strip_citations(country_cell) or None,
    }


def parse_html(html: str) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    table = _find_target_table(soup)
    rows = table.find_all("tr")

    records: list[dict[str, Any]] = []
    rank = 0
    for row in rows[1:]:  # skip header row
        try:
            record = _parse_row(row, rank + 1)
        except Exception as exc:  # noqa: BLE001 - one bad row shouldn't kill the run
            print(f"[transform] skipping unparseable row: {exc}", file=sys.stderr)
            continue

        if record is None:
            continue
        if not record["name"]:
            continue

        rank += 1
        records.append(record)

    return dedupe_by_name(records)


def dedupe_by_name(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for record in records:
        key = record["name"].strip().lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(record)
    return unique


def run(html_path: Path) -> list[dict[str, Any]]:
    html = html_path.read_text(encoding="utf-8")
    records = parse_html(html)
    print(f"[transform] parsed {len(records)} clean records from {html_path.name}")
    return records


if __name__ == "__main__":
    from scraper.config import RAW_HTML_DIR

    latest = max(RAW_HTML_DIR.glob("*.html"), key=lambda p: p.stat().st_mtime, default=None)
    if latest is None:
        raise SystemExit("No cached raw HTML found. Run scraper/extract.py first.")
    run(latest)
