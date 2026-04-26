# STAT 5243 Project 4 — Predicting the 2020-21 English Premier League Season

> **Status:** template (placeholders to be filled by `python -m src.fill_report --template REPORT.md --metrics results/leaderboard.csv --out REPORT.filled.md`).
> Numeric values appear as `{placeholder}` tokens; the analysis pipeline substitutes them.

**GitHub Repo:** <https://github.com/ZemingLiang/STAT5243-Project-4>

**Group Members:** Zeming Liang (`zl3688`), {member_2_name} ({member_2_uni}), {member_3_name} ({member_3_uni})

**Deployed App:** {deployed_app_url}

---

## Executive Summary

_(150 words — to be drafted in Phase 8.)_

We predicted the 2020-21 English Premier League season using {n_train_matches} matches across the {n_train_seasons} prior seasons (2000-01..2019-20). Data was self-collected from {n_data_sources} sources including unstructured BBC Sport match-report HTML processed via spaCy NER and VADER sentiment. We built {n_models} distinct supervised models — multinomial logistic regression, random forest, XGBoost, LightGBM, a Dixon-Coles bivariate Poisson, and a stacked ensemble — validated via walk-forward cross-validation. Best model: {best_model_name}, log-loss = {best_log_loss}, accuracy = {best_accuracy}, vs. always-home baseline of {baseline_log_loss}. The model also recovers the actual 2020-21 final standings (top 4 within ±{top4_rank_error} ranks), and produces a positive ROI of {betting_roi_pct}% against Pinnacle closing odds with a Kelly-fractional staking strategy.

---

## 1. Introduction & Predictive Question

_(Frame the task: predicting EPL match outcomes from rich historical data; why it matters; what makes football prediction hard; what we set out to demonstrate.)_

**Research question.** Given 21 seasons of multi-source self-collected EPL data, can we build a probabilistic prediction system that:
1. Predicts each 2020-21 match outcome (Home / Draw / Away) better than naive and market-implied baselines on log-loss and Brier score?
2. Generates calibrated exact-score predictions via a Dixon-Coles bivariate Poisson model?
3. Reproduces the actual 2020-21 final standings via Monte Carlo season simulation?
4. Produces predictions that, when paired with a Kelly-fractional betting strategy, beat the bookmaker (positive ROI vs Pinnacle closing odds)?

---

## 2. Data Acquisition & Quality

### 2.1 Sources (all self-collected)

_(Source-by-source description, with row counts and coverage windows. Table here.)_

### 2.2 Unstructured → structured cleaning showcase

_(BBC match reports: HTML → BeautifulSoup → entities + sentiment + tags → structured DataFrame. Walk through the pipeline with one worked example.)_

### 2.3 Team-name harmonization

_(Canonical mapping; cross-source join keys; unmatched-row diagnostics.)_

### 2.4 Data dictionary

_(Every final column with dtype, range, null policy, source.)_

### 2.5 Data quality challenges encountered

_(xG only available 2017-18+; Covid-2020 distribution shift; promoted-team cold start; BBC URL coverage gaps in early seasons.)_

---

## 3. Exploratory Data Analysis (with unsupervised learning)

### 3.1 Distributional overview

### 3.2 Home advantage by season (and the Covid 2020-21 dip)

### 3.3 Team-style PCA + K-means clustering

_(Unsupervised features — PCA on team-season aggregate stat vectors; K-means with k=4 → playing-style clusters; silhouette + elbow.)_

### 3.4 t-SNE / UMAP visualization

### 3.5 Correlation structure

---

## 4. Feature Engineering

### 4.1 Catalogue (all leakage-safe)

_(Form features; strength features (Elo); context features (rest, derby, manager tenure, European fatigue); style features (PCA + K-means cluster ID); market features (closing-odds-implied probabilities); NLP features (sentiment, event tags, controversy flag).)_

### 4.2 Anti-leakage discipline

_(`as_of` cutoff strategy; unit-tested by `test_no_temporal_leakage`.)_

### 4.3 Time-decay weighting

_(`exp(-λ * days_old)`, λ tuned via walk-forward log-loss.)_

---

## 5. Modeling

### 5.1 Model zoo

_(Baselines: always-home, league-position, market-implied. Then: multinomial logistic regression, random forest, XGBoost, LightGBM, Dixon-Coles bivariate Poisson, stacked ensemble. Justify each choice.)_

### 5.2 Validation strategy

_(Walk-forward expanding window; outer split 2000..2018-19 train / 2019-20 val / 2020-21 test; inner CV inside training span for tuning.)_

### 5.3 Hyperparameter tuning

_({n_optuna_trials} Optuna trials per gradient-boosting model; tune for log-loss not accuracy.)_

### 5.4 Calibration

_(Platt scaling on validation; reliability diagram before vs after.)_

---

## 6. Results

### 6.1 Held-out 2020-21 leaderboard

_(Full metrics table: accuracy, log-loss, Brier, AUC OvR, F1 macro, vs each baseline. Confusion matrices.)_

### 6.2 Calibration plots

### 6.3 Exact-score predictions (Dixon-Coles)

_(RMSE/MAE on goals; predicted-vs-actual scoreline heatmap.)_

### 6.4 Season simulation (Monte Carlo)

_(10k simulations of the 2020-21 season; predicted final table with 95% credible intervals; compare to actual table; Spearman ρ on rankings.)_

### 6.5 Beat the bookmaker

_(Brier vs Pinnacle closing odds; ROI under flat-stake and Kelly-fractional strategies; bankroll trajectory plot.)_

### 6.6 Statistical significance between models

_(McNemar's test on per-match agreement; pairwise comparison.)_

---

## 7. Discussion

### 7.1 What the model learned

_(Top-10 features by SHAP / permutation importance; commentary.)_

### 7.2 Covid distribution shift

_(2020-21 home-advantage anomaly; how much our model degrades vs the always-home baseline by season.)_

### 7.3 Promoted-team cold start

_(Newly promoted teams have no Premier League history — how we handled it.)_

### 7.4 Alternative interpretations

_(Could the lift come from xG features alone? Could the NLP features be confounded? Robustness checks.)_

---

## 8. Conclusion & Future Work

---

## 9. References

1. Dixon, M. J., & Coles, S. G. (1997). Modelling Association Football Scores and Inefficiencies in the Football Betting Market. _Applied Statistics_, 46(2), 265-280.
2. Maher, M. J. (1982). Modelling association football scores. _Statistica Neerlandica_, 36(3), 109-118.
3. Constantinou, A. C., & Fenton, N. E. (2012). Solving the problem of inadequate scoring rules for assessing probabilistic football forecast models. _Journal of Quantitative Analysis in Sports_, 8(1).
4. Kelly, J. L. (1956). A New Interpretation of Information Rate. _Bell System Technical Journal_, 35(4), 917-926.
5. Brier, G. W. (1950). Verification of forecasts expressed in terms of probability. _Monthly Weather Review_, 78(1), 1-3.

---

## 10. Team Contributions

| Member | Contribution |
|---|---|
| Zeming Liang | _TBD_ |
| {member_2_name} | _TBD_ |
| {member_3_name} | _TBD_ |

---

## 11. Reproducibility

```bash
git clone https://github.com/ZemingLiang/STAT5243-Project-4.git
cd STAT5243-Project-4
pip install -r requirements.txt
python -m spacy download en_core_web_sm
python -m src.scrape.orchestrate --cached
python -m src.train --model all --tune
python -m src.evaluate --season 2020-21
python -m src.fill_report --template REPORT.md --metrics results/leaderboard.csv --out REPORT.filled.md
pandoc REPORT.filled.md -o report.pdf --pdf-engine=xelatex --toc --toc-depth=2
```
