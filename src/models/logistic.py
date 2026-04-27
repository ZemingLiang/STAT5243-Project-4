"""Multinomial logistic regression predictor with feature scaling + class balancing."""

from __future__ import annotations

from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def make_logistic(features: list[str], params: dict | None = None) -> Pipeline:
    """Returns a sklearn Pipeline: median-impute -> standardize -> multinomial LR."""
    from sklearn.impute import SimpleImputer

    params = params or {}
    pre = ColumnTransformer(
        transformers=[
            (
                "num",
                Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]),
                features,
            )
        ],
        remainder="drop",
    )
    clf = LogisticRegression(
        multi_class="multinomial",
        solver="lbfgs",
        max_iter=int(params.get("max_iter", 2000)),
        C=float(params.get("C", 1.0)),
        class_weight="balanced",
        random_state=20260426,
    )
    return Pipeline([("pre", pre), ("clf", clf)])
