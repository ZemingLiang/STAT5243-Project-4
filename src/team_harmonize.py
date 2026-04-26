"""Canonical English Premier League team-name harmonization.

Every scraper outputs team names in its source's native style. To join sources
(football-data.co.uk uses "Man United", FBref uses "Manchester Utd", BBC writes
"Manchester United", ClubElo uses "Man United", Wikipedia uses "Manchester
United F.C.") we normalise everything to a canonical name on ingestion.

Canonical names match the **Wikipedia article title minus the F.C. suffix**,
e.g., "Manchester United", "Tottenham Hotspur", "West Bromwich Albion".

If a new variant shows up that's not in `_VARIANT_TO_CANONICAL`, `canonical()`
raises `UnknownTeamError` so the bug surfaces immediately rather than silently
mis-joining rows. To add a team, append to `_TEAM_VARIANTS`.

Coverage: all teams that played in the EPL between seasons 2000-01 and 2020-21
(inclusive). Verified against the season-by-season EPL Wikipedia tables.
"""

from __future__ import annotations

from typing import Iterable


class UnknownTeamError(KeyError):
    """Raised when a team name has no canonical mapping."""


# Canonical name -> tuple of every spelling variant we've seen across sources.
# Variants are matched case-insensitively after stripping whitespace and "F.C." suffixes.
_TEAM_VARIANTS: dict[str, tuple[str, ...]] = {
    "Arsenal": ("Arsenal", "Arsenal FC"),
    "Aston Villa": ("Aston Villa", "Villa"),
    "Birmingham City": ("Birmingham", "Birmingham City"),
    "Blackburn Rovers": ("Blackburn", "Blackburn Rovers"),
    "Blackpool": ("Blackpool",),
    "Bolton Wanderers": ("Bolton", "Bolton Wanderers"),
    "AFC Bournemouth": ("Bournemouth", "AFC Bournemouth"),
    "Bradford City": ("Bradford", "Bradford City"),
    "Brighton & Hove Albion": (
        "Brighton",
        "Brighton & Hove Albion",
        "Brighton and Hove Albion",
    ),
    "Burnley": ("Burnley",),
    "Cardiff City": ("Cardiff", "Cardiff City"),
    "Charlton Athletic": ("Charlton", "Charlton Athletic"),
    "Chelsea": ("Chelsea",),
    "Coventry City": ("Coventry", "Coventry City"),
    "Crystal Palace": ("Crystal Palace", "C Palace"),
    "Derby County": ("Derby", "Derby County"),
    "Everton": ("Everton",),
    "Fulham": ("Fulham",),
    "Huddersfield Town": ("Huddersfield", "Huddersfield Town"),
    "Hull City": ("Hull", "Hull City"),
    "Ipswich Town": ("Ipswich", "Ipswich Town"),
    "Leeds United": ("Leeds", "Leeds United", "Leeds Utd"),
    "Leicester City": ("Leicester", "Leicester City"),
    "Liverpool": ("Liverpool",),
    "Manchester City": ("Man City", "Manchester City"),
    "Manchester United": (
        "Man United",
        "Man Utd",
        "Manchester United",
        "Manchester Utd",
    ),
    "Middlesbrough": ("Middlesbrough", "Middlesboro"),
    "Newcastle United": ("Newcastle", "Newcastle United", "Newcastle Utd"),
    "Norwich City": ("Norwich", "Norwich City"),
    "Nottingham Forest": ("Nott'm Forest", "Nottingham Forest", "Nottm Forest"),
    "Portsmouth": ("Portsmouth",),
    "Queens Park Rangers": ("QPR", "Queens Park Rangers"),
    "Reading": ("Reading",),
    "Sheffield United": ("Sheffield United", "Sheffield Utd"),
    "Sheffield Wednesday": ("Sheffield Wednesday", "Sheffield Weds"),
    "Southampton": ("Southampton",),
    "Stoke City": ("Stoke", "Stoke City"),
    "Sunderland": ("Sunderland",),
    "Swansea City": ("Swansea", "Swansea City"),
    "Tottenham Hotspur": ("Tottenham", "Tottenham Hotspur", "Spurs"),
    "Watford": ("Watford",),
    "West Bromwich Albion": (
        "West Brom",
        "West Bromwich Albion",
        "WBA",
        "West Bromwich",
    ),
    "West Ham United": ("West Ham", "West Ham United", "West Ham Utd"),
    "Wigan Athletic": ("Wigan", "Wigan Athletic"),
    "Wolverhampton Wanderers": (
        "Wolves",
        "Wolverhampton",
        "Wolverhampton Wanderers",
        "Wolverhampton Wand",
    ),
}


def _normalize_token(name: str) -> str:
    """Lowercase, strip, remove trailing 'F.C.' / 'FC' suffix and punctuation."""
    tok = name.strip()
    for suffix in (" F.C.", " FC", " A.F.C.", " AFC"):
        if tok.endswith(suffix):
            tok = tok[: -len(suffix)]
    return tok.lower().replace(".", "").replace("'", "").strip()


# Build reverse map at import time.
_VARIANT_TO_CANONICAL: dict[str, str] = {}
for canonical, variants in _TEAM_VARIANTS.items():
    _VARIANT_TO_CANONICAL[_normalize_token(canonical)] = canonical
    for v in variants:
        _VARIANT_TO_CANONICAL[_normalize_token(v)] = canonical


def canonical(name: str) -> str:
    """Return the canonical EPL team name. Raises `UnknownTeamError` on miss."""
    key = _normalize_token(name)
    if key not in _VARIANT_TO_CANONICAL:
        raise UnknownTeamError(
            f"Unknown team variant: '{name}'. Add it to `_TEAM_VARIANTS` "
            "in src/team_harmonize.py and re-run."
        )
    return _VARIANT_TO_CANONICAL[key]


def canonical_or_none(name: str) -> str | None:
    """Return canonical name or None if unknown (for forgiving join paths)."""
    try:
        return canonical(name)
    except UnknownTeamError:
        return None


def all_canonical_teams() -> tuple[str, ...]:
    """Tuple of every canonical EPL team name we know about."""
    return tuple(_TEAM_VARIANTS.keys())


def add_variant(canonical_name: str, variant: str) -> None:
    """Register a new variant at runtime (mostly for ad-hoc fixes during scraping)."""
    if canonical_name not in _TEAM_VARIANTS:
        raise UnknownTeamError(
            f"Cannot add variant for unknown canonical name: {canonical_name}"
        )
    _VARIANT_TO_CANONICAL[_normalize_token(variant)] = canonical_name


def harmonize_iterable(names: Iterable[str]) -> list[str]:
    """Map every name in an iterable to its canonical form."""
    return [canonical(n) for n in names]
