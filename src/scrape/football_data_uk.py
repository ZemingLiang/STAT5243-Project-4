"""Scraper for football-data.co.uk Premier League CSVs.

Per-season URLs follow the pattern:
    https://www.football-data.co.uk/mmz4281/<YYZZ>/E0.csv

where `YY` is the 2-digit start year and `ZZ` is the 2-digit end year, e.g.
    2000-01 -> 0001
    2010-11 -> 1011
    2020-21 -> 2021

Output: one DataFrame per season, also saved as Parquet under
`data/raw/football_data_uk/<season>.parquet`. Team names are harmonized
to canonical form on output (column: home_team / away_team).
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from src.scrape._http import cached_get
from src.team_harmonize import canonical_or_none

LOG = logging.getLogger(__name__)

BASE_URL = "https://www.football-data.co.uk/mmz4281"
RAW_DIR = Path("data/raw/football_data_uk")


def season_code(start_year: int) -> str:
    """E.g. 2000 -> '0001'; 2020 -> '2021'."""
    end = (start_year + 1) % 100
    return f"{start_year % 100:02d}{end:02d}"


def season_label(start_year: int) -> str:
    """E.g. 2000 -> '2000-01'; 2020 -> '2020-21'."""
    return f"{start_year}-{(start_year + 1) % 100:02d}"


def url_for(start_year: int) -> str:
    return f"{BASE_URL}/{season_code(start_year)}/E0.csv"


@dataclass
class FootballDataResult:
    season: str
    url: str
    n_matches: int
    df: pd.DataFrame


def fetch_season(start_year: int, *, use_cache: bool = True) -> FootballDataResult:
    """Download and parse a single season CSV. Harmonizes team names."""
    url = url_for(start_year)
    LOG.info("Fetching football-data.co.uk season %s from %s", season_label(start_year), url)
    resp = cached_get(url, use_cache=use_cache)
    resp.raise_for_status()
    # Some older seasons use Latin-1; pandas autodetects.
    df = pd.read_csv(io.StringIO(resp.text), encoding_errors="replace")
    df = _normalize(df, season=season_label(start_year))
    return FootballDataResult(
        season=season_label(start_year),
        url=url,
        n_matches=len(df),
        df=df,
    )


_RENAME = {
    "Date": "match_date",
    "HomeTeam": "home_team_raw",
    "AwayTeam": "away_team_raw",
    "FTHG": "home_goals",
    "FTAG": "away_goals",
    "FTR": "result",  # 'H' / 'D' / 'A'
    "HTHG": "home_goals_ht",
    "HTAG": "away_goals_ht",
    "HTR": "result_ht",
    "Referee": "referee",
    "HS": "home_shots",
    "AS": "away_shots",
    "HST": "home_shots_target",
    "AST": "away_shots_target",
    "HC": "home_corners",
    "AC": "away_corners",
    "HF": "home_fouls",
    "AF": "away_fouls",
    "HY": "home_yellows",
    "AY": "away_yellows",
    "HR": "home_reds",
    "AR": "away_reds",
    # Pinnacle closing odds (preferred); Bet365 is a backup.
    "PSCH": "odds_home_pinnacle_close",
    "PSCD": "odds_draw_pinnacle_close",
    "PSCA": "odds_away_pinnacle_close",
    "B365H": "odds_home_b365_close",
    "B365D": "odds_draw_b365_close",
    "B365A": "odds_away_b365_close",
    # Total goals 2.5 closing odds.
    "PC>2.5": "odds_over25_pinnacle_close",
    "PC<2.5": "odds_under25_pinnacle_close",
}


def _normalize(df: pd.DataFrame, season: str) -> pd.DataFrame:
    keep = {k: v for k, v in _RENAME.items() if k in df.columns}
    out = df.rename(columns=keep)[list(keep.values())].copy()
    # Try multiple date formats — football-data.co.uk has used both DD/MM/YY and DD/MM/YYYY.
    out["match_date"] = pd.to_datetime(out["match_date"], dayfirst=True, errors="coerce")
    out["season"] = season
    out["home_team"] = out["home_team_raw"].map(canonical_or_none)
    out["away_team"] = out["away_team_raw"].map(canonical_or_none)
    unmapped = out[out["home_team"].isna() | out["away_team"].isna()]
    if len(unmapped) > 0:
        bad = sorted(
            set(unmapped["home_team_raw"]).union(unmapped["away_team_raw"])
            - {t for t in out["home_team_raw"].dropna() if canonical_or_none(t)}
        )
        LOG.warning("Unmapped team names in %s: %s", season, bad)
    return out


def fetch_seasons(years: list[int], *, use_cache: bool = True) -> pd.DataFrame:
    """Fetch many seasons and concatenate. Also writes per-season parquets."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    pieces = []
    for y in years:
        result = fetch_season(y, use_cache=use_cache)
        out_path = RAW_DIR / f"{result.season}.parquet"
        result.df.to_parquet(out_path, index=False)
        LOG.info("Saved %d rows for season %s to %s", result.n_matches, result.season, out_path)
        pieces.append(result.df)
    return pd.concat(pieces, ignore_index=True)


def all_target_seasons() -> list[int]:
    """Default: 2000-01..2020-21 (21 seasons)."""
    return list(range(2000, 2021))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    df = fetch_seasons(all_target_seasons())
    print(f"Total matches across all seasons: {len(df)}")
    print(df.head())
