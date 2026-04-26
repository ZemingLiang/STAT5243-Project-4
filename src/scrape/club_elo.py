"""Scraper for clubelo.com per-club historical Elo ratings.

ClubElo's API returns CSVs at:
    http://api.clubelo.com/<ClubNameNoSpaces>

with columns: Club, Country, Level, From, To, Elo
where each row is a half-week interval over which the team held that Elo.

We fetch every EPL team that played 2000-01..2020-21, then expand the
half-week intervals into a daily series (forward-fill) so we can join to
matches by `(team, match_date)`.
"""

from __future__ import annotations

import io
import logging
from pathlib import Path

import pandas as pd

from src.scrape._http import cached_get
from src.team_harmonize import all_canonical_teams

LOG = logging.getLogger(__name__)

BASE_URL = "http://api.clubelo.com"
RAW_DIR = Path("data/raw/club_elo")

# Canonical name -> ClubElo URL slug.
_CANONICAL_TO_SLUG = {
    "Arsenal": "Arsenal",
    "Aston Villa": "AstonVilla",
    "Birmingham City": "Birmingham",
    "Blackburn Rovers": "Blackburn",
    "Blackpool": "Blackpool",
    "Bolton Wanderers": "Bolton",
    "AFC Bournemouth": "Bournemouth",
    "Bradford City": "Bradford",
    "Brighton & Hove Albion": "Brighton",
    "Burnley": "Burnley",
    "Cardiff City": "Cardiff",
    "Charlton Athletic": "Charlton",
    "Chelsea": "Chelsea",
    "Coventry City": "Coventry",
    "Crystal Palace": "CrystalPalace",
    "Derby County": "Derby",
    "Everton": "Everton",
    "Fulham": "Fulham",
    "Huddersfield Town": "Huddersfield",
    "Hull City": "Hull",
    "Ipswich Town": "Ipswich",
    "Leeds United": "Leeds",
    "Leicester City": "Leicester",
    "Liverpool": "Liverpool",
    "Manchester City": "ManCity",
    "Manchester United": "ManUnited",
    "Middlesbrough": "Middlesbrough",
    "Newcastle United": "Newcastle",
    "Norwich City": "Norwich",
    "Nottingham Forest": "Forest",
    "Portsmouth": "Portsmouth",
    "Queens Park Rangers": "QPR",
    "Reading": "Reading",
    "Sheffield United": "SheffieldUnited",
    "Sheffield Wednesday": "SheffieldWeds",
    "Southampton": "Southampton",
    "Stoke City": "Stoke",
    "Sunderland": "Sunderland",
    "Swansea City": "Swansea",
    "Tottenham Hotspur": "Tottenham",
    "Watford": "Watford",
    "West Bromwich Albion": "WestBrom",
    "West Ham United": "WestHam",
    "Wigan Athletic": "Wigan",
    "Wolverhampton Wanderers": "Wolves",
}


def fetch_club(canonical_name: str, *, use_cache: bool = True) -> pd.DataFrame:
    """Return ClubElo's full historical CSV for one club, with `team` column added."""
    slug = _CANONICAL_TO_SLUG.get(canonical_name)
    if not slug:
        raise KeyError(f"No ClubElo slug for canonical team: {canonical_name}")
    url = f"{BASE_URL}/{slug}"
    LOG.info("Fetching ClubElo for %s -> %s", canonical_name, url)
    resp = cached_get(url, use_cache=use_cache)
    resp.raise_for_status()
    df = pd.read_csv(io.StringIO(resp.text))
    df["team"] = canonical_name
    df["From"] = pd.to_datetime(df["From"])
    df["To"] = pd.to_datetime(df["To"])
    return df


def fetch_all_target_clubs(*, use_cache: bool = True) -> pd.DataFrame:
    """Fetch every team in `all_canonical_teams()`, save per-club CSV, return concat."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    pieces = []
    for team in all_canonical_teams():
        try:
            df = fetch_club(team, use_cache=use_cache)
            df.to_parquet(RAW_DIR / f"{_CANONICAL_TO_SLUG[team]}.parquet", index=False)
            pieces.append(df)
        except Exception as exc:
            LOG.warning("ClubElo fetch failed for %s: %s", team, exc)
    return pd.concat(pieces, ignore_index=True) if pieces else pd.DataFrame()


def to_daily(df: pd.DataFrame) -> pd.DataFrame:
    """Expand half-week intervals to a daily series for easy date joins.

    Output columns: team, date, elo, level.
    """
    rows = []
    for _, row in df.iterrows():
        days = pd.date_range(row["From"], row["To"], freq="D")
        for d in days:
            rows.append({
                "team": row["team"],
                "date": d,
                "elo": row["Elo"],
                "level": row.get("Level"),
            })
    return pd.DataFrame(rows)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    df = fetch_all_target_clubs()
    print(f"Total ClubElo rows: {len(df)} for {df['team'].nunique()} teams")
    print(df.head())
