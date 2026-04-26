"""FBref / Sports Reference scraper.

Uses the `soccerdata` Python package for FBref because it handles:
- Anti-scrape headers (we hit 403 directly; soccerdata uses cloudscraper).
- The 3-second-per-page rate limit FBref documents.
- On-disk caching keyed by season + stat type.

Pulls match-level advanced stats (xG, shots, possession) where available.
xG coverage starts in 2017-18; older seasons get only the basic match table
from FBref's earlier coverage.
"""

from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd

from src.team_harmonize import canonical_or_none

LOG = logging.getLogger(__name__)
RAW_DIR = Path("data/raw/fbref")
SOCCERDATA_CACHE = Path(".soccerdata_cache")


def _seasons_argument(years: list[int]) -> list[str]:
    """soccerdata expects season strings like '2020-2021'."""
    return [f"{y}-{y + 1}" for y in years]


def fetch_seasons(years: list[int], *, use_cache: bool = True) -> pd.DataFrame:
    """Pull match-level schedule + match stats for each season, return concatenated."""
    try:
        import soccerdata as sd
    except ImportError as exc:
        raise ImportError(
            "soccerdata is required for FBref scraping; pip install soccerdata"
        ) from exc

    RAW_DIR.mkdir(parents=True, exist_ok=True)
    SOCCERDATA_CACHE.mkdir(parents=True, exist_ok=True)
    seasons = _seasons_argument(years)
    LOG.info("FBref: pulling seasons %s", seasons)

    fb = sd.FBref(
        leagues="ENG-Premier League",
        seasons=seasons,
        no_cache=not use_cache,
        data_dir=str(SOCCERDATA_CACHE),
    )

    # Schedule: per-match row with date, teams, score (basic).
    schedule = fb.read_schedule()
    schedule = schedule.reset_index()
    LOG.info("FBref schedule: %d matches", len(schedule))

    # Match stats: per-match advanced stats (xG, possession, etc.) where available.
    try:
        match_stats = fb.read_team_match_stats(stat_type="schedule")
        match_stats = match_stats.reset_index()
        LOG.info("FBref match_stats: %d rows", len(match_stats))
    except Exception as exc:
        LOG.warning("FBref match_stats fetch failed (older seasons may not have advanced stats): %s", exc)
        match_stats = pd.DataFrame()

    # Save raw frames.
    schedule.to_parquet(RAW_DIR / "schedule.parquet", index=False)
    if not match_stats.empty:
        match_stats.to_parquet(RAW_DIR / "match_stats.parquet", index=False)

    # Harmonize team names on the schedule for downstream joining.
    if "home_team" in schedule.columns:
        schedule["home_team_raw"] = schedule["home_team"]
        schedule["away_team_raw"] = schedule["away_team"]
        schedule["home_team"] = schedule["home_team"].map(canonical_or_none)
        schedule["away_team"] = schedule["away_team"].map(canonical_or_none)

    return schedule


def fetch_xg_per_match(years: list[int], *, use_cache: bool = True) -> pd.DataFrame:
    """Pull per-team xG totals for each match (starting 2017-18 generally).

    Returns rows like (date, home_team, away_team, home_xg, away_xg).
    Older seasons may return empty / NaN columns; that is documented as a
    data quality challenge in the report.
    """
    try:
        import soccerdata as sd
    except ImportError as exc:
        raise ImportError("soccerdata required") from exc

    SOCCERDATA_CACHE.mkdir(parents=True, exist_ok=True)
    fb = sd.FBref(
        leagues="ENG-Premier League",
        seasons=_seasons_argument(years),
        no_cache=not use_cache,
        data_dir=str(SOCCERDATA_CACHE),
    )
    try:
        df = fb.read_team_match_stats(stat_type="schedule").reset_index()
    except Exception as exc:
        LOG.warning("xG fetch failed: %s", exc)
        return pd.DataFrame()

    if df.empty:
        return df

    # Schedule sometimes returns columns ['date','home_team','away_team','xG_home','xG_away']
    # depending on the soccerdata version; normalize.
    rename_map = {}
    for c in df.columns:
        cl = str(c).lower()
        if cl in {"xg_home", "home_xg", "xg"}:
            rename_map[c] = "home_xg"
        elif cl in {"xg_away", "away_xg"}:
            rename_map[c] = "away_xg"
    return df.rename(columns=rename_map)


def all_target_seasons() -> list[int]:
    return list(range(2000, 2021))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    df = fetch_seasons(all_target_seasons())
    print(f"FBref schedule: {len(df)} matches across {df.get('season', pd.Series()).nunique()} seasons")
    print(df.head())
