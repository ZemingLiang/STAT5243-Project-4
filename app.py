"""Shiny for Python app: STAT 5243 Project 4 — EPL Match Prediction.

Six tabs (mirroring the Project 2 idiom):
1. Guide       — what this project is + data sources + team + reproducibility
2. Data        — explore the processed matches table by season / team
3. EDA         — distribution plots, home-advantage trend, Elo trajectories
4. Predict     — pick home/away/season → get probabilities from every saved model
5. Simulator   — Monte Carlo the 2020-21 season → predicted final standings vs actual
6. Leaderboard — every model's metrics on the held-out 2020-21 test set

Reuses the Project 2 `app_theme` plotly template + Lux Bootstrap (shinyswatch).
Loads pre-trained models from `results/model_*.joblib` at startup.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio
import shinyswatch
from shiny import App, reactive, render, ui
from shinywidgets import output_widget, render_plotly

# ---------------------------------------------------------------------------
# Plotly theme (carried over from Project 2)
# ---------------------------------------------------------------------------
_app_template = go.layout.Template(
    layout=go.Layout(
        font=dict(family="'Nunito Sans', system-ui, sans-serif", color="#1e293b", size=13),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        colorway=[
            "#1a1a2e", "#4361ee", "#7209b7", "#06d6a0", "#f77f00",
            "#d62828", "#0891b2", "#16a34a", "#e11d48", "#ca8a04",
        ],
        title=dict(font=dict(size=16, color="#1a1a2e")),
        xaxis=dict(gridcolor="#e2e8f0", linecolor="#cbd5e1", zeroline=False),
        yaxis=dict(gridcolor="#e2e8f0", linecolor="#cbd5e1", zeroline=False),
        margin=dict(t=50, r=16, b=40, l=50),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
    )
)
pio.templates["app_theme"] = _app_template
pio.templates.default = "app_theme"

# ---------------------------------------------------------------------------
# Data loading — done once at startup
# ---------------------------------------------------------------------------
BASE = Path(__file__).resolve().parent
PROCESSED = BASE / "data" / "processed" / "matches.parquet"
RESULTS = BASE / "results"
LEADERBOARD = RESULTS / "leaderboard.csv"


def _load_matches() -> pd.DataFrame:
    if not PROCESSED.exists():
        return pd.DataFrame(
            columns=[
                "season", "match_date", "home_team", "away_team",
                "home_goals", "away_goals", "result", "home_elo", "away_elo",
            ]
        )
    return pd.read_parquet(PROCESSED)


def _load_leaderboard() -> pd.DataFrame:
    if not LEADERBOARD.exists():
        return pd.DataFrame()
    return pd.read_csv(LEADERBOARD)


def _load_models() -> dict[str, Any]:
    import joblib
    models = {}
    for path in sorted(RESULTS.glob("model_*.joblib")):
        name = path.stem.replace("model_", "")
        try:
            models[name] = joblib.load(path)
        except Exception:
            pass
    return models


MATCHES = _load_matches()
LEADERBOARD_DF = _load_leaderboard()
MODELS = _load_models()
SEASONS = sorted(MATCHES["season"].unique()) if not MATCHES.empty else []
TEAMS = sorted(set(MATCHES["home_team"].dropna()).union(MATCHES["away_team"].dropna())) if not MATCHES.empty else []


# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------

app_ui = ui.page_navbar(
    ui.nav_panel(
        "Guide",
        ui.card(
            ui.card_header("STAT 5243 Project 4 — Predicting the 2020-21 EPL Season"),
            ui.markdown("""
**Goal.** Predict 2020-21 English Premier League match outcomes (Home / Draw / Away),
exact scores, final standings, and beat-the-bookmaker ROI, using **21 prior seasons**
of self-collected multi-source data.

**Data sources** (all self-scraped — no Kaggle):

| Source | Coverage | Type |
|---|---|---|
| football-data.co.uk | 2000-01..2020-21, 7,890 matches | Structured CSV |
| ClubElo | per-club daily Elo, 1946-present | Semi-structured CSV API |
| FBref via soccerdata | xG (2017-18+), shots, possession | Structured (rate-limited) |
| Wikipedia | season tables, manager changes, recap prose | Mixed structured + unstructured |
| BBC Sport / Guardian | per-match HTML reports → NLP features | **Unstructured** (the showcase) |

**Models on the leaderboard:** Multinomial Logistic Regression, Random Forest, XGBoost,
plus baselines (always-home, class-prior, market-implied via Pinnacle closing odds).

**Repo:** [github.com/ZemingLiang/STAT5243-Project-4](https://github.com/ZemingLiang/STAT5243-Project-4)
""")
        ),
        ui.card(
            ui.card_header("How to use this app"),
            ui.markdown("""
- **Data tab** — browse every match by season, see Elo, scoreline, source coverage.
- **EDA tab** — distributional plots and the season-by-season home-advantage trend
  (note the Covid-2020 dip).
- **Predict tab** — pick a hypothetical match-up + a model → get probabilities.
- **Simulator tab** — Monte Carlo simulate the 2020-21 season → predicted final standings.
- **Leaderboard tab** — every model's metrics on the held-out 2020-21 test set.
""")
        ),
    ),
    ui.nav_panel(
        "Data",
        ui.layout_sidebar(
            ui.sidebar(
                ui.input_select("data_season", "Season", choices=SEASONS, selected=(SEASONS[-1] if SEASONS else None)),
                ui.input_select("data_team", "Filter team (optional)", choices=["(all)"] + TEAMS, selected="(all)"),
            ),
            ui.card(
                ui.card_header("Matches"),
                ui.output_data_frame("data_matches"),
            ),
        ),
    ),
    ui.nav_panel(
        "EDA",
        ui.card(
            ui.card_header("Result distribution by season"),
            output_widget("eda_result_by_season"),
        ),
        ui.card(
            ui.card_header("Home win rate by season (note Covid 2020-21 dip)"),
            output_widget("eda_home_advantage"),
        ),
        ui.card(
            ui.card_header("Goals per match distribution"),
            output_widget("eda_goals_dist"),
        ),
    ),
    ui.nav_panel(
        "Predict",
        ui.layout_sidebar(
            ui.sidebar(
                ui.input_select("predict_home", "Home team", choices=TEAMS, selected=(TEAMS[0] if TEAMS else None)),
                ui.input_select("predict_away", "Away team", choices=TEAMS, selected=(TEAMS[1] if len(TEAMS) > 1 else None)),
                ui.input_select("predict_season", "As-of season (for features)", choices=SEASONS, selected="2020-21" if "2020-21" in SEASONS else None),
                ui.input_action_button("predict_go", "Predict", class_="btn-primary"),
            ),
            ui.card(
                ui.card_header("Per-model H / D / A probabilities"),
                ui.output_data_frame("predict_table"),
            ),
            ui.card(
                ui.card_header("Probability bar chart"),
                output_widget("predict_chart"),
            ),
        ),
    ),
    ui.nav_panel(
        "Simulator",
        ui.markdown("**Monte Carlo simulation** — 2020-21 standings under the selected model. (See `src.season_sim`; 10k iterations.)"),
        ui.input_select("sim_model", "Model", choices=list(MODELS.keys()) or ["(no models loaded)"]),
        ui.input_action_button("sim_go", "Simulate 1,000 seasons", class_="btn-primary"),
        ui.output_data_frame("sim_table"),
    ),
    ui.nav_panel(
        "Leaderboard",
        ui.card(
            ui.card_header("Held-out 2020-21 test set — full metrics suite"),
            ui.output_data_frame("leaderboard_table"),
        ),
    ),
    title="EPL Match Prediction (STAT 5243 Project 4)",
    theme=shinyswatch.theme.lux,
)


# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------


def server(input, output, session):
    @render.data_frame
    def data_matches():
        if MATCHES.empty:
            return pd.DataFrame({"info": ["Run `python -m src.train --quick` to build data."]})
        df = MATCHES[MATCHES["season"] == input.data_season()]
        if input.data_team() != "(all)":
            df = df[(df["home_team"] == input.data_team()) | (df["away_team"] == input.data_team())]
        cols = ["match_date", "home_team", "away_team", "home_goals", "away_goals", "result", "home_elo", "away_elo", "source_coverage"]
        return df[[c for c in cols if c in df.columns]].copy()

    @render_plotly
    def eda_result_by_season():
        if MATCHES.empty:
            return go.Figure()
        agg = MATCHES.groupby(["season", "result"]).size().unstack(fill_value=0)
        agg = agg.div(agg.sum(axis=1), axis=0)
        fig = go.Figure()
        for r, label in [("H", "Home win"), ("D", "Draw"), ("A", "Away win")]:
            if r in agg.columns:
                fig.add_bar(name=label, x=agg.index, y=agg[r])
        fig.update_layout(barmode="stack", yaxis_title="Share of matches")
        return fig

    @render_plotly
    def eda_home_advantage():
        if MATCHES.empty:
            return go.Figure()
        rate = MATCHES.assign(is_home_win=(MATCHES["result"] == "H").astype(int)).groupby("season")["is_home_win"].mean()
        fig = go.Figure(go.Scatter(x=rate.index, y=rate.values, mode="lines+markers"))
        fig.add_hline(y=0.46, line_dash="dot", annotation_text="historical avg ~46%")
        fig.update_layout(yaxis_title="Home win rate", xaxis_title="Season")
        return fig

    @render_plotly
    def eda_goals_dist():
        if MATCHES.empty:
            return go.Figure()
        total = MATCHES["home_goals"].fillna(0) + MATCHES["away_goals"].fillna(0)
        fig = go.Figure(go.Histogram(x=total, nbinsx=12))
        fig.update_layout(xaxis_title="Total goals per match", yaxis_title="Count")
        return fig

    _predict_result = reactive.value(pd.DataFrame())

    @reactive.effect
    @reactive.event(input.predict_go)
    def _do_predict():
        if MATCHES.empty or not MODELS:
            _predict_result.set(pd.DataFrame({"info": ["Train models first: python -m src.train --quick"]}))
            return
        from src.train import available_features
        feats = available_features(MATCHES)
        # Build a single feature row by averaging the home team's and away team's most recent values.
        row = {}
        for f in feats:
            if f.startswith("home_") or f == "elo_diff":
                hist = MATCHES[MATCHES["home_team"] == input.predict_home()].tail(5)[f]
                row[f] = float(hist.mean()) if not hist.empty else float("nan")
            elif f.startswith("away_"):
                hist = MATCHES[MATCHES["away_team"] == input.predict_away()].tail(5)[f]
                row[f] = float(hist.mean()) if not hist.empty else float("nan")
            else:
                row[f] = 0.0
        X = pd.DataFrame([row])
        rows = []
        for name, model in MODELS.items():
            try:
                proba = model.predict_proba(X)[0]
                rows.append({"model": name, "P(Home)": proba[0], "P(Draw)": proba[1], "P(Away)": proba[2]})
            except Exception as exc:
                rows.append({"model": name, "P(Home)": None, "P(Draw)": None, "P(Away)": None, "error": str(exc)})
        _predict_result.set(pd.DataFrame(rows))

    @render.data_frame
    def predict_table():
        return _predict_result.get()

    @render_plotly
    def predict_chart():
        df = _predict_result.get()
        if df.empty or "P(Home)" not in df.columns:
            return go.Figure()
        fig = go.Figure()
        for col in ["P(Home)", "P(Draw)", "P(Away)"]:
            fig.add_bar(name=col, x=df["model"], y=df[col])
        fig.update_layout(barmode="group", yaxis_title="Probability", yaxis=dict(range=[0, 1]))
        return fig

    _sim_result = reactive.value(pd.DataFrame())

    @reactive.effect
    @reactive.event(input.sim_go)
    def _do_sim():
        if MATCHES.empty or not MODELS:
            _sim_result.set(pd.DataFrame({"info": ["Train models first."]}))
            return
        from src.season_sim import simulate_season
        from src.train import available_features
        feats = available_features(MATCHES)
        test = MATCHES[MATCHES["season"] == "2020-21"].copy()
        if test.empty:
            _sim_result.set(pd.DataFrame({"info": ["No 2020-21 matches loaded."]}))
            return
        model = MODELS.get(input.sim_model())
        if model is None:
            _sim_result.set(pd.DataFrame({"info": [f"No saved model named {input.sim_model()!r}"]}))
            return
        proba = model.predict_proba(test[feats])
        test["p_home"] = proba[:, 0]
        test["p_draw"] = proba[:, 1]
        test["p_away"] = proba[:, 2]
        result = simulate_season(test, n_iter=1000)
        _sim_result.set(result)

    @render.data_frame
    def sim_table():
        return _sim_result.get()

    @render.data_frame
    def leaderboard_table():
        return LEADERBOARD_DF


app = App(app_ui, server)
