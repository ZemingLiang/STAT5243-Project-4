// Build the technical "knowhow" appendix deck for STAT 5243 Project 4 Final.
// Output: knowhow_appendix.pptx
//
// Same Columbia-Blue palette as the oral deck, but a more technical layout:
//   left half = explanation + math, right half = a single specific artifact
//   (a code block, a tiny table, an algorithm walkthrough, or a diagram).
// Used as Q&A backup behind the 10-minute oral. Less "tell a story", more
// "have a specific concrete answer ready when someone asks".

const pptxgen = require("pptxgenjs");

// =============================================================================
// PALETTE & TYPOGRAPHY (same as oral deck for visual consistency)
// =============================================================================
const COLOR = {
  NAVY:  "0B2545",
  PITCH: "13315C",
  SKY:   "B9D9EB",
  SKY_DK:"7FB3D5",
  CORAL: "E07A5F",
  INK:   "1F2933",
  MUTED: "5A6573",
  PAPER: "F5F7FA",
  CODEBG:"EEF2F6",
  WHITE: "FFFFFF",
  RULE:  "D7DEE5",
};
const FONT = { HEAD: "Georgia", BODY: "Calibri", MONO: "Consolas" };

const W = 10.0, H = 5.625;
const FOOTER_TXT =
  "STAT 5243 Project 4 — Knowhow Appendix   ·   Liang · Chen · Collaborator";

const cardShadow = () => ({
  type: "outer", color: "000000", opacity: 0.10, blur: 8, offset: 2, angle: 135,
});

// =============================================================================
// CHROME HELPERS
// =============================================================================
function paintContentChrome(slide, slideNum, totalSlides) {
  slide.background = { color: COLOR.PAPER };
  slide.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: COLOR.SKY }, line: { type: "none" } });
  slide.addShape("rect", { x: 0.5, y: H - 0.42, w: W - 1.0, h: 0.012, fill: { color: COLOR.RULE }, line: { type: "none" } });
  slide.addText(FOOTER_TXT, {
    x: 0.5, y: H - 0.36, w: W - 1.5, h: 0.28,
    fontFace: FONT.BODY, fontSize: 9, color: COLOR.MUTED, align: "left", margin: 0,
  });
  slide.addText(`A${slideNum} / A${totalSlides}`, {
    x: W - 1.2, y: H - 0.36, w: 0.7, h: 0.28,
    fontFace: FONT.BODY, fontSize: 9, color: COLOR.MUTED, align: "right", margin: 0,
  });
}

function paintTitleChrome(slide) {
  slide.background = { color: COLOR.NAVY };
  slide.addShape("rect", { x: 0,    y: 0, w: 0.18, h: H, fill: { color: COLOR.SKY },    line: { type: "none" } });
  slide.addShape("rect", { x: 0.30, y: 0, w: 0.04, h: H, fill: { color: COLOR.SKY_DK }, line: { type: "none" } });
  slide.addShape("rect", { x: 0.42, y: 0, w: 0.02, h: H, fill: { color: COLOR.CORAL },  line: { type: "none" } });
}

function slideTitle(slide, title, kicker, opts = {}) {
  const fontSize = opts.fontSize || 26;
  if (kicker) {
    slide.addText(kicker.toUpperCase(), {
      x: 0.5, y: 0.30, w: W - 1.0, h: 0.30,
      fontFace: FONT.BODY, fontSize: 11, bold: true, color: COLOR.SKY_DK,
      charSpacing: 4, margin: 0,
    });
  }
  slide.addText(title, {
    x: 0.5, y: kicker ? 0.60 : 0.40, w: W - 1.0, h: 0.65,
    fontFace: FONT.HEAD, fontSize, bold: true, color: COLOR.NAVY, margin: 0,
  });
}

// Reusable: a "code panel" — left-accent rectangle of a fixed-width block.
// IMPORTANT: pptxgenjs does not clip text to the box; oversized blocks overflow.
// Always size the panel large enough for the lines you pass in.
function addCodePanel(slide, x, y, w, h, lines, opts = {}) {
  slide.addShape("rect", { x, y, w, h,
    fill: { color: COLOR.CODEBG }, line: { color: COLOR.RULE, width: 0.5 } });
  slide.addShape("rect", { x, y, w: 0.06, h, fill: { color: opts.accent || COLOR.PITCH }, line: { type: "none" } });
  if (opts.title) {
    slide.addText(opts.title, {
      x: x + 0.18, y: y + 0.06, w: w - 0.25, h: 0.25,
      fontFace: FONT.BODY, fontSize: 9, bold: true, charSpacing: 3, color: COLOR.PITCH, margin: 0,
    });
  }
  slide.addText(lines, {
    x: x + 0.18, y: y + (opts.title ? 0.32 : 0.10), w: w - 0.25, h: h - (opts.title ? 0.42 : 0.20),
    fontFace: FONT.MONO, fontSize: opts.fontSize || 10, color: COLOR.INK,
    lineSpacingMultiple: opts.lineSpacingMultiple || 1.05, margin: 0,
  });
}

// Reusable: a "math card" — a single equation rendered large.
function addMathCard(slide, x, y, w, h, latexLike, opts = {}) {
  slide.addShape("rect", { x, y, w, h,
    fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.5 }, shadow: cardShadow() });
  slide.addShape("rect", { x, y, w: 0.06, h, fill: { color: opts.accent || COLOR.CORAL }, line: { type: "none" } });
  if (opts.title) {
    slide.addText(opts.title, {
      x: x + 0.18, y: y + 0.10, w: w - 0.25, h: 0.30,
      fontFace: FONT.BODY, fontSize: 10, bold: true, charSpacing: 3, color: COLOR.PITCH, margin: 0,
    });
  }
  slide.addText(latexLike, {
    x: x + 0.18, y: y + (opts.title ? 0.45 : 0.15), w: w - 0.25, h: h - (opts.title ? 0.55 : 0.25),
    fontFace: opts.font || FONT.HEAD, italic: true, fontSize: opts.fontSize || 16, color: COLOR.INK,
    align: opts.align || "center", valign: "middle", lineSpacingMultiple: 1.30, margin: 0,
  });
}

// =============================================================================
// BUILD
// =============================================================================
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Zeming Liang, Xiying (Elina) Chen";
pres.company = "Columbia University, STAT 5243";
pres.title = "STAT 5243 Project 4 — Knowhow Appendix";
pres.subject = "Technical-depth backup slides for Q&A";

const TOTAL = 12;

// ---------------------------------------------------------------------------
// A0 — TITLE / SECTION OPENER
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintTitleChrome(s);

  s.addText("APPENDIX  ·  TECHNICAL DEPTH", {
    x: 0.85, y: 0.55, w: W - 1.7, h: 0.30,
    fontFace: FONT.BODY, fontSize: 11, bold: true, color: COLOR.SKY,
    charSpacing: 5, margin: 0,
  });

  s.addText("Knowhow", {
    x: 0.85, y: 1.10, w: W - 1.7, h: 1.40,
    fontFace: FONT.HEAD, fontSize: 64, bold: true, color: COLOR.WHITE, margin: 0,
  });
  s.addShape("rect", { x: 0.85, y: 2.55, w: 1.4, h: 0.06, fill: { color: COLOR.CORAL }, line: { type: "none" } });

  s.addText("Twelve slides of the math, the tests, and the code patterns that back the headline numbers.", {
    x: 0.85, y: 2.75, w: W - 1.7, h: 0.80,
    fontFace: FONT.HEAD, italic: true, fontSize: 17, color: COLOR.SKY,
    lineSpacingMultiple: 1.30, margin: 0,
  });

  // Index card.
  s.addShape("rect", { x: 0.85, y: 3.85, w: W - 1.7, h: 1.50,
    fill: { color: COLOR.PITCH }, line: { type: "none" } });
  s.addShape("rect", { x: 0.85, y: 3.85, w: 0.06, h: 1.50, fill: { color: COLOR.SKY }, line: { type: "none" } });
  s.addText("INDEX", {
    x: 1.00, y: 3.95, w: 1.5, h: 0.25,
    fontFace: FONT.BODY, fontSize: 9, bold: true, color: COLOR.SKY, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: "A1 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "Walk-forward CV   ", options: { color: COLOR.WHITE } },
    { text: "A2 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "Log-loss vs accuracy   ", options: { color: COLOR.WHITE } },
    { text: "A3 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "Brier decomposition\n", options: { color: COLOR.WHITE } },
    { text: "A4 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "Dixon-Coles math   ", options: { color: COLOR.WHITE } },
    { text: "A5 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "Time-decay weighting   ", options: { color: COLOR.WHITE } },
    { text: "A6 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "ClubElo update\n", options: { color: COLOR.WHITE } },
    { text: "A7 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "Vig removal + Kelly   ", options: { color: COLOR.WHITE } },
    { text: "A8 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "NLP attribution   ", options: { color: COLOR.WHITE } },
    { text: "A9 ",  options: { color: COLOR.CORAL, bold: true } }, { text: "PCA + K-means clusters\n", options: { color: COLOR.WHITE } },
    { text: "A10 ", options: { color: COLOR.CORAL, bold: true } }, { text: "Team-name harmonisation   ", options: { color: COLOR.WHITE } },
    { text: "A11 ", options: { color: COLOR.CORAL, bold: true } }, { text: "Anti-leakage unit test   ", options: { color: COLOR.WHITE } },
    { text: "A12 ", options: { color: COLOR.CORAL, bold: true } }, { text: "Posit Cloud deploy", options: { color: COLOR.WHITE } },
  ], {
    x: 1.00, y: 4.20, w: W - 2.0, h: 1.10,
    fontFace: FONT.BODY, fontSize: 11, lineSpacingMultiple: 1.40, margin: 0,
  });

  s.addNotes(
`Speaker notes — Knowhow A0 (cover).

This is the appendix deck. Twelve slides of technical depth I'd reach for if a question goes beyond the headline ten-minute talk. The index is on the cover so I can jump directly to a slide by number when prompted.

Routing rule: if the question is about methodology, anti-leakage, or a specific math choice (Dixon-Coles, Kelly, Brier), I have a slide for it. Otherwise I'll stay verbal.`
  );
}

// ---------------------------------------------------------------------------
// A1 — Walk-forward CV vs random k-fold
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 1, TOTAL);
  slideTitle(s, "Walk-forward CV — never k-fold", "A1  ·  Validation");

  // Left: text explanation.
  s.addText([
    { text: "Random k-fold leaks the future.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "Folds drawn uniformly mix matches from 2020 with matches from 2010 — " +
            "the model can use a 2020 home-form average to predict a 2010 outcome.\n",
      options: { color: COLOR.INK } },
    { text: "\nWalk-forward expanding window.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "At fold k, train on seasons 1..k, validate on season k+1. " +
            "Mirrors how the model would actually be used in production: every prediction " +
            "uses only data available before kickoff.\n",
      options: { color: COLOR.INK } },
    { text: "\nReported metric is the mean over folds; we also report per-season log-loss " +
            "to show stability across the test windows.",
      options: { italic: true, color: COLOR.MUTED } },
  ], {
    x: 0.5, y: 1.45, w: 4.6, h: 3.55,
    fontFace: FONT.BODY, fontSize: 12, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Right: schematic — five season blocks, one row per fold.
  const seasonsX = 5.50, seasonsW = 4.00;
  const seasonW = seasonsW / 5;
  const seasonY0 = 1.50;
  const rowH = 0.45;
  const labels = ["Season 1", "Season 2", "Season 3", "Season 4", "Season 5"];

  // Header row (season labels).
  labels.forEach((lab, i) => {
    s.addText(lab, {
      x: seasonsX + i * seasonW, y: seasonY0, w: seasonW, h: 0.30,
      fontFace: FONT.BODY, fontSize: 9, bold: true, color: COLOR.MUTED,
      align: "center", margin: 0,
    });
  });

  // Five fold rows.
  const foldRows = [
    [1, 0, 0, 0, 0, "Fold 1"],
    [1, 1, 0, 0, 0, "Fold 2"],
    [1, 1, 1, 0, 0, "Fold 3"],
    [1, 1, 1, 1, 0, "Fold 4"],
  ];
  foldRows.forEach((row, ri) => {
    const y = seasonY0 + 0.40 + ri * (rowH + 0.10);
    for (let i = 0; i < 5; i++) {
      let fill = COLOR.PAPER, line = COLOR.RULE;
      // 1 = train (navy), 0 followed by 1-from-end = val (coral).
      if (row[i] === 1) fill = COLOR.PITCH;
      // Identify the validation block: first 0 in the row.
      const firstZero = row.indexOf(0);
      if (i === firstZero) fill = COLOR.CORAL;
      s.addShape("rect", {
        x: seasonsX + i * seasonW + 0.03, y, w: seasonW - 0.06, h: rowH,
        fill: { color: fill }, line: { color: line, width: 0.5 },
      });
    }
    s.addText(row[5], {
      x: seasonsX - 0.85, y, w: 0.80, h: rowH,
      fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.NAVY,
      align: "right", valign: "middle", margin: 0,
    });
  });

  // Legend.
  const lyy = seasonY0 + 0.40 + 4 * (rowH + 0.10) + 0.25;
  s.addShape("rect", { x: seasonsX, y: lyy, w: 0.20, h: 0.15, fill: { color: COLOR.PITCH }, line: { type: "none" } });
  s.addText("train", { x: seasonsX + 0.25, y: lyy - 0.04, w: 0.6, h: 0.22, fontFace: FONT.BODY, fontSize: 10, color: COLOR.INK, margin: 0 });
  s.addShape("rect", { x: seasonsX + 0.95, y: lyy, w: 0.20, h: 0.15, fill: { color: COLOR.CORAL }, line: { type: "none" } });
  s.addText("validate", { x: seasonsX + 1.20, y: lyy - 0.04, w: 0.8, h: 0.22, fontFace: FONT.BODY, fontSize: 10, color: COLOR.INK, margin: 0 });
  s.addShape("rect", { x: seasonsX + 2.10, y: lyy, w: 0.20, h: 0.15, fill: { color: COLOR.PAPER }, line: { color: COLOR.RULE, width: 0.5 } });
  s.addText("unseen (future)", { x: seasonsX + 2.35, y: lyy - 0.04, w: 1.6, h: 0.22, fontFace: FONT.BODY, fontSize: 10, color: COLOR.INK, margin: 0 });

  s.addNotes(
`A1 — Walk-forward CV. The picture on the right shows the expanding-window pattern: at fold k we train on the first k seasons, validate on season k+1, never let the future look back. Mean-over-folds is what we report. Per-season log-loss is in the appendix-of-the-appendix.`
  );
}

// ---------------------------------------------------------------------------
// A2 — Log-loss vs accuracy
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 2, TOTAL);
  slideTitle(s, "Why log-loss is the headline metric", "A2  ·  Scoring rules");

  // Left: explanation.
  s.addText([
    { text: "Accuracy is too coarse for 3-class probabilistic forecasting.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "It throws away the model's confidence. A model that says " +
            "(0.50, 0.20, 0.30) and one that says (0.95, 0.02, 0.03) are scored " +
            "identically when the home team wins.\n",
      options: { color: COLOR.INK } },
    { text: "\nLog-loss is a proper scoring rule.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "It is uniquely minimised when the predicted distribution equals the " +
            "true distribution. Confidently wrong predictions are penalised " +
            "asymptotically — that's why Always-Home gets log-loss 22.4.\n",
      options: { color: COLOR.INK } },
    { text: "\nWe also report Brier (alternative proper rule) and AUC OvR (rank-based).",
      options: { italic: true, color: COLOR.MUTED } },
  ], {
    x: 0.5, y: 1.45, w: 4.7, h: 3.50,
    fontFace: FONT.BODY, fontSize: 12, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Right: log-loss formula card.
  addMathCard(s, 5.40, 1.45, 4.10, 1.55,
    "L(y, p̂) = − (1/N) Σᵢ Σ_c   1{yᵢ = c}  ·  log p̂ᵢ,c",
    { title: "Multiclass log-loss", fontSize: 14 });

  // Right: a small "penalty table" showing the cost of confidently wrong.
  const penalty = [
    [
      { text: "Predicted  p̂(true class)", options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10 } },
      { text: "Per-row log-loss",          options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10, align: "right" } },
    ],
    ["0.95", { text: "0.05", options: { align: "right" } }],
    ["0.50", { text: "0.69", options: { align: "right" } }],
    ["0.20", { text: "1.61", options: { align: "right" } }],
    ["0.05", { text: "3.00", options: { align: "right" } }],
    [{ text: "0.001", options: { color: COLOR.CORAL, bold: true } },
     { text: "6.91",  options: { color: COLOR.CORAL, bold: true, align: "right" } }],
  ];
  s.addTable(penalty, {
    x: 5.40, y: 3.20, w: 4.10, h: 1.85,
    colW: [2.40, 1.70],
    fontSize: 11, fontFace: FONT.MONO, color: COLOR.INK,
    border: { type: "solid", pt: 0.5, color: COLOR.RULE },
    rowH: 0.30, valign: "middle",
  });

  s.addNotes(
`A2 — Why log-loss. Accuracy collapses confidence into 0/1, so it cannot tell a model that's barely correct from one that's screamingly correct. Log-loss is a proper scoring rule, the cost of being confidently wrong grows asymptotically, and that is exactly why Always-Home posts a catastrophic 22.4 on the leaderboard.`
  );
}

// ---------------------------------------------------------------------------
// A3 — Brier decomposition
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 3, TOTAL);
  slideTitle(s, "Brier-score decomposition", "A3  ·  Calibration");

  s.addText([
    { text: "Brier complements log-loss with a finite penalty for any error.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "Murphy (1973) decomposes a Brier score into three interpretable parts:",
      options: { color: COLOR.INK } },
  ], {
    x: 0.5, y: 1.45, w: 4.7, h: 0.85,
    fontFace: FONT.BODY, fontSize: 12, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Three component cards stacked.
  const comps = [
    { h: "Reliability",  d: "Lower is better. Distance between predicted probability bins and observed frequencies. Calibration error in disguise." },
    { h: "Resolution",   d: "Higher is better. How much sharper the conditional distributions are than the marginal — i.e. is the model differentiating?" },
    { h: "Uncertainty",  d: "Irreducible. Variance of the marginal class distribution. Football's intrinsic noise floor." },
  ];
  const cy0 = 2.35, cw = 4.7, ch = 0.83, cgap = 0.10;
  comps.forEach((c, i) => {
    const y = cy0 + i * (ch + cgap);
    s.addShape("rect", { x: 0.5, y, w: cw, h: ch,
      fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.5 }, shadow: cardShadow() });
    s.addShape("rect", { x: 0.5, y, w: 0.06, h: ch, fill: { color: COLOR.CORAL }, line: { type: "none" } });
    s.addText(c.h, { x: 0.65, y: y + 0.08, w: 1.6, h: 0.3, fontFace: FONT.HEAD, fontSize: 14, bold: true, color: COLOR.NAVY, margin: 0 });
    s.addText(c.d, { x: 2.30, y: y + 0.08, w: cw - 1.85, h: ch - 0.18,
      fontFace: FONT.BODY, fontSize: 10.5, color: COLOR.INK, lineSpacingMultiple: 1.20, valign: "middle", margin: 0 });
  });

  // Right: identity card.
  addMathCard(s, 5.40, 1.45, 4.10, 1.65,
    "Brier  =  Reliability  −  Resolution  +  Uncertainty",
    { title: "Murphy decomposition", fontSize: 14 });

  // Calibration plot placeholder.
  s.addShape("rect", { x: 5.40, y: 3.30, w: 4.10, h: 1.75,
    fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.5 }, shadow: cardShadow() });
  s.addText("RELIABILITY DIAGRAM (placeholder)", {
    x: 5.40, y: 3.45, w: 4.10, h: 0.30,
    fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.SKY_DK, charSpacing: 3, align: "center", margin: 0,
  });
  s.addText("figures/calibration_plot.png", {
    x: 5.40, y: 4.10, w: 4.10, h: 0.25,
    fontFace: FONT.MONO, fontSize: 9, color: COLOR.MUTED, align: "center", margin: 0,
  });
  s.addText("Diagonal = perfectly calibrated. We plot it for every model.", {
    x: 5.40, y: 4.65, w: 4.10, h: 0.30,
    fontFace: FONT.BODY, italic: true, fontSize: 10, color: COLOR.MUTED, align: "center", margin: 0,
  });

  s.addNotes(
`A3 — Brier decomposition. Reliability is calibration error in another guise. Resolution measures how much the model differentiates. Uncertainty is the irreducible noise floor of football. We compare reliability and resolution across models — a model can lose to the market on log-loss but still be better-calibrated on a particular outcome.`
  );
}

// ---------------------------------------------------------------------------
// A4 — Dixon-Coles math
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 4, TOTAL);
  slideTitle(s, "Dixon-Coles bivariate Poisson", "A4  ·  Score model");

  // Math cards on the right.
  addMathCard(s, 5.20, 1.45, 4.30, 1.30,
    "λ = exp(α_h + β_a + γ)\nμ = exp(α_a + β_h)",
    { title: "Match-level scoring rates", fontSize: 13 });
  addMathCard(s, 5.20, 2.85, 4.30, 1.05,
    "P(X=x, Y=y) = τ(x,y; λ,μ,ρ) · Pois(x;λ) · Pois(y;μ)",
    { title: "Joint pmf with low-score correction", fontSize: 11 });
  addMathCard(s, 5.20, 4.00, 4.30, 1.05,
    "τ(0,0)=1−λμρ   τ(0,1)=1+λρ\nτ(1,0)=1+μρ      τ(1,1)=1−ρ",
    { title: "tau τ — fixes 0-0 / 1-1 underprediction", fontSize: 11 });

  // Left: textual explanation of the parameters.
  s.addText([
    { text: "Per-team latent attack and defence.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "α_t  =  attack strength of team t\n", options: { fontFace: FONT.MONO } },
    { text: "β_t  =  defensive frailty (positive → leaks goals)\n", options: { fontFace: FONT.MONO } },
    { text: "γ     =  global home-advantage offset\n", options: { fontFace: FONT.MONO } },
    { text: "ρ     =  low-score correlation correction\n\n", options: { fontFace: FONT.MONO } },
    { text: "Identifiability constraint:  Σ_t α_t = 0.\n", options: { italic: true, color: COLOR.MUTED } },
    { text: "Fitted by SLSQP-constrained MLE on a 0.0065/day exponentially decayed sample.\n",
      options: { color: COLOR.INK } },
    { text: "\nMarginalise the joint to recover H/D/A:", options: { color: COLOR.INK } },
    { text: "\np_H = Σ_{x>y} P(x,y)  ·  p_D = Σ_x P(x,x)  ·  p_A = Σ_{x<y} P(x,y)",
      options: { fontFace: FONT.MONO, color: COLOR.PITCH, fontSize: 10 } },
  ], {
    x: 0.5, y: 1.45, w: 4.5, h: 3.65,
    fontFace: FONT.BODY, fontSize: 11, lineSpacingMultiple: 1.30, margin: 0,
  });

  s.addNotes(
`A4 — Dixon-Coles. Each team has an attack rating α and a defence frailty β. The home team's expected goal rate is exp of attack + opponent defence + γ home advantage. The tau correction multiplies the joint pmf for the four low-low scorelines so the model doesn't under-predict 0-0 / 1-0 / 0-1 / 1-1 — the well-known Maher-1982 weakness. We marginalise the joint to get H/D/A — the same model gives us both the exact-score prediction and the outcome prediction.`
  );
}

// ---------------------------------------------------------------------------
// A5 — Time-decay weighting
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 5, TOTAL);
  slideTitle(s, "Time-decay weighting", "A5  ·  Weighting");

  s.addText([
    { text: "Football is non-stationary.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "Manager turnover, transfers, tactical evolution — a match from " +
            "2002 should not be weighted equally to one from last week.\n",
      options: { color: COLOR.INK } },
    { text: "\nExponential decay weight in the likelihood:\n", options: { bold: true, color: COLOR.NAVY } },
  ], {
    x: 0.5, y: 1.45, w: 4.6, h: 1.45,
    fontFace: FONT.BODY, fontSize: 12, lineSpacingMultiple: 1.30, margin: 0,
  });

  addMathCard(s, 0.5, 2.95, 4.6, 0.85, "w_i  =  exp(−λ · days_old_i)",
    { title: "Weight of a historical match i", fontSize: 16 });

  s.addText([
    { text: "λ = 0.0065 / day", options: { fontFace: FONT.MONO, bold: true, color: COLOR.NAVY } },
    { text: " gives a half-life of about 107 days — roughly 14 matches.\n", options: { color: COLOR.INK } },
    { text: "Tuned by walk-forward log-loss; flat (λ=0) loses to decayed by ~0.01.",
      options: { italic: true, color: COLOR.MUTED } },
  ], {
    x: 0.5, y: 4.05, w: 4.6, h: 1.00,
    fontFace: FONT.BODY, fontSize: 11.5, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Right: weight curve placeholder + table.
  s.addShape("rect", { x: 5.40, y: 1.45, w: 4.10, h: 2.10,
    fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.5 }, shadow: cardShadow() });
  s.addText("WEIGHT-VS-AGE CURVE (placeholder)", {
    x: 5.40, y: 1.55, w: 4.10, h: 0.30,
    fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.SKY_DK, charSpacing: 3, align: "center", margin: 0,
  });
  s.addText("figures/decay_weight_curve.png", {
    x: 5.40, y: 2.30, w: 4.10, h: 0.25,
    fontFace: FONT.MONO, fontSize: 9, color: COLOR.MUTED, align: "center", margin: 0,
  });

  const decayRows = [
    [
      { text: "Match age",  options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10 } },
      { text: "Weight",     options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10, align: "right" } },
    ],
    ["30 days", { text: "0.82", options: { align: "right" } }],
    ["107 days (half-life)", { text: "0.50", options: { align: "right", color: COLOR.CORAL, bold: true } }],
    ["1 year",  { text: "0.094", options: { align: "right" } }],
    ["3 years", { text: "0.001", options: { align: "right" } }],
  ];
  s.addTable(decayRows, { x: 5.40, y: 3.75, w: 4.10, h: 1.20,
    colW: [2.50, 1.60], fontSize: 10, fontFace: FONT.BODY, color: COLOR.INK,
    border: { type: "solid", pt: 0.5, color: COLOR.RULE }, rowH: 0.22, valign: "middle" });

  s.addNotes(
`A5 — Decay. The exp-minus-lambda-times-days kernel down-weights old matches. Lambda equals 0.0065 per day was chosen by walk-forward log-loss; it gives a half-life around 107 days — roughly fourteen matches, which is a meaningful window of "current form".`
  );
}

// ---------------------------------------------------------------------------
// A6 — ClubElo update
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 6, TOTAL);
  slideTitle(s, "ClubElo update mechanics", "A6  ·  Strength rating");

  // Left: explain.
  s.addText([
    { text: "Two strength signals.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "1. ClubElo (clubelo.com) — third-party, daily, since 2000.\n" +
            "2. Our own Elo, recomputed from football-data.co.uk results.\n\n",
      options: { color: COLOR.INK } },
    { text: "Update rule (Elo / FIFA-Maher style):\n", options: { bold: true, color: COLOR.NAVY } },
  ], {
    x: 0.5, y: 1.45, w: 4.6, h: 1.65,
    fontFace: FONT.BODY, fontSize: 12, lineSpacingMultiple: 1.30, margin: 0,
  });

  addMathCard(s, 0.5, 3.10, 4.6, 1.55,
    "E_h = 1 / (1 + 10^((R_a − R_h − HFA)/400))\n\nR_h ← R_h + K · (S_h − E_h)",
    { title: "Expected score & rating update", fontSize: 12 });

  s.addText([
    { text: "K = 20", options: { fontFace: FONT.MONO, bold: true } },
    { text: " (typical), ", options: { color: COLOR.MUTED } },
    { text: "HFA = 65", options: { fontFace: FONT.MONO, bold: true } },
    { text: " home-advantage points (pre-Covid).", options: { color: COLOR.MUTED } },
  ], {
    x: 0.5, y: 4.75, w: 4.6, h: 0.30,
    fontFace: FONT.BODY, fontSize: 10.5, margin: 0,
  });

  // Right: a tiny worked example with Liverpool 1-1 Tottenham.
  s.addShape("rect", { x: 5.40, y: 1.45, w: 4.10, h: 3.60,
    fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.5 }, shadow: cardShadow() });
  s.addShape("rect", { x: 5.40, y: 1.45, w: 0.06, h: 3.60, fill: { color: COLOR.PITCH }, line: { type: "none" } });
  s.addText("WORKED EXAMPLE", {
    x: 5.55, y: 1.55, w: 3.95, h: 0.28,
    fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.PITCH, charSpacing: 3, margin: 0,
  });
  s.addText([
    { text: "Liverpool ", options: { bold: true, color: COLOR.NAVY } },
    { text: "1 − 1 ", options: { color: COLOR.CORAL, bold: true } },
    { text: "Tottenham", options: { bold: true, color: COLOR.NAVY } },
  ], { x: 5.55, y: 1.85, w: 3.95, h: 0.30, fontFace: FONT.HEAD, fontSize: 14, margin: 0 });

  s.addText([
    { text: "Pre-match:    ", options: { fontFace: FONT.MONO, color: COLOR.MUTED } },
    { text: "R_h = 1920   R_a = 1820\n", options: { fontFace: FONT.MONO, color: COLOR.INK } },
    { text: "HFA-adj diff: ", options: { fontFace: FONT.MONO, color: COLOR.MUTED } },
    { text: "(1820 − 1920 − 65) / 400 = −0.4125\n", options: { fontFace: FONT.MONO, color: COLOR.INK } },
    { text: "E_h = 1 / (1 + 10^−0.4125) = ", options: { fontFace: FONT.MONO, color: COLOR.MUTED } },
    { text: "0.721\n", options: { fontFace: FONT.MONO, bold: true, color: COLOR.PITCH } },
    { text: "S_h = 0.5  (a draw)\n\n", options: { fontFace: FONT.MONO, color: COLOR.INK } },
    { text: "Update:       ", options: { fontFace: FONT.MONO, color: COLOR.MUTED } },
    { text: "R_h ← 1920 + 20·(0.5 − 0.721)\n", options: { fontFace: FONT.MONO, color: COLOR.INK } },
    { text: "             = ", options: { fontFace: FONT.MONO, color: COLOR.MUTED } },
    { text: "1915.6  (drops 4.4)\n", options: { fontFace: FONT.MONO, bold: true, color: COLOR.CORAL } },
    { text: "             ", options: { fontFace: FONT.MONO, color: COLOR.MUTED } },
    { text: "R_a ← 1820 + 4.4 = 1824.4", options: { fontFace: FONT.MONO, bold: true, color: COLOR.PITCH } },
  ], {
    x: 5.55, y: 2.20, w: 3.95, h: 2.80,
    fontFace: FONT.MONO, fontSize: 10, color: COLOR.INK, lineSpacingMultiple: 1.30, margin: 0,
  });

  s.addNotes(
`A6 — Elo. Two strength signals. We use third-party ClubElo as the canonical rating and we re-derive our own Elo from results so we can audit the rating dynamics. The worked example on the right walks through Liverpool drawing 1-1 with Tottenham at home: Liverpool was the favourite, expected score 0.72, actual 0.5, so they drop 4.4 rating points and Tottenham gain the same amount.`
  );
}

// ---------------------------------------------------------------------------
// A7 — Vig removal + Kelly
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 7, TOTAL);
  slideTitle(s, "Vig removal and Kelly-fractional sizing", "A7  ·  Market & betting");

  // Left: vig-removal box.
  addMathCard(s, 0.5, 1.45, 4.55, 1.55,
    "p_raw,c  =  1 / odds_c\noverround  =  Σ_c  p_raw,c   (≈ 1.05)\np_novig,c  =  p_raw,c  /  overround",
    { title: "Vig removal — Pinnacle close", fontSize: 12, align: "left" });

  s.addText([
    { text: "Pinnacle's overround is ~5%.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "Renormalising p_H + p_D + p_A → 1 strips the bookmaker margin and gives a usable probability estimate. " +
            "Pinnacle is the closest-to-fair book; other books need their bigger overround removed before comparison.",
      options: { color: COLOR.INK } },
  ], {
    x: 0.5, y: 3.10, w: 4.55, h: 1.45,
    fontFace: FONT.BODY, fontSize: 11.5, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Right: Kelly box.
  addMathCard(s, 5.20, 1.45, 4.30, 1.55,
    "f*  =  (b · p − q) / b\nwhere  b = decimal_odds − 1,  q = 1 − p",
    { title: "Kelly — fraction of bankroll to stake", fontSize: 12, align: "left" });

  s.addText([
    { text: "f* maximises expected log-bankroll.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "We cap f* at 5% of bankroll per bet (\"fractional Kelly\"). " +
            "Full Kelly's variance is brutal — the cap halves drawdown for ~80% of expected growth.\n\n",
      options: { color: COLOR.INK } },
    { text: "Place only when edge = p · odds − 1 > 0.\n", options: { fontFace: FONT.MONO, bold: true, color: COLOR.CORAL } },
    { text: "Size by the formula above; track bankroll trajectory.",
      options: { italic: true, color: COLOR.MUTED } },
  ], {
    x: 5.20, y: 3.10, w: 4.30, h: 1.95,
    fontFace: FONT.BODY, fontSize: 11.5, lineSpacingMultiple: 1.30, margin: 0,
  });

  s.addNotes(
`A7 — Vig + Kelly. Vig removal: bookmakers' implied probabilities don't sum to 1; you renormalise to recover a usable probability. Kelly sizing: the fraction that maximises expected log-bankroll. Full Kelly is too volatile so we cap at 5% — that's "fractional Kelly". We only place a bet when the edge is strictly positive.`
  );
}

// ---------------------------------------------------------------------------
// A8 — NLP attribution
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 8, TOTAL);
  slideTitle(s, "spaCy + VADER per-team sentence attribution", "A8  ·  NLP pipeline");

  // Left: algorithm bullets.
  s.addText([
    { text: "Algorithm sketch.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "1.  Strip BBC/Guardian boilerplate via BeautifulSoup; concat <article> text.\n", options: { color: COLOR.INK } },
    { text: "2.  Sentence-split on the standard regex ", options: { color: COLOR.INK } },
    { text: "(?<=[.!?])\\s+", options: { fontFace: FONT.MONO, color: COLOR.PITCH, fontSize: 10 } },
    { text: ".\n", options: { color: COLOR.INK } },
    { text: "3.  For each sentence, attribute to the team whose canonical name appears " +
            "uniquely in that sentence (skip mixed-mention sentences).\n", options: { color: COLOR.INK } },
    { text: "4.  Score each per-team sentence with VADER; aggregate by mean.\n", options: { color: COLOR.INK } },
    { text: "5.  Run spaCy en_core_web_sm NER once on the full doc; count PERSON entities.\n", options: { color: COLOR.INK } },
    { text: "6.  Apply regex keyword classifier (red card / penalty / VAR / injury / controversy).\n\n",
      options: { color: COLOR.INK } },
    { text: "Output ~12 derived columns per match.", options: { italic: true, color: COLOR.MUTED } },
  ], {
    x: 0.5, y: 1.45, w: 5.0, h: 3.55,
    fontFace: FONT.BODY, fontSize: 11, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Right: code excerpt of the per-team-sentiment function.
  // Use plain string with explicit \n — pptxgenjs handles this without per-run breaks.
  // Each line is kept short to avoid mid-line wrap inside the code panel.
  addCodePanel(s, 5.70, 1.45, 3.80, 3.60,
`def per_team_sentiment(text, h_t, a_t):
    sia = _sentiment()
    sents = re.split(
        r"(?<=[.!?])\\s+", text)
    hl, al = h_t.lower(), a_t.lower()
    h, a = [], []
    for s in sents:
        sl = s.lower()
        c = sia.polarity_scores(s)[
            "compound"]
        if hl in sl and al not in sl:
            h.append(c)
        elif al in sl and hl not in sl:
            a.append(c)
    return mean(h), mean(a)`,
    { title: "src/nlp/parse_match_report.py", fontSize: 9 });

  s.addNotes(
`A8 — NLP attribution. Sentence-split, attribute each sentence to whichever team is mentioned uniquely in it, score with VADER, mean-aggregate. The mixed-mention sentences are deliberately dropped — they're noise. SpaCy NER runs once on the full doc for entity counts, and a small regex classifier flags red cards, penalties, VAR, injuries, and a generic controversy flag.`
  );
}

// ---------------------------------------------------------------------------
// A9 — PCA + K-means clusters
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 9, TOTAL);
  slideTitle(s, "PCA + K-means team-style clusters", "A9  ·  Unsupervised");

  s.addText([
    { text: "Inputs.   ", options: { bold: true, color: COLOR.NAVY } },
    { text: "Per-team-per-season aggregate stats: shots/match, possession, " +
            "passes-completed, xG-for, xG-against, set-piece share, fouls.\n\n",
      options: { color: COLOR.INK } },
    { text: "Pipeline.   ", options: { bold: true, color: COLOR.NAVY } },
    { text: "StandardScaler → PCA(n=2) → KMeans(k=4, random_state=20260426).\n\n",
      options: { color: COLOR.INK } },
    { text: "Why k=4.   ", options: { bold: true, color: COLOR.NAVY } },
    { text: "Elbow at k=4 on the within-cluster sum of squares; silhouette also peaks " +
            "around k=4. The clusters correspond to interpretable archetypes:",
      options: { color: COLOR.INK } },
  ], {
    x: 0.5, y: 1.45, w: 5.0, h: 2.30,
    fontFace: FONT.BODY, fontSize: 11.5, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Cluster archetypes table.
  const clusterRows = [
    [
      { text: "k", options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10, align: "center" } },
      { text: "Archetype",options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10 } },
      { text: "Typical clubs", options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10 } },
    ],
    [{ text: "0", options: { align: "center" } }, "Possession-dominant",  "Man City, Liverpool, Chelsea"],
    [{ text: "1", options: { align: "center" } }, "Counter-attacking",    "Leicester '15-16, Spurs '21"],
    [{ text: "2", options: { align: "center" } }, "Defensive low-block",  "Burnley, Stoke '12-15"],
    [{ text: "3", options: { align: "center" } }, "Mid-table mix",        "West Ham, Everton, Newcastle"],
  ];
  s.addTable(clusterRows, {
    x: 0.5, y: 3.85, w: 5.0, h: 1.05,
    colW: [0.40, 1.80, 2.80],
    fontSize: 9.5, fontFace: FONT.BODY, color: COLOR.INK,
    border: { type: "solid", pt: 0.5, color: COLOR.RULE },
    rowH: 0.20, valign: "middle",
  });

  // Right: PCA plot placeholder.
  s.addShape("rect", { x: 5.70, y: 1.45, w: 3.80, h: 3.60,
    fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.5 }, shadow: cardShadow() });
  s.addText("PCA-2 SCATTER, K-MEANS COLOURED (placeholder)", {
    x: 5.70, y: 1.55, w: 3.80, h: 0.40,
    fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.SKY_DK, charSpacing: 3, align: "center", margin: 0,
  });
  s.addText("figures/pca_kmeans_scatter.png", {
    x: 5.70, y: 4.55, w: 3.80, h: 0.30,
    fontFace: FONT.MONO, fontSize: 9, color: COLOR.MUTED, align: "center", margin: 0,
  });

  s.addNotes(
`A9 — PCA + K-means. PC1 is roughly possession-vs-counter, PC2 is roughly defensive-discipline. K=4 hits the elbow on inertia and the local max on silhouette. The archetypes drift across seasons — Leicester's title-winning team sits in cluster 1, but the same club sits in cluster 3 a year later. We feed the cluster ID and the two PCs to the supervised model.`
  );
}

// ---------------------------------------------------------------------------
// A10 — Team-name harmonization
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 10, TOTAL);
  slideTitle(s, "Team-name harmonisation — fail fast on unknowns", "A10  ·  Joins", { fontSize: 22 });

  // Left: text.
  s.addText([
    { text: "The silent-mis-join trap.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "football-data.co.uk uses ", options: { color: COLOR.INK } },
    { text: "\"Man United\"", options: { fontFace: FONT.MONO, color: COLOR.PITCH, fontSize: 10 } },
    { text: ", FBref uses ", options: { color: COLOR.INK } },
    { text: "\"Manchester Utd\"", options: { fontFace: FONT.MONO, color: COLOR.PITCH, fontSize: 10 } },
    { text: ", BBC uses ", options: { color: COLOR.INK } },
    { text: "\"Manchester United\"", options: { fontFace: FONT.MONO, color: COLOR.PITCH, fontSize: 10 } },
    { text: ", Wikipedia uses ", options: { color: COLOR.INK } },
    { text: "\"Manchester United F.C.\"", options: { fontFace: FONT.MONO, color: COLOR.PITCH, fontSize: 10 } },
    { text: ".\nA naive merge silently drops ~40% of rows and corrupts every feature downstream.\n\n",
      options: { color: COLOR.INK } },
    { text: "Our pattern.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "1.  Define a canonical name dict (Wikipedia article title minus F.C.).\n", options: { color: COLOR.INK } },
    { text: "2.  Every variant is normalised case + suffix-stripped.\n", options: { color: COLOR.INK } },
    { text: "3.  ", options: { color: COLOR.INK } },
    { text: "canonical()", options: { fontFace: FONT.MONO, color: COLOR.CORAL, fontSize: 10, bold: true } },
    { text: " raises ", options: { color: COLOR.INK } },
    { text: "UnknownTeamError", options: { fontFace: FONT.MONO, color: COLOR.CORAL, fontSize: 10, bold: true } },
    { text: " on miss — caller fails loudly.\n", options: { color: COLOR.INK } },
    { text: "4.  CI runs the canonicaliser over every scraped row on every push.",
      options: { color: COLOR.INK } },
  ], {
    x: 0.5, y: 1.45, w: 5.0, h: 3.55,
    fontFace: FONT.BODY, fontSize: 11, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Right: code excerpt.
  addCodePanel(s, 5.70, 1.45, 3.80, 3.60,
`class UnknownTeamError(KeyError):
    pass

_TEAM_VARIANTS = {
    "Manchester United": (
        "Man United", "Man Utd",
        "Manchester Utd",
    ),
    "Tottenham Hotspur": (
        "Tottenham", "Spurs",
    ),
    ...
}

def canonical(name: str) -> str:
    key = _normalize(name)
    if key not in _MAP:
        raise UnknownTeamError(name)
    return _MAP[key]`,
    { title: "src/team_harmonize.py", fontSize: 9 });

  s.addNotes(
`A10 — Harmonisation. The classic football-data trap is silent mis-joins. We have a canonical dictionary, every variant is normalised before lookup, and unknown variants raise UnknownTeamError so the caller fails loudly instead of dropping rows quietly. CI runs this over every scraped row on every push, which catches new variants the moment a scraper picks them up.`
  );
}

// ---------------------------------------------------------------------------
// A11 — Anti-leakage unit test
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 11, TOTAL);
  slideTitle(s, "Anti-leakage invariant — what the test checks", "A11  ·  CI safety net");

  // Left: invariant explanation.
  s.addText([
    { text: "The invariant.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "For every row m in the processed feature matrix and every rolling " +
            "feature column f, the value of f[m] depends only on rows whose " +
            "match_date is strictly less than m.match_date.\n\n",
      options: { color: COLOR.INK } },
    { text: "What would break.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "Forgetting a ", options: { color: COLOR.INK } },
    { text: ".shift(1)", options: { fontFace: FONT.MONO, color: COLOR.CORAL, fontSize: 10, bold: true } },
    { text: " on a rolling-window aggregate would let the current match's " +
            "own goals leak into its own form-feature.\n\n",
      options: { color: COLOR.INK } },
    { text: "What the test does.\n", options: { bold: true, color: COLOR.NAVY } },
    { text: "Build features twice — once with the full dataset, once with the dataset " +
            "truncated to seasons ≤ 2018-19. For every match in 2018-19, the feature " +
            "values must match exactly across the two builds. ",
      options: { color: COLOR.INK } },
    { text: "If they differ, future data leaked.",
      options: { italic: true, color: COLOR.CORAL, bold: true } },
  ], {
    x: 0.5, y: 1.45, w: 5.0, h: 3.55,
    fontFace: FONT.BODY, fontSize: 11.5, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Right: condensed test code.
  addCodePanel(s, 5.70, 1.45, 3.80, 3.60,
`def test_no_temporal_leakage():
    raw = load_interim_matches()
    full = build_processed_matches(raw)

    cutoff = pd.Timestamp("2019-08-01")
    early = raw[raw.match_date < cutoff]
    truncd = build_processed_matches(early)

    cols = [c for c in full.columns
            if c.startswith(("home_form",
                             "away_form"))]

    full_pre = full[full.match_date < cutoff]
    pdt.assert_frame_equal(
        full_pre[cols].reset_index(drop=True),
        truncd[cols].reset_index(drop=True),
    )`,
    { title: "tests.test_no_temporal_leakage", fontSize: 9 });

  s.addNotes(
`A11 — Anti-leakage. The invariant is that any rolling feature for match m depends only on matches strictly older than m. The test builds the feature matrix twice — once with the whole dataset, once truncated to before our cutoff — and asserts the rolling features for the pre-cutoff matches are identical between the two runs. If they differ, future data must have leaked.`
  );
}

// ---------------------------------------------------------------------------
// A12 — Posit Connect Cloud deployment
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 12, TOTAL);
  slideTitle(s, "Posit Connect Cloud deployment workflow", "A12  ·  Deploy");

  // Left: numbered steps.
  const steps = [
    { n: "1", h: "Pre-bake artefacts",
      d: "Run scrape → train → evaluate locally; commit results/leaderboard.csv plus the .joblib model files into the repo." },
    { n: "2", h: "Pin the environment",
      d: "requirements.txt with exact versions; rsconnect-python verifies and replays the env in the cloud build." },
    { n: "3", h: "rsconnect deploy",
      d: "rsconnect deploy shiny app.py --server connect.posit.cloud --api-key $RSC_API_KEY" },
    { n: "4", h: "Smoke-test in cloud",
      d: "First request loads models; warm-time ~6s; subsequent requests <300ms because Shiny keeps state." },
    { n: "5", h: "Pin the URL",
      d: "Paste the deployed URL into the oral deck slide 11 and the README before submission." },
  ];
  const sx = 0.5, sy0 = 1.45, sw = W - 1.0, sh = 0.65, sgap = 0.10;
  steps.forEach((st, i) => {
    const y = sy0 + i * (sh + sgap);
    s.addShape("rect", { x: sx, y, w: sw, h: sh,
      fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.5 }, shadow: cardShadow() });
    s.addShape("rect", { x: sx, y, w: 0.06, h: sh, fill: { color: COLOR.CORAL }, line: { type: "none" } });
    // Big numeral.
    s.addText(st.n, {
      x: sx + 0.15, y: y + 0.10, w: 0.50, h: 0.45,
      fontFace: FONT.HEAD, fontSize: 22, bold: true, color: COLOR.SKY_DK,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(st.h, {
      x: sx + 0.75, y: y + 0.08, w: 2.20, h: 0.30,
      fontFace: FONT.BODY, fontSize: 12, bold: true, color: COLOR.NAVY, margin: 0,
    });
    s.addText(st.d, {
      x: sx + 3.05, y: y + 0.08, w: sw - 3.20, h: sh - 0.18,
      fontFace: i === 2 ? FONT.MONO : FONT.BODY, fontSize: i === 2 ? 10 : 11, color: COLOR.INK,
      lineSpacingMultiple: 1.20, valign: "middle", margin: 0,
    });
  });

  s.addNotes(
`A12 — Deploy. Pre-bake every heavy artefact locally, commit the leaderboard CSV and model joblibs, pin the environment with requirements.txt, deploy via rsconnect-python, smoke-test once warm, paste the URL into slide 11 of the oral deck and the README. The deploy URL is a TODO until the night before — Posit Connect Cloud regenerates the URL on every push.`
  );
}

// =============================================================================
// WRITE
// =============================================================================
pres.writeFile({ fileName: "knowhow_appendix.pptx" }).then((fname) => {
  console.log("WROTE", fname);
});
