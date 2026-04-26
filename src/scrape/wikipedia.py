"""Scraper for Wikipedia EPL season pages.

Pulls per-season articles like:
    https://en.wikipedia.org/wiki/2000%E2%80%9301_FA_Premier_League
    https://en.wikipedia.org/wiki/2020%E2%80%9321_Premier_League

Extracts:
- Final league table (position, P, W, D, L, GF, GA, GD, Pts, qualification)
- Manager changes (table of in-season managerial replacements)
- Top scorers
- Free-text: a few paragraphs of season recap (for narrative-feature exploration)

The 'unstructured' value is highest in the prose paragraphs and the manager
table cells (which mix dates + reasons + names).

Note: this scraper uses both `pandas.read_html` (for tables) and BeautifulSoup
(for prose). Polite rate-limited via the shared `_http.cached_get` helper.
"""

from __future__ import annotations

import io
import logging
import re
from pathlib import Path
from typing import Any

import pandas as pd
from bs4 import BeautifulSoup

from src.scrape._http import cached_get

LOG = logging.getLogger(__name__)
RAW_DIR = Path("data/raw/wikipedia")


def season_url(start_year: int) -> str:
    end = (start_year + 1) % 100
    # Older seasons are 'FA Premier League'; from 2007-08 onwards, just 'Premier League'.
    title_word = "FA_Premier_League" if start_year < 2007 else "Premier_League"
    return f"https://en.wikipedia.org/wiki/{start_year}%E2%80%93{end:02d}_{title_word}"


def fetch_season_html(start_year: int, *, use_cache: bool = True) -> str:
    url = season_url(start_year)
    LOG.info("Fetching Wikipedia season %d-%02d from %s", start_year, (start_year + 1) % 100, url)
    resp = cached_get(url, use_cache=use_cache)
    resp.raise_for_status()
    return resp.text


def parse_tables(html: str) -> dict[str, pd.DataFrame]:
    """Pull all tables from the page; return a dict keyed by inferred role.

    Heuristic: a table with columns including ('Pos', 'Pld', 'Pts') is the league
    table; one with 'Player' + 'Goals' is top scorers; one with 'Outgoing manager'
    is the manager-change table.
    """
    tables = pd.read_html(io.StringIO(html))
    out: dict[str, pd.DataFrame] = {}
    for i, t in enumerate(tables):
        cols = {str(c).lower() for c in t.columns}
        if {"pos", "pld", "pts"}.issubset(cols) or {"position", "p", "pts"}.issubset(cols):
            out.setdefault("league_table", t)
        elif "player" in cols and ("goals" in cols or "goal" in cols):
            out.setdefault("top_scorers", t)
        elif any("manager" in c for c in cols):
            out.setdefault("manager_changes", t)
        else:
            out[f"misc_table_{i}"] = t
    return out


def parse_recap_paragraphs(html: str, max_paragraphs: int = 5) -> list[str]:
    """Pull the first N substantive paragraphs of the article body."""
    soup = BeautifulSoup(html, "lxml")
    body = soup.find("div", {"class": "mw-parser-output"})
    if body is None:
        return []
    paragraphs: list[str] = []
    for p in body.find_all("p", recursive=False):
        text = p.get_text(" ", strip=True)
        if len(text) > 80:  # skip stub paragraphs
            paragraphs.append(text)
        if len(paragraphs) >= max_paragraphs:
            break
    return paragraphs


def fetch_season(start_year: int, *, use_cache: bool = True) -> dict[str, Any]:
    html = fetch_season_html(start_year, use_cache=use_cache)
    tables = parse_tables(html)
    paragraphs = parse_recap_paragraphs(html)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    season_label = f"{start_year}-{(start_year + 1) % 100:02d}"
    # Persist each table and the prose for downstream NLP.
    for name, t in tables.items():
        t.to_parquet(RAW_DIR / f"{season_label}_{name}.parquet", index=False)
    (RAW_DIR / f"{season_label}_recap.txt").write_text("\n\n".join(paragraphs), encoding="utf-8")
    return {"season": season_label, "tables": tables, "paragraphs": paragraphs}


def fetch_all_seasons(years: list[int], *, use_cache: bool = True) -> list[dict[str, Any]]:
    return [fetch_season(y, use_cache=use_cache) for y in years]


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    for year in range(2000, 2021):
        try:
            r = fetch_season(year)
            print(f"{r['season']}: {len(r['tables'])} tables, {len(r['paragraphs'])} paragraphs")
        except Exception as exc:
            LOG.warning("Wikipedia fetch failed for %d: %s", year, exc)
