"""Monte Carlo simulation of an EPL season.

Given per-match (H, D, A) probabilities for every match in a season, draw N
realizations, accumulate points per team, and return a distribution over
final standings.

Outputs:
- `simulate_season(probas, n=10_000) -> dict` with mean rank, 5th and 95th
  percentile, championship probability, top-4 probability, relegation probability.
- `to_table(result) -> pd.DataFrame` for display.
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def _assign_points(outcome: int) -> tuple[int, int]:
    if outcome == 0:
        return 3, 0  # H
    if outcome == 1:
        return 1, 1  # D
    return 0, 3  # A


def simulate_season(matches_with_probs: pd.DataFrame, n_iter: int = 10000, seed: int = 20260426):
    """`matches_with_probs` must have columns: home_team, away_team, p_home, p_draw, p_away."""
    rng = np.random.default_rng(seed)
    probs = matches_with_probs[["p_home", "p_draw", "p_away"]].to_numpy()
    homes = matches_with_probs["home_team"].to_numpy()
    aways = matches_with_probs["away_team"].to_numpy()
    teams = sorted(set(homes).union(aways))
    team_idx = {t: i for i, t in enumerate(teams)}

    rank_history = np.zeros((n_iter, len(teams)))
    points_history = np.zeros((n_iter, len(teams)))
    for it in range(n_iter):
        points = np.zeros(len(teams), dtype=int)
        outcomes = np.array(
            [rng.choice(3, p=probs[i] / probs[i].sum()) for i in range(len(probs))]
        )
        for i, o in enumerate(outcomes):
            ph, pa = _assign_points(int(o))
            points[team_idx[homes[i]]] += ph
            points[team_idx[aways[i]]] += pa
        ranks = pd.Series(points).rank(ascending=False, method="min").to_numpy()
        rank_history[it] = ranks
        points_history[it] = points

    out = pd.DataFrame(
        {
            "team": teams,
            "expected_points": points_history.mean(axis=0),
            "expected_rank": rank_history.mean(axis=0),
            "rank_p05": np.percentile(rank_history, 5, axis=0),
            "rank_p95": np.percentile(rank_history, 95, axis=0),
            "title_prob": (rank_history == 1).mean(axis=0),
            "top4_prob": (rank_history <= 4).mean(axis=0),
            "relegation_prob": (rank_history >= 18).mean(axis=0),
        }
    ).sort_values("expected_rank")
    return out
