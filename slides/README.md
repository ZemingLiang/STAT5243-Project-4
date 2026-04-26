# Slides — STAT 5243 Project 4 Final

Two PowerPoint decks for the in-class oral presentation on 2026-05-05.

| File | Audience | Length | Purpose |
| --- | --- | --- | --- |
| [`oral_10min.pptx`](./oral_10min.pptx) | The class | **12 slides · ~10 min** | The actual graded talk. Walks the whole pipeline end to end as a story. |
| [`knowhow_appendix.pptx`](./knowhow_appendix.pptx) | Q&A backup | **13 slides** (cover + A1..A12) | Technical-depth slides we keep loaded but rarely show — pull one up only when a question demands it. |

Both decks ship as real `.pptx` files (built with [`pptxgenjs`](https://github.com/gitbrent/PptxGenJS); see `build_oral.js` and `build_knowhow.js`). Companion PDFs (`oral_10min.pdf`, `knowhow_appendix.pdf`) are checked in for read-only previewing.

---

## Deck 1 — `oral_10min.pptx`

The deliverable for the 25-pt oral-presentation rubric criterion. Designed against the Advanced bar: *"tells a compelling story of the data science process from beginning to end, highlighting key decisions and findings with strong visuals and confident communication"*.

### Slide map (12 slides, ~50–60 s each)

| # | Title (kicker / headline) | Beat |
| --- | --- | --- |
| 1 | *Title* | Predicting the 2020-21 Premier League |
| 2 | *The question* | Better than random / priors / bookmakers; four targets |
| 3 | *Why this is hard* | Tiny data, high variance, sharp books, Covid distribution shift |
| 4 | *Data* | Five sources, 7,890 matches, no Kaggle |
| 5 | *Cleaning showcase* | Match-report HTML → feature row, with worked example |
| 6 | *EDA* | Three figures (placeholders), Covid-dip key finding |
| 7 | *Feature engineering* | Six families + anti-leakage discipline |
| 8 | *Models* | Six models, walk-forward CV, log-loss not accuracy |
| 9 | *Results* | Verbatim leaderboard; market wins; honest framing |
| 10 | *Bonus targets* | Dixon-Coles, Monte Carlo, beat the bookmaker |
| 11 | *Live demo* | Three Shiny tabs on Posit Connect Cloud |
| 12 | *Conclusion + team* | TL;DR, future work, contributions |

### Speaker-notes convention

Every slide ships with **2-3 paragraphs of speaker notes**, calibrated for ~50–60 s of speech. Read them verbatim if needed. Each notes block ends with an explicit time hint, e.g. *"Spend ~50s here. Then click forward."* Total budget is exactly 10 minutes; slides 9 (Results) and 11 (Live demo) are deliberately allocated 70 s because they are the punch-line and the stage transition.

To view notes inside PowerPoint / Keynote, switch to **Notes Page** view or open the **Presenter View**.

---

## Deck 2 — `knowhow_appendix.pptx`

Twelve technical-depth slides + cover. Used as Q&A backup when a grader or classmate asks something the oral deck deliberately glossed. The cover slide includes an index so the speaker can jump straight to a numbered slide by saying *"hop to A4"*.

| # | Slide | Question it answers |
| --- | --- | --- |
| A0 | Cover + index | — |
| A1 | Walk-forward CV | *"Why didn't you k-fold?"* |
| A2 | Log-loss vs accuracy | *"Why log-loss as the headline?"* |
| A3 | Brier-score decomposition | *"How calibrated is the model?"* |
| A4 | Dixon-Coles math | *"How does the bivariate Poisson actually work?"* |
| A5 | Time-decay weighting | *"Why exponentially weight old matches?"* |
| A6 | ClubElo update | *"How does the Elo rating update?"* |
| A7 | Vig removal + Kelly | *"How do you go from odds to bet sizes?"* |
| A8 | NLP attribution | *"How do you attribute sentiment to a team?"* |
| A9 | PCA + K-means clusters | *"What do the unsupervised features represent?"* |
| A10 | Team-name harmonisation | *"How do you join sources with different name spellings?"* |
| A11 | Anti-leakage unit test | *"What does the leakage test actually check?"* |
| A12 | Posit Cloud deploy | *"How is the Shiny app deployed?"* |

Speaker notes on these slides are **shorter** (a single paragraph each) — they are reminder cues, not recitation copy.

---

## Style guide (both decks)

* Layout: 16 × 9 widescreen (10″ × 5.625″).
* Palette: Columbia-blue primary (`#B9D9EB`) on midnight navy (`#0B2545`), with a coral accent (`#E07A5F`) reserved for emphasis. Off-white (`#F5F7FA`) for content slides.
* Typography: Georgia for headlines (serif), Calibri for body (sans), Consolas for code/numerics.
* Visual motif: a thick Columbia-blue *sideline* rule along the left edge of every content slide, mirrored by a thin footer rule.
* Footer text on every content slide: *"STAT 5243 Project 4 — Liang · Chen · Collaborator"* + slide number.
* No clip-art. No emoji.
* Maximum ~6 bullets per slide; generous whitespace.
* Numbers on the Results slide are pulled **verbatim** from `../results/leaderboard.csv` — never invented.

---

## Figure placeholders

Several slides reference figures that are produced separately by the EDA / training pipeline (they live under `../figures/`). Where a figure has not yet been generated, the slide shows a labelled placeholder rectangle with the expected file path printed in monospace, e.g.:

```
FIGURE PLACEHOLDER
figures/eda_home_win_by_season.png
```

The slide layout reserves the right amount of space; once the pipeline produces the PNG, swap the placeholder for an `addImage` call that points at the file.

Slides with placeholders:

* Oral deck — slides 6 (three EDA figures), 9 (confusion matrix), 11 (three demo screenshots)
* Knowhow deck — A3 (calibration plot), A5 (decay-weight curve), A9 (PCA scatter)

---

## TODO tokens

The decks contain three intentional `{TODO: …}` tokens that the pipeline owner must fill before submission:

* Oral deck slide 11 — the live Posit Connect Cloud URL
* Oral deck slide 12 — the third collaborator's specific contribution
* Knowhow deck A12 (text only, in speaker notes) — a reminder to paste the same URL

Search the `.pptx` files via `python -m markitdown <file>.pptx | grep TODO` to find them all.

---

## Build & verify

```bash
# Install once
npm install               # pulls pptxgenjs (already pinned in package-lock.json)
pip install python-pptx   # for the sanity check

# Build
node build_oral.js        # → oral_10min.pptx
node build_knowhow.js     # → knowhow_appendix.pptx

# Verify slide counts and titles
python3 - <<'PY'
from pptx import Presentation
for f in ("oral_10min.pptx", "knowhow_appendix.pptx"):
    p = Presentation(f)
    n = len(p.slides)
    title = ""
    for shape in p.slides[0].shapes:
        if shape.has_text_frame and shape.text_frame.text.strip():
            title = shape.text_frame.text.strip().splitlines()[0]
            break
    print(f"{f}: {n} slides — first slide title: {title!r}")
PY

# Re-render the PDFs (requires LibreOffice)
soffice --headless --convert-to pdf oral_10min.pptx
soffice --headless --convert-to pdf knowhow_appendix.pptx
```
