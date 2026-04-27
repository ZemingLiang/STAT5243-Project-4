"""Tree-based classifiers: Random Forest, XGBoost, LightGBM."""

from __future__ import annotations

from sklearn.ensemble import RandomForestClassifier
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer


def make_random_forest(features: list[str], params: dict | None = None) -> Pipeline:
    params = params or {}
    pre = ColumnTransformer(
        transformers=[("num", SimpleImputer(strategy="median"), features)],
        remainder="drop",
    )
    clf = RandomForestClassifier(
        n_estimators=int(params.get("n_estimators", 400)),
        max_depth=int(params.get("max_depth", 12)),
        min_samples_leaf=int(params.get("min_samples_leaf", 5)),
        class_weight="balanced_subsample",
        n_jobs=-1,
        random_state=20260426,
    )
    return Pipeline([("pre", pre), ("clf", clf)])


def make_xgboost(features: list[str], params: dict | None = None):
    import xgboost as xgb

    params = params or {}
    pre = ColumnTransformer(
        transformers=[("num", SimpleImputer(strategy="median"), features)],
        remainder="drop",
    )
    clf = xgb.XGBClassifier(
        objective="multi:softprob",
        num_class=3,
        n_estimators=int(params.get("n_estimators", 600)),
        max_depth=int(params.get("max_depth", 5)),
        learning_rate=float(params.get("learning_rate", 0.05)),
        subsample=float(params.get("subsample", 0.85)),
        colsample_bytree=float(params.get("colsample_bytree", 0.85)),
        reg_alpha=float(params.get("reg_alpha", 0.1)),
        reg_lambda=float(params.get("reg_lambda", 1.0)),
        eval_metric="mlogloss",
        n_jobs=-1,
        tree_method="hist",
        random_state=20260426,
    )
    return Pipeline([("pre", pre), ("clf", clf)])


def make_lightgbm(features: list[str], params: dict | None = None):
    import lightgbm as lgb

    params = params or {}
    pre = ColumnTransformer(
        transformers=[("num", SimpleImputer(strategy="median"), features)],
        remainder="drop",
    )
    clf = lgb.LGBMClassifier(
        objective="multiclass",
        num_class=3,
        n_estimators=int(params.get("n_estimators", 600)),
        max_depth=int(params.get("max_depth", -1)),
        num_leaves=int(params.get("num_leaves", 63)),
        learning_rate=float(params.get("learning_rate", 0.05)),
        subsample=float(params.get("subsample", 0.85)),
        colsample_bytree=float(params.get("colsample_bytree", 0.85)),
        reg_alpha=float(params.get("reg_alpha", 0.1)),
        reg_lambda=float(params.get("reg_lambda", 1.0)),
        class_weight="balanced",
        n_jobs=-1,
        random_state=20260426,
        verbosity=-1,
    )
    return Pipeline([("pre", pre), ("clf", clf)])
