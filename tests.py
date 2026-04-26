"""Integration + correctness tests for STAT 5243 Project 4."""

from __future__ import annotations

import unittest
from pathlib import Path

import numpy as np
import pandas as pd


class TestImports(unittest.TestCase):
    def test_src_modules_import(self) -> None:
        import src  # noqa: F401
        import src.scrape  # noqa: F401
        import src.scrape.football_data_uk  # noqa: F401
        import src.scrape.club_elo  # noqa: F401
        import src.scrape.wikipedia  # noqa: F401
        import src.scrape.bbc_match_reports  # noqa: F401
        import src.scrape.guardian_match_reports  # noqa: F401
        import src.scrape.fbref  # noqa: F401
        import src.scrape.orchestrate  # noqa: F401
        import src.team_harmonize  # noqa: F401
        import src.data_cleaning  # noqa: F401
        import src.temporal_features  # noqa: F401
        import src.evaluate  # noqa: F401
        import src.season_sim  # noqa: F401
        import src.betting  # noqa: F401
        import src.models.baseline  # noqa: F401
        import src.models.logistic  # noqa: F401
        import src.models.tree_models  # noqa: F401
        import src.models.poisson  # noqa: F401
        import src.nlp.parse_match_report  # noqa: F401


class TestTeamHarmonize(unittest.TestCase):
    def test_man_united_variants(self) -> None:
        from src.team_harmonize import canonical
        for variant in ("Man United", "Man Utd", "Manchester United", "Manchester Utd", "MANCHESTER UTD"):
            self.assertEqual(canonical(variant), "Manchester United")

    def test_tottenham_variants(self) -> None:
        from src.team_harmonize import canonical
        for variant in ("Tottenham", "Tottenham Hotspur", "Spurs", "Tottenham Hotspur F.C."):
            self.assertEqual(canonical(variant), "Tottenham Hotspur")

    def test_unknown_raises(self) -> None:
        from src.team_harmonize import UnknownTeamError, canonical
        with self.assertRaises(UnknownTeamError):
            canonical("Real Madrid")  # not an EPL team

    def test_nan_returns_none(self) -> None:
        from src.team_harmonize import canonical_or_none
        self.assertIsNone(canonical_or_none(float("nan")))
        self.assertIsNone(canonical_or_none(None))
        self.assertIsNone(canonical_or_none(""))


class TestNoTemporalLeakage(unittest.TestCase):
    """Asserts no engineered feature for match m references data with date >= m.date.

    The leakage discipline is enforced by `temporal_features.add_team_form` via
    `groupby('team').shift(1).rolling(...)`. We construct a tiny synthetic match
    history and check the rolling-form values for each row are computed only
    from prior rows.
    """

    def test_rolling_uses_prior_only(self) -> None:
        from src.temporal_features import _expand_per_team, _rolling_features
        # 5 matches for one team with known goals_for sequence.
        matches = pd.DataFrame(
            {
                "match_date": pd.date_range("2020-08-01", periods=5, freq="W"),
                "home_team": ["A", "A", "A", "A", "A"],
                "away_team": ["B", "C", "D", "E", "F"],
                "home_goals": [3, 1, 0, 2, 4],
                "away_goals": [0, 0, 1, 1, 0],
                "result": ["H", "H", "A", "H", "H"],
                "season": ["2020-21"] * 5,
            }
        )
        long = _expand_per_team(matches)
        feat = _rolling_features(long, window=3)
        # For team 'A' the form_gf_avg_3 in row 0 must be NaN (no prior matches).
        a_rows = feat[feat["team"] == "A"].sort_values("match_date").reset_index(drop=True)
        self.assertTrue(np.isnan(a_rows["form_gf_avg_3"].iloc[0]))
        # In row 4, the rolling-3 mean should average rows 1, 2, 3 (NOT include row 4 itself).
        # rows 1,2,3 of 'A' had goals_for = 1, 0, 2  -> mean = 1.0
        self.assertAlmostEqual(a_rows["form_gf_avg_3"].iloc[4], 1.0)


class TestBaselines(unittest.TestCase):
    def test_always_home_returns_unit_h_proba(self) -> None:
        from src.models.baseline import AlwaysHomeBaseline
        b = AlwaysHomeBaseline().fit(None, None)
        proba = b.predict_proba(pd.DataFrame(index=range(3)))
        self.assertEqual(proba.shape, (3, 3))
        np.testing.assert_array_equal(proba[:, 0], np.ones(3))

    def test_class_prior_matches_fit_distribution(self) -> None:
        from src.models.baseline import ClassPriorBaseline
        y = np.array([0, 0, 0, 1, 1, 2])  # priors: 0.5, 0.333, 0.167
        b = ClassPriorBaseline().fit(None, y)
        proba = b.predict_proba(pd.DataFrame(index=range(2)))
        np.testing.assert_allclose(proba[0], [0.5, 1 / 3, 1 / 6], atol=1e-6)


class TestNLPParser(unittest.TestCase):
    """The unstructured -> structured cleaning showcase, verified on a fixture."""

    # Sentiment heuristic only counts sentences mentioning a single team.
    SAMPLE_HTML = """
    <html><body><article>
    <p>Liverpool produced a stunning performance at Anfield. Liverpool were brilliant and dominant. The home side scored five outstanding goals in a remarkable display.</p>
    <p>Mohamed Salah scored a hat-trick in a controversial match marred by a red card and a VAR penalty review.</p>
    <p>Manchester United were dismal throughout. Manchester United looked terrible in defence. The visitors had no answers to anything.</p>
    </article></body></html>
    """

    def test_parser_extracts_features(self) -> None:
        from src.nlp.parse_match_report import parse_html
        result = parse_html(self.SAMPLE_HTML, "Liverpool", "Manchester United")
        # Sentiment: the report is highly positive about Liverpool, negative about Man Utd.
        self.assertGreater(result.home_report_sentiment, 0)
        self.assertLess(result.away_report_sentiment, 0)
        # Keyword tags
        self.assertEqual(result.red_card_mention_count, 1)
        self.assertEqual(result.penalty_mention_count, 1)
        self.assertEqual(result.var_mention_count, 1)
        self.assertEqual(result.controversy_flag, 1)
        # Word count
        self.assertGreater(result.report_length_words, 20)


if __name__ == "__main__":
    unittest.main()
