"""Scraper for BBC Sport Premier League match reports.

This is the **unstructured** data source for the project. The cleaning
pipeline (in `src/nlp/`) turns the raw HTML article body into structured
features (entities, sentiment, key-event tags).

Discovery strategy
------------------
BBC has a per-month results page:
    https://www.bbc.co.uk/sport/football/premier-league/scores-fixtures/<YYYY-MM>

Each match links to a per-match report at:
    https://www.bbc.co.uk/sport/football/<match-id>

We crawl each month between 2000-08 and 2021-05, collect the links from the
results page, then fetch each report HTML and persist it to:
    data/raw/match_reports/<season>/<match-id>.html

For matches BBC doesn't have a report for, we leave a `*.miss` marker so the
fallback `guardian_match_reports.py` knows to try the Guardian.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

from bs4 import BeautifulSoup

from src.scrape._http import cached_get

LOG = logging.getLogger(__name__)
RAW_DIR = Path("data/raw/match_reports/bbc")

MONTH_PAGE_TEMPLATE = (
    "https://www.bbc.co.uk/sport/football/premier-league/scores-fixtures/{year:04d}-{month:02d}"
)
MATCH_URL_RE = re.compile(r"^/sport/football/(\d{6,})$")


def season_label(date_year: int, date_month: int) -> str:
    """A match in Aug-Dec belongs to the season starting that year; Jan-May = previous year."""
    if date_month >= 7:
        return f"{date_year}-{(date_year + 1) % 100:02d}"
    return f"{date_year - 1}-{date_year % 100:02d}"


def discover_match_links(year: int, month: int, *, use_cache: bool = True) -> list[str]:
    """Return the list of `/sport/football/<id>` links found on the per-month page."""
    url = MONTH_PAGE_TEMPLATE.format(year=year, month=month)
    LOG.info("Discovering BBC match links for %04d-%02d", year, month)
    try:
        resp = cached_get(url, use_cache=use_cache)
        resp.raise_for_status()
    except Exception as exc:
        LOG.warning("BBC month page fetch failed for %04d-%02d: %s", year, month, exc)
        return []
    soup = BeautifulSoup(resp.text, "lxml")
    found: set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        m = MATCH_URL_RE.match(href)
        if m:
            found.add(href)
    return sorted(found)


def fetch_match_report(href: str, *, season: str, use_cache: bool = True) -> Path | None:
    """Fetch one match report HTML and persist verbatim. Returns the saved path or None."""
    full_url = f"https://www.bbc.co.uk{href}"
    match_id = href.rsplit("/", 1)[-1]
    out_dir = RAW_DIR / season
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{match_id}.html"
    if out_path.exists():
        return out_path
    try:
        resp = cached_get(full_url, use_cache=use_cache)
        resp.raise_for_status()
    except Exception as exc:
        LOG.warning("BBC report fetch failed for %s: %s", full_url, exc)
        out_path.with_suffix(".miss").write_text(str(exc), encoding="utf-8")
        return None
    out_path.write_text(resp.text, encoding="utf-8")
    return out_path


def crawl_year_month_range(start_year: int, end_year: int, *, use_cache: bool = True) -> int:
    """Crawl every month between start_year-Aug and end_year-May. Returns count fetched."""
    fetched = 0
    for year in range(start_year, end_year + 1):
        # An EPL season runs Aug-May; only fetch months that could contain matches.
        months = list(range(8, 13)) if year < end_year else list(range(1, 6))
        if year == start_year:
            months = list(range(8, 13))
        elif year == end_year:
            months = list(range(1, 6))
        else:
            months = list(range(1, 13))
        for month in months:
            links = discover_match_links(year, month, use_cache=use_cache)
            if not links:
                continue
            season = season_label(year, month)
            for href in links:
                if fetch_match_report(href, season=season, use_cache=use_cache):
                    fetched += 1
    return fetched


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    n = crawl_year_month_range(2000, 2021)
    print(f"BBC: fetched {n} match reports total")
