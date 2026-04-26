"""End-to-end training + evaluation pipeline.

Loads the processed match table, splits temporally (2000-01..2018-19 train,
2019-20 validation, 2020-21 held-out test), fits the model zoo, evaluates each
on the test set, and writes a `results/leaderboard.csv` with all metrics.

Usage:
    python -m src.train --models all
    python -m src.train --models logistic,xgboost
    python -m src.train --quick     # fast subset (logistic + xgb only)
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

import numpy as np
import pandas as pd

from src.evaluate import evaluate, report_table
from src.models import baseline as baseline_mod
from src.models.logistic import make_logistic
from src.models.poisson import DixonColes
from src.models.tree_models import make_lightgbm, make_random_forest, make_xgboost

LOG = logging.getLogger(__name__)

PROCESSED = Path("data/processed/matches.parquet")
RESULTS_DIR = Path("results")


# -------- Feature catalogue (extends naturally as scrapers fill in NaNs) --------


FEATURES_ALL = [
    "home_elo",
    "away_elo",
    "elo_diff",
    "is_derby",
    # Form features (3, 5, 10 windows produced by temporal_features)
    "home_form_pts_avg_3",
    "home_form_gf_avg_3",
    "home_form_ga_avg_3",
    "away_form_pts_avg_3",
    "away_form_gf_avg_3",
    "away_form_ga_avg_3",
    "home_form_pts_avg_5",
    "home_form_gf_avg_5",
    "home_form_ga_avg_5",
    "away_form_pts_avg_5",
    "away_form_gf_avg_5",
    "away_form_ga_avg_5",
    "home_form_pts_avg_10",
    "away_form_pts_avg_10",
    "home_rest_days",
    "away_rest_days",
    "home_unbeaten_streak",
    "away_unbeaten_streak",
    # Market features (vig-removed implied probabilities)
    "implied_prob_home_pinnacle_novig",
    "implied_prob_draw_pinnacle_novig",
    "implied_prob_away_pinnacle_novig",
    # NLP features (NaN if BBC pipeline not yet run)
    "home_report_sentiment",
    "away_report_sentiment",
    "controversy_flag",
    "red_card_mention_count",
    "penalty_mention_count",
]


# ---------------------------------------------------------------------------
# Time-aware splitting
# ---------------------------------------------------------------------------


def time_split(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Train: 2000-01..2018-19 (incl). Val: 2019-20. Test: 2020-21."""
    df = df.sort_values("match_date").reset_index(drop=True)
    season = df["season"]
    train = df[~season.isin(["2019-20", "2020-21"])].copy()
    val = df[season == "2019-20"].copy()
    test = df[season == "2020-21"].copy()
    return train, val, test


def available_features(df: pd.DataFrame) -> list[str]:
    """Subset of FEATURES_ALL that actually exist in this DataFrame and are non-empty."""
    return [c for c in FEATURES_ALL if c in df.columns and df[c].notna().any()]


# ---------------------------------------------------------------------------
# Per-model training entrypoints
# ---------------------------------------------------------------------------


def train_baselines(train: pd.DataFrame, test: pd.DataFrame, X_test, y_test):
    reports = []
    for name, est in [
        ("baseline_always_home", baseline_mod.AlwaysHomeBaseline()),
        ("baseline_class_prior", baseline_mod.ClassPriorBaseline()),
        ("baseline_market_implied", baseline_mod.MarketImpliedBaseline()),
    ]:
        est.fit(train, train["target_outcome"].to_numpy())
        # MarketImpliedBaseline reads implied-prob columns directly off X_test (DataFrame).
        proba = est.predict_proba(test if name.endswith("market_implied") else X_test)
        reports.append(evaluate(name, y_test, proba))
    return reports


def train_sklearn_model(name: str, model, X_train, y_train, X_test, y_test):
    LOG.info("Fitting %s...", name)
    model.fit(X_train, y_train)
    proba = model.predict_proba(X_test)
    return evaluate(name, y_test, proba), model


def train_dixon_coles(train: pd.DataFrame, test: pd.DataFrame, y_test) -> tuple:
    LOG.info("Fitting Dixon-Coles bivariate Poisson (this is slow on 7k matches)...")
    dc = DixonColes(decay=0.0065)
    dc.fit(train)
    proba = dc.predict_outcome_proba(test)
    return evaluate("dixon_coles", y_test, proba), dc


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


def run(models: list[str], *, quick: bool = False) -> pd.DataFrame:
    if not PROCESSED.exists():
        raise FileNotFoundError(
            f"{PROCESSED} not found. Run `python -m src.scrape.orchestrate --only football_data,club_elo` "
            "and then `python -m src.data_cleaning` and `python -m src.temporal_features` first."
        )
    df = pd.read_parquet(PROCESSED)
    LOG.info("Loaded %d processed matches", len(df))
    train, val, test = time_split(df)
    LOG.info("Train: %d, Val: %d, Test: %d", len(train), len(val), len(test))

    feats = available_features(df)
    LOG.info("Using %d features: %s", len(feats), feats[:8])

    X_train, y_train = train[feats], train["target_outcome"].to_numpy()
    X_test, y_test = test[feats], test["target_outcome"].to_numpy()

    reports = []
    saved_models = {}

    if "baselines" in models or "all" in models:
        reports.extend(train_baselines(train, test, X_test, y_test))

    if "logistic" in models or "all" in models:
        r, m = train_sklearn_model("logistic", make_logistic(feats), X_train, y_train, X_test, y_test)
        reports.append(r)
        saved_models["logistic"] = m

    if "random_forest" in models or "all" in models or quick:
        r, m = train_sklearn_model(
            "random_forest", make_random_forest(feats), X_train, y_train, X_test, y_test
        )
        reports.append(r)
        saved_models["random_forest"] = m

    if "xgboost" in models or "all" in models or quick:
        r, m = train_sklearn_model("xgboost", make_xgboost(feats), X_train, y_train, X_test, y_test)
        reports.append(r)
        saved_models["xgboost"] = m

    if not quick and ("lightgbm" in models or "all" in models):
        r, m = train_sklearn_model("lightgbm", make_lightgbm(feats), X_train, y_train, X_test, y_test)
        reports.append(r)
        saved_models["lightgbm"] = m

    if not quick and ("dixon_coles" in models or "all" in models):
        r, m = train_dixon_coles(train, test, y_test)
        reports.append(r)
        saved_models["dixon_coles"] = m

    table = report_table(reports).sort_values("log_loss")
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    table.to_csv(RESULTS_DIR / "leaderboard.csv", index=False)
    (RESULTS_DIR / "leaderboard.json").write_text(table.to_json(orient="records", indent=2))
    LOG.info("Wrote leaderboard to %s", RESULTS_DIR / "leaderboard.csv")

    # Persist trained models for the Shiny app.
    import joblib
    for name, model in saved_models.items():
        path = RESULTS_DIR / f"model_{name}.joblib"
        joblib.dump(model, path)
        LOG.info("Saved %s to %s", name, path)

    return table


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    p = argparse.ArgumentParser()
    p.add_argument("--models", default="all", help="comma-separated, or 'all' / 'quick'")
    p.add_argument("--quick", action="store_true", help="fit only logistic + xgboost (fast)")
    args = p.parse_args()
    table = run(args.models.split(","), quick=args.quick)
    print(table.to_string(index=False))
