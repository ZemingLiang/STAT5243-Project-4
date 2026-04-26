"""Fallback scraper for The Guardian Premier League match reports.

Used when BBC has no report for a match (mostly older seasons 2000-03).

Discovery strategy
------------------
Guardian's per-month football archive lives at:
    https://www.theguardian.com/football/premierleague/<YYYY>/<MMM>
where MMM is a lowercase 3-letter month (e.g. 'aug', 'sep').

Each link with the path pattern
    /football/<YYYY>/MMM/DD/<slug>
is a per-match story. We don't filter by report-vs-news — let the NLP layer
decide based on content shape (presence of scoreline, team mentions).

Files persist to:
    data/raw/match_reports/guardian/<season>/<slug>.html
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

from bs4 import BeautifulSoup

from src.scrape._http import cached_get

LOG = logging.getLogger(__name__)
RAW_DIR = Path("data/raw/match_reports/guardian")

ARCHIVE_TEMPLATE = (
    "https://www.theguardian.com/football/premierleague/{year:04d}/{month_abbr}"
)
ARTICLE_URL_RE = re.compile(r"^https://www\.theguardian\.com/football/\d{4}/[a-z]{3}/\d{2}/[a-z0-9-]+$")
MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]


def discover_match_links(year: int, month: int, *, use_cache: bool = True) -> list[str]:
    url = ARCHIVE_TEMPLATE.format(year=year, month_abbr=MONTH_NAMES[month - 1])
    LOG.info("Discovering Guardian links for %04d-%02d", year, month)
    try:
        resp = cached_get(url, use_cache=use_cache)
        resp.raise_for_status()
    except Exception as exc:
        LOG.warning("Guardian archive fetch failed for %04d-%02d: %s", year, month, exc)
        return []
    soup = BeautifulSoup(resp.text, "lxml")
    found: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if ARTICLE_URL_RE.match(href):
            found.add(href)
    return sorted(found)


def season_label(date_year: int, date_month: int) -> str:
    if date_month >= 7:
        return f"{date_year}-{(date_year + 1) % 100:02d}"
    return f"{date_year - 1}-{date_year % 100:02d}"


def fetch_article(url: str, *, season: str, use_cache: bool = True) -> Path | None:
    slug = url.rstrip("/").rsplit("/", 1)[-1]
    out_dir = RAW_DIR / season
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{slug}.html"
    if out_path.exists():
        return out_path
    try:
        resp = cached_get(url, use_cache=use_cache)
        resp.raise_for_status()
    except Exception as exc:
        LOG.warning("Guardian article fetch failed for %s: %s", url, exc)
        return None
    out_path.write_text(resp.text, encoding="utf-8")
    return out_path


def crawl_year_month_range(start_year: int, end_year: int, *, use_cache: bool = True) -> int:
    fetched = 0
    for year in range(start_year, end_year + 1):
        for month in range(1, 13):
            # Only football months for the EPL window (Aug-May spans season boundary).
            if year == start_year and month < 8:
                continue
            if year == end_year and month > 5:
                continue
            links = discover_match_links(year, month, use_cache=use_cache)
            if not links:
                continue
            season = season_label(year, month)
            for url in links:
                if fetch_article(url, season=season, use_cache=use_cache):
                    fetched += 1
    return fetched


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    n = crawl_year_month_range(2000, 2021)
    print(f"Guardian: fetched {n} articles total")
