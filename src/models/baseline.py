"""Baseline predictors. Three baselines that any real model must beat:

1. AlwaysHomeBaseline: predict home win every match (probability 1 on H, 0 on D, A).
2. ClassPriorBaseline: predict the historical class frequencies (≈ 0.46/0.25/0.29).
3. MarketImpliedBaseline: use the Pinnacle closing-odds-implied probabilities directly.

Each exposes the sklearn-style `fit(X, y) -> self` and `predict_proba(X) -> ndarray`
interface so they can drop into the same evaluation harness as real models.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

CLASSES = (0, 1, 2)  # H=0, D=1, A=2 (must match temporal_features.add_target)


class AlwaysHomeBaseline:
    def fit(self, X, y):
        return self

    def predict_proba(self, X) -> np.ndarray:
        n = len(X)
        out = np.zeros((n, 3))
        out[:, 0] = 1.0
        return out

    def predict(self, X) -> np.ndarray:
        return np.zeros(len(X), dtype=int)


class ClassPriorBaseline:
    def __init__(self) -> None:
        self.priors_: np.ndarray | None = None

    def fit(self, X, y):
        counts = np.array([np.sum(y == c) for c in CLASSES], dtype=float)
        self.priors_ = counts / counts.sum()
        return self

    def predict_proba(self, X) -> np.ndarray:
        if self.priors_ is None:
            raise RuntimeError("fit() first")
        return np.tile(self.priors_, (len(X), 1))

    def predict(self, X) -> np.ndarray:
        if self.priors_ is None:
            raise RuntimeError("fit() first")
        return np.full(len(X), int(np.argmax(self.priors_)))


class MarketImpliedBaseline:
    """Uses pre-computed novig implied probabilities (added in temporal_features.add_market_features)."""

    P_COLS = (
        "implied_prob_home_pinnacle_novig",
        "implied_prob_draw_pinnacle_novig",
        "implied_prob_away_pinnacle_novig",
    )

    def __init__(self) -> None:
        self.fallback_priors_: np.ndarray | None = None

    def fit(self, X: pd.DataFrame, y):
        # If a row has no market probabilities, fall back to class priors.
        cb = ClassPriorBaseline().fit(X, y)
        self.fallback_priors_ = cb.priors_
        return self

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        if not isinstance(X, pd.DataFrame):
            raise TypeError("MarketImpliedBaseline requires a DataFrame with implied-prob columns")
        if self.fallback_priors_ is None:
            raise RuntimeError("fit() first")
        out = np.full((len(X), 3), np.nan)
        for i, col in enumerate(self.P_COLS):
            if col in X.columns:
                out[:, i] = X[col].to_numpy()
        # Rows where any column is NaN -> fall back to class priors.
        mask_nan = np.isnan(out).any(axis=1)
        out[mask_nan] = self.fallback_priors_
        return out

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return np.argmax(self.predict_proba(X), axis=1)
