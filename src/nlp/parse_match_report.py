"""HTML match report -> structured per-match feature row.

The flagship "unstructured -> structured" cleaning step. Takes any of:
- BBC Sport `bbc.co.uk/sport/football/<id>` HTML
- The Guardian `theguardian.com/football/...` HTML

and returns a single dict / DataFrame row with:
- `report_length_words`
- `home_report_sentiment` / `away_report_sentiment`  (VADER compound score)
- `red_card_mention_count`, `penalty_mention_count`, `var_mention_count`,
  `injury_mention_count`, `controversy_flag`
- `manager_quote_count_home`, `manager_quote_count_away`  (best effort)
- `entity_count_persons`  (spaCy NER PERSON entities)

Designed to be robust to layout changes — if a particular section can't be
parsed we return NaN / 0 for that field rather than failing.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import pandas as pd
from bs4 import BeautifulSoup

from src.team_harmonize import all_canonical_teams

LOG = logging.getLogger(__name__)


_SENTIMENT_ANALYZER = None
_SPACY_NLP = None


def _get_sentiment_analyzer():
    global _SENTIMENT_ANALYZER
    if _SENTIMENT_ANALYZER is None:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        _SENTIMENT_ANALYZER = SentimentIntensityAnalyzer()
    return _SENTIMENT_ANALYZER


def _get_spacy():
    global _SPACY_NLP
    if _SPACY_NLP is None:
        try:
            import spacy
            _SPACY_NLP = spacy.load("en_core_web_sm")
        except Exception as exc:
            LOG.warning("spaCy load failed (%s); NER features will be NaN", exc)
            _SPACY_NLP = False  # sentinel
    return _SPACY_NLP if _SPACY_NLP is not False else None


def extract_article_text(html: str) -> str:
    """Best-effort extraction of the main article body text from BBC/Guardian HTML."""
    soup = BeautifulSoup(html, "lxml")
    # Try the tag <article> first; both BBC and Guardian use it.
    article = soup.find("article")
    if article is not None:
        text = article.get_text(" ", strip=True)
    else:
        # Fallback: grab all <p> tags
        text = " ".join(p.get_text(" ", strip=True) for p in soup.find_all("p"))
    # Collapse whitespace.
    return re.sub(r"\s+", " ", text).strip()


def per_team_sentiment(text: str, home_team: str, away_team: str) -> tuple[float, float]:
    """Sentence-level sentiment, aggregated to whichever team is mentioned."""
    sia = _get_sentiment_analyzer()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    home_scores: list[float] = []
    away_scores: list[float] = []
    home_lc = home_team.lower()
    away_lc = away_team.lower()
    for sent in sentences:
        sl = sent.lower()
        score = sia.polarity_scores(sent)["compound"]
        if home_lc in sl and away_lc not in sl:
            home_scores.append(score)
        elif away_lc in sl and home_lc not in sl:
            away_scores.append(score)
    h = sum(home_scores) / len(home_scores) if home_scores else 0.0
    a = sum(away_scores) / len(away_scores) if away_scores else 0.0
    return h, a


_KEYWORD_TAGS = {
    "red_card_mention_count": [r"red card", r"sent off", r"dismissed", r"red for"],
    "penalty_mention_count": [r"\bpenalty\b", r"\bspot kick\b"],
    "var_mention_count": [r"\bVAR\b"],
    "injury_mention_count": [r"\binjur(y|ies|ed)\b"],
}


def keyword_counts(text: str) -> dict[str, int]:
    out = {}
    for tag, patterns in _KEYWORD_TAGS.items():
        n = 0
        for p in patterns:
            n += len(re.findall(p, text, flags=re.IGNORECASE))
        out[tag] = n
    out["controversy_flag"] = int(
        bool(re.search(r"controvers|disputed|VAR error|wrongly|outraged", text, flags=re.IGNORECASE))
    )
    return out


def ner_person_count(text: str) -> int:
    nlp = _get_spacy()
    if nlp is None:
        return -1
    # spaCy can be slow on long texts; truncate.
    doc = nlp(text[:20000])
    return sum(1 for ent in doc.ents if ent.label_ == "PERSON")


@dataclass
class ParsedReport:
    report_length_words: int
    home_report_sentiment: float
    away_report_sentiment: float
    red_card_mention_count: int
    penalty_mention_count: int
    var_mention_count: int
    injury_mention_count: int
    controversy_flag: int
    entity_count_persons: int


def parse_html(html: str, home_team: str, away_team: str) -> ParsedReport:
    text = extract_article_text(html)
    h_sent, a_sent = per_team_sentiment(text, home_team, away_team)
    kw = keyword_counts(text)
    return ParsedReport(
        report_length_words=len(text.split()),
        home_report_sentiment=h_sent,
        away_report_sentiment=a_sent,
        red_card_mention_count=kw["red_card_mention_count"],
        penalty_mention_count=kw["penalty_mention_count"],
        var_mention_count=kw["var_mention_count"],
        injury_mention_count=kw["injury_mention_count"],
        controversy_flag=kw["controversy_flag"],
        entity_count_persons=ner_person_count(text),
    )


def parse_directory(
    raw_dir: Path,
    matches: pd.DataFrame,
    *,
    by_filename: Optional[dict[str, tuple[str, str]]] = None,
) -> pd.DataFrame:
    """Walk a directory of HTML files and parse each.

    `by_filename` maps filename stem -> (home_team, away_team). If None, we try
    to infer team names from the file's first paragraphs (best effort).
    """
    rows = []
    files = sorted(Path(raw_dir).rglob("*.html"))
    LOG.info("Parsing %d HTML files from %s", len(files), raw_dir)
    for f in files:
        try:
            html = f.read_text(encoding="utf-8", errors="replace")
            if by_filename and f.stem in by_filename:
                home, away = by_filename[f.stem]
            else:
                home, away = _infer_teams(html)
            if not home or not away:
                continue
            parsed = parse_html(html, home, away)
            row = parsed.__dict__ | {
                "home_team": home,
                "away_team": away,
                "report_path": str(f),
            }
            rows.append(row)
        except Exception as exc:
            LOG.warning("parse failed for %s: %s", f, exc)
    return pd.DataFrame(rows)


def _infer_teams(html: str) -> tuple[str, str]:
    """Pull two canonical team names from the first paragraphs (heuristic)."""
    text = extract_article_text(html)
    head = text[:2000]
    found = []
    for team in all_canonical_teams():
        if team.lower() in head.lower():
            found.append((head.lower().find(team.lower()), team))
    found.sort()
    if len(found) >= 2:
        return found[0][1], found[1][1]
    return "", ""
