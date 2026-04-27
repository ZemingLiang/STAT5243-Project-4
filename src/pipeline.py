"""One-command project pipeline: feature engineering -> selection -> training.

Usage:
    python -m src.pipeline
    python -m src.pipeline --skip-selection
    python -m src.pipeline --selection-models logistic,xgboost --train-models all
"""

from __future__ import annotations

import argparse
import logging

from src import feature_engineering
from src import model_selection
from src import train

LOG = logging.getLogger(__name__)


def run(
    *,
    skip_feature_engineering: bool = False,
    skip_selection: bool = False,
    selection_models: list[str] | None = None,
    train_models: list[str] | None = None,
    quick_train: bool = False,
    ignore_best_selection: bool = False,
) -> None:
    """Run the end-to-end pipeline in three explicit stages."""
    selection_models = selection_models or ["all"]
    train_models = train_models or ["all"]

    if not skip_feature_engineering:
        LOG.info("[1/3] Running feature engineering...")
        fe_df = feature_engineering.run()
        LOG.info("Feature engineering done: %d rows, %d columns", len(fe_df), len(fe_df.columns))
    else:
        LOG.info("[1/3] Skipping feature engineering.")

    if not skip_selection:
        LOG.info("[2/3] Running model selection with models=%s", selection_models)
        sel_df = model_selection.run(selection_models)
        best = sel_df.iloc[0].to_dict() if not sel_df.empty else {}
        LOG.info(
            "Model selection done: best model=%s, cv_log_loss_mean=%s",
            best.get("model"),
            best.get("cv_log_loss_mean"),
        )
    else:
        LOG.info("[2/3] Skipping model selection.")

    LOG.info("[3/3] Running final training with models=%s", train_models)
    leaderboard = train.run(
        train_models,
        quick=quick_train,
        use_best_selection=not ignore_best_selection,
    )
    LOG.info("Training done. Best test log-loss row:\n%s", leaderboard.nsmallest(1, "log_loss").to_string(index=False))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    p = argparse.ArgumentParser(description="Run feature engineering, model selection, and training in one command.")
    p.add_argument("--skip-feature-engineering", action="store_true")
    p.add_argument("--skip-selection", action="store_true")
    p.add_argument(
        "--selection-models",
        default="all",
        help="comma-separated models for selection: logistic,random_forest,xgboost,lightgbm or all",
    )
    p.add_argument(
        "--train-models",
        default="all",
        help="comma-separated models for final train.py, or all",
    )
    p.add_argument("--quick-train", action="store_true", help="Use train.py quick mode.")
    p.add_argument(
        "--ignore-best-selection",
        action="store_true",
        help="Force train.py defaults and ignore results/best_model_selection.json.",
    )
    args = p.parse_args()

    run(
        skip_feature_engineering=args.skip_feature_engineering,
        skip_selection=args.skip_selection,
        selection_models=args.selection_models.split(","),
        train_models=args.train_models.split(","),
        quick_train=args.quick_train,
        ignore_best_selection=args.ignore_best_selection,
    )
