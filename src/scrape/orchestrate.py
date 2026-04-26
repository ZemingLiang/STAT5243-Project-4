"""Run every scraper in a single command. Idempotent and cache-aware.

Typical invocation:
    python -m src.scrape.orchestrate --cached         # uses on-disk cache
    python -m src.scrape.orchestrate --refresh        # bypasses cache
    python -m src.scrape.orchestrate --only football_data,club_elo

After a fresh run, `data/raw/` contains:
    football_data_uk/<season>.parquet
    club_elo/<club>.parquet
    fbref/{schedule,match_stats}.parquet
    wikipedia/<season>_*.parquet, *.txt
    match_reports/bbc/<season>/<id>.html
    match_reports/guardian/<season>/<slug>.html
"""

from __future__ import annotations

import argparse
import logging
import time

from src.scrape import (
    bbc_match_reports,
    club_elo,
    fbref,
    football_data_uk,
    guardian_match_reports,
    wikipedia,
)

LOG = logging.getLogger("orchestrate")

ALL_SOURCES = ["football_data", "club_elo", "wikipedia", "fbref", "bbc", "guardian"]


def _run_step(name: str, fn, *args, **kwargs) -> None:
    t0 = time.monotonic()
    LOG.info("=== %s START ===", name)
    try:
        fn(*args, **kwargs)
        LOG.info("=== %s DONE (%.1fs) ===", name, time.monotonic() - t0)
    except Exception as exc:
        LOG.error("=== %s FAILED: %s ===", name, exc)


def main(only: list[str] | None = None, use_cache: bool = True) -> None:
    sources = only or ALL_SOURCES
    if "football_data" in sources:
        _run_step(
            "football-data.co.uk",
            football_data_uk.fetch_seasons,
            football_data_uk.all_target_seasons(),
            use_cache=use_cache,
        )
    if "club_elo" in sources:
        _run_step("ClubElo", club_elo.fetch_all_target_clubs, use_cache=use_cache)
    if "wikipedia" in sources:
        for y in range(2000, 2021):
            _run_step(
                f"Wikipedia {y}",
                wikipedia.fetch_season,
                y,
                use_cache=use_cache,
            )
    if "fbref" in sources:
        _run_step(
            "FBref (soccerdata)",
            fbref.fetch_seasons,
            fbref.all_target_seasons(),
            use_cache=use_cache,
        )
    if "bbc" in sources:
        _run_step(
            "BBC match reports",
            bbc_match_reports.crawl_year_month_range,
            2000,
            2021,
            use_cache=use_cache,
        )
    if "guardian" in sources:
        _run_step(
            "Guardian match reports (fallback)",
            guardian_match_reports.crawl_year_month_range,
            2000,
            2021,
            use_cache=use_cache,
        )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    parser = argparse.ArgumentParser()
    parser.add_argument("--cached", action="store_true", help="use on-disk cache (default)")
    parser.add_argument("--refresh", action="store_true", help="bypass cache; re-fetch everything")
    parser.add_argument("--only", help="comma-separated subset of: " + ",".join(ALL_SOURCES))
    args = parser.parse_args()
    main(
        only=args.only.split(",") if args.only else None,
        use_cache=not args.refresh,
    )
