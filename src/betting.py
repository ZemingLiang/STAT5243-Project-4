"""Beat-the-bookmaker evaluation.

Given per-match model probabilities + market closing odds, compute:
- The Brier / log-loss of model vs market-implied (vig-removed) probabilities.
- ROI of a flat-stake strategy (bet 1 unit on highest-edge outcome).
- ROI of a Kelly-fractional strategy (fraction of bankroll = edge / odds).
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def kelly_fraction(p: float, decimal_odds: float) -> float:
    """Standard Kelly: f = (b*p - q) / b where b = decimal_odds - 1, q = 1-p."""
    b = decimal_odds - 1
    q = 1 - p
    if b <= 0:
        return 0.0
    f = (b * p - q) / b
    return max(0.0, f)


def simulate_betting(
    matches: pd.DataFrame,
    model_probs: np.ndarray,
    *,
    odds_cols: tuple[str, str, str] = (
        "odds_home_pinnacle_close",
        "odds_draw_pinnacle_close",
        "odds_away_pinnacle_close",
    ),
    bankroll: float = 1000.0,
    kelly_cap: float = 0.05,
) -> dict:
    """Walk through the test season chronologically, place bets, track bankroll.

    Returns total profit, ROI, hit rate, n_bets, and a per-match log.
    """
    log_rows = []
    flat_profit = 0.0
    kelly_bankroll = bankroll
    n_flat_bets = 0
    n_kelly_bets = 0
    flat_wins = 0

    for i, (_, row) in enumerate(matches.iterrows()):
        odds = [row.get(c) for c in odds_cols]
        if any(pd.isna(o) for o in odds):
            continue
        edges = [model_probs[i, k] * odds[k] - 1 for k in range(3)]
        best_k = int(np.argmax(edges))
        if edges[best_k] <= 0:
            continue
        actual = int(row["target_outcome"])
        # Flat-stake: 1 unit on best-edge outcome.
        if actual == best_k:
            flat_profit += odds[best_k] - 1
            flat_wins += 1
        else:
            flat_profit -= 1
        n_flat_bets += 1
        # Kelly-fractional: capped to `kelly_cap` of bankroll.
        f = min(kelly_fraction(model_probs[i, best_k], odds[best_k]), kelly_cap)
        stake = kelly_bankroll * f
        if actual == best_k:
            kelly_bankroll += stake * (odds[best_k] - 1)
        else:
            kelly_bankroll -= stake
        n_kelly_bets += 1
        log_rows.append(
            {
                "match_date": row["match_date"],
                "home": row["home_team"],
                "away": row["away_team"],
                "bet_on": ["H", "D", "A"][best_k],
                "edge": edges[best_k],
                "stake_kelly": stake,
                "won": int(actual == best_k),
                "kelly_bankroll": kelly_bankroll,
            }
        )

    return {
        "n_flat_bets": n_flat_bets,
        "flat_profit_units": flat_profit,
        "flat_roi_pct": (flat_profit / n_flat_bets * 100) if n_flat_bets else 0.0,
        "flat_hit_rate": flat_wins / n_flat_bets if n_flat_bets else 0.0,
        "n_kelly_bets": n_kelly_bets,
        "kelly_final_bankroll": kelly_bankroll,
        "kelly_roi_pct": ((kelly_bankroll - bankroll) / bankroll * 100),
        "log": pd.DataFrame(log_rows),
    }
