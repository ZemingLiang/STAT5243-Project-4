"""Dixon-Coles bivariate Poisson model for football scores.

Models home_goals and away_goals as Poisson with team-specific attack /
defence ratings and a global home advantage, plus a low-score correction
term tau(x, y, lambda, mu, rho) for scorelines (0,0), (0,1), (1,0), (1,1)
to match observed correlations between low-scoring teams.

For computational speed we fit attack & defence per team via maximum
likelihood with a time-decay weight, then marginalize the joint score
distribution to get H/D/A probabilities for the match.

References:
- Dixon, M. J., & Coles, S. G. (1997). Modelling Association Football Scores.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from scipy.optimize import minimize
from scipy.stats import poisson


def _tau(x: int, y: int, lam: float, mu: float, rho: float) -> float:
    if x == 0 and y == 0:
        return 1 - lam * mu * rho
    if x == 0 and y == 1:
        return 1 + lam * rho
    if x == 1 and y == 0:
        return 1 + mu * rho
    if x == 1 and y == 1:
        return 1 - rho
    return 1.0


class DixonColes:
    """Plain-Python Dixon-Coles fitter (small-data friendly)."""

    def __init__(self, max_goals: int = 10, decay: float = 0.0065) -> None:
        self.max_goals = max_goals
        self.decay = decay  # exponential decay per day; ~0.005-0.01 typical
        self.teams_: list[str] = []
        self.attack_: dict[str, float] = {}
        self.defence_: dict[str, float] = {}
        self.home_adv_: float = 0.0
        self.rho_: float = 0.0

    def _negloglik(self, params: np.ndarray, data: pd.DataFrame) -> float:
        n = len(self.teams_)
        attack = dict(zip(self.teams_, params[:n]))
        defence = dict(zip(self.teams_, params[n : 2 * n]))
        home_adv = params[2 * n]
        rho = params[2 * n + 1]
        last_date = data["match_date"].max()
        ll = 0.0
        for _, r in data.iterrows():
            lam = np.exp(attack[r["home_team"]] + defence[r["away_team"]] + home_adv)
            mu = np.exp(attack[r["away_team"]] + defence[r["home_team"]])
            x, y = int(r["home_goals"]), int(r["away_goals"])
            t = (last_date - r["match_date"]).days
            w = np.exp(-self.decay * t)
            tau = _tau(x, y, lam, mu, rho)
            if tau <= 0:
                tau = 1e-9
            ll += w * (np.log(tau) + np.log(poisson.pmf(x, lam)) + np.log(poisson.pmf(y, mu)))
        return -ll

    def fit(self, matches: pd.DataFrame) -> "DixonColes":
        data = matches.dropna(subset=["home_goals", "away_goals"]).copy()
        data["match_date"] = pd.to_datetime(data["match_date"])
        self.teams_ = sorted(set(data["home_team"]).union(data["away_team"]))
        n = len(self.teams_)
        x0 = np.concatenate(
            [
                np.zeros(n),  # attack
                np.zeros(n),  # defence
                np.array([0.25]),  # home advantage initial
                np.array([0.0]),  # rho initial
            ]
        )
        constraint = {"type": "eq", "fun": lambda p: p[:n].sum()}  # identifiability
        result = minimize(
            self._negloglik,
            x0,
            args=(data,),
            method="SLSQP",
            constraints=[constraint],
            options={"maxiter": 200, "ftol": 1e-5},
        )
        params = result.x
        self.attack_ = dict(zip(self.teams_, params[:n]))
        self.defence_ = dict(zip(self.teams_, params[n : 2 * n]))
        self.home_adv_ = float(params[2 * n])
        self.rho_ = float(params[2 * n + 1])
        return self

    def predict_score_dist(self, home_team: str, away_team: str) -> np.ndarray:
        if home_team not in self.attack_ or away_team not in self.attack_:
            return np.full((self.max_goals + 1, self.max_goals + 1), np.nan)
        lam = np.exp(self.attack_[home_team] + self.defence_[away_team] + self.home_adv_)
        mu = np.exp(self.attack_[away_team] + self.defence_[home_team])
        m = self.max_goals
        joint = np.zeros((m + 1, m + 1))
        for x in range(m + 1):
            for y in range(m + 1):
                joint[x, y] = poisson.pmf(x, lam) * poisson.pmf(y, mu) * _tau(x, y, lam, mu, self.rho_)
        joint /= joint.sum()
        return joint

    def predict_outcome_proba(self, X: pd.DataFrame) -> np.ndarray:
        out = np.zeros((len(X), 3))
        for i, (_, r) in enumerate(X.iterrows()):
            joint = self.predict_score_dist(r["home_team"], r["away_team"])
            if np.isnan(joint).any():
                out[i] = [0.46, 0.25, 0.29]  # historical priors fallback
                continue
            home_w = np.tril(joint, -1).sum()  # x > y
            draw = np.trace(joint)
            away_w = np.triu(joint, 1).sum()  # x < y
            out[i] = [home_w, draw, away_w]
        return out
