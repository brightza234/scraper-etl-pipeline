# Scraper + ETL Pipeline

A self-written scraper (no official API) feeding a scheduled ETL pipeline into SQLite, with a
Next.js dashboard on top. Target: Wikipedia's [List of most-subscribed YouTube
channels](https://en.wikipedia.org/wiki/List_of_most-subscribed_YouTube_channels).

## What this project demonstrates

The other projects in this portfolio all pull data through official APIs or ready-made datasets
(YouTube Data API, NewsAPI, Kaggle, pytrends). This one closes that gap: if the platform you
actually need data from one day doesn't have an API — some social-listening tool, an internal
portal, a competitor's public page — you still need to be able to write the scraper yourself,
responsibly. That's what this project is: the scraping, not the analysis, is the point.

**Target selection was deliberate.** Wikipedia was chosen specifically *because* its content is
released under a permissive license (CC BY-SA) with no meaningful ToS risk, unlike commercial
sites (LinkedIn, JobsDB, Indeed) that explicitly prohibit scraping in their terms — the risk isn't
worth a portfolio project. Picking the most-subscribed-channels list also ties back to the
[KOL influence scoring model](../2.kol-influence-scoring-model) project as a reference dataset.

## Scraping ethics (checked, not assumed)

- **robots.txt is checked at runtime**, not just read once by hand — [`scraper/extract.py`](scraper/extract.py)
  fetches and parses it with `urllib.robotparser` before every run and refuses to proceed if the
  target path is disallowed for our User-Agent.
- **Descriptive `User-Agent`** identifying the project and a contact email — no spoofing a browser
  to dodge detection (see [Wikipedia's User-Agent policy](https://foundation.wikimedia.org/wiki/Policy:User-Agent_policy)).
- **Self-imposed rate limiting** — a fixed delay before every request, run manually or on a daily
  schedule, never in a tight loop.
- **Retries with exponential backoff** on transient failures instead of hammering the server or
  crashing outright.
- **Raw HTML is cached** to `data/raw_html/` (gitignored) so re-parsing during development doesn't
  require re-fetching the page.

## Pipeline

```
scraper/extract.py    ─→  data/raw_html/*.html        (cached raw HTML)
        │
        ▼
scraper/transform.py  ─→  clean, typed records         (dates parsed, citations stripped,
        │                                                subscriber counts normalized, deduped)
        ▼
scraper/load.py        ─→  data/scraped.db (SQLite)     (one snapshot per run, keyed by
        │                                                 name + scraped_at → a time series)
        ▼
.github/workflows/scrape.yml runs this daily and commits the updated database back to the repo
        │
        ▼
Next.js dashboard reads data/scraped.db directly (better-sqlite3) — Overview + Trend pages
```

Run the whole thing with:

```bash
python -m scraper.run
```

### Why SQLite instead of a JSON file

Every other project in this portfolio stores its processed output as JSON. This one uses SQLite
on purpose — it's new ground: the data is inherently relational (one row per channel per scrape),
it needs to accumulate a time series across many runs without hand-rolling append-and-dedupe logic
on a JSON array, and it needs to be queried (`GROUP BY category`, `ORDER BY scraped_at`) rather
than just re-read wholesale on every page load.

### Parser resilience

[`scraper/transform.py`](scraper/transform.py) doesn't assume Wikipedia's markup stays put: it
locates the table via a heading anchor with a fallback selector if that heading is ever renamed,
checks element/column counts before indexing into them, and wraps each row in its own
try/except so one malformed row logs a warning and gets skipped instead of taking the whole run
down.

## Tech stack

- **Scraping**: Python, `requests`, `BeautifulSoup4`
- **Storage**: SQLite (`sqlite3`, stdlib)
- **Automation**: GitHub Actions, scheduled daily (`.github/workflows/scrape.yml`)
- **Dashboard**: Next.js (App Router) + TypeScript + Tailwind CSS + Recharts, reading SQLite via
  `better-sqlite3`
- **Deployment**: GitHub → Vercel

## Running it locally

```bash
pip install -r requirements.txt
python -m scraper.run     # extract -> transform -> load, populates data/scraped.db

npm install
npm run dev
```

## Limitations

- **One snapshot until the schedule accumulates more.** The Trend page needs multiple days of
  scraped history to plot anything; it shows an explicit "not enough data yet" state until then
  rather than a flat, meaningless line.
- **Wikipedia's list itself is crowdsourced**, not YouTube's own reporting — subscriber counts can
  lag real-world numbers by days to weeks, which is inherent to the source, not the pipeline.
