"""Evaluation metrics suite for the model zoo.

Computes:
- Accuracy
- Log-loss (proper scoring rule; the headline metric for probabilistic models)
- Brier score (multiclass; complements log-loss)
- Macro F1 / per-class F1
- ROC AUC one-vs-rest macro
- Confusion matrix
- Calibration reliability decomposition

Plus convenience: `evaluate_against_baselines()` that compares any model's metrics
to AlwaysHome / ClassPrior / MarketImplied baselines and reports the lift in
log-loss / Brier / accuracy.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    roc_auc_score,
)


@dataclass
class EvalReport:
    name: str
    accuracy: float
    log_loss: float
    brier: float
    f1_macro: float
    auc_ovr_macro: float
    confusion: list[list[int]]


def multiclass_brier(y_true: np.ndarray, y_proba: np.ndarray) -> float:
    """Mean of per-row sum of (proba - onehot)^2 across 3 classes."""
    onehot = np.zeros_like(y_proba)
    onehot[np.arange(len(y_true)), y_true] = 1.0
    return float(np.mean(np.sum((y_proba - onehot) ** 2, axis=1)))


def evaluate(name: str, y_true: np.ndarray, y_proba: np.ndarray) -> EvalReport:
    y_pred = np.argmax(y_proba, axis=1)
    return EvalReport(
        name=name,
        accuracy=float(accuracy_score(y_true, y_pred)),
        log_loss=float(log_loss(y_true, y_proba, labels=[0, 1, 2])),
        brier=multiclass_brier(y_true, y_proba),
        f1_macro=float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        auc_ovr_macro=float(
            roc_auc_score(y_true, y_proba, multi_class="ovr", average="macro", labels=[0, 1, 2])
        ),
        confusion=confusion_matrix(y_true, y_pred, labels=[0, 1, 2]).tolist(),
    )


def report_table(reports: list[EvalReport]) -> pd.DataFrame:
    return pd.DataFrame([asdict(r) for r in reports]).drop(columns=["confusion"])
