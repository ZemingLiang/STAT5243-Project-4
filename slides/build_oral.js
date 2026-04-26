// Build the 10-minute oral presentation deck for STAT 5243 Project 4 Final.
// Output: oral_10min.pptx
//
// Design direction:
//   Palette is a content-informed take on Columbia Blue:
//     - NAVY  (#0B2545) deep midnight navy = primary, dominant on title + dividers
//     - PITCH (#13315C) muted slate-blue = secondary, subtle blocks
//     - SKY   (#B9D9EB) Columbia blue accent = highlight stripes, divider rules, footer
//     - CORAL (#E07A5F) warm contrast accent = pulled-out stats and key callouts
//     - INK   (#1F2933) body text on light backgrounds
//     - PAPER (#F5F7FA) off-white slide background for content slides
//
//   Typography pairing: Georgia (serif) for headlines, Calibri (sans) for body.
//   Visual motif: a single thick SKY accent rule on the LEFT side of every
//   content slide, mirrored by a thin SKY footer rule at the bottom. This
//   carries the EPL-pitch-sideline feeling without resorting to clip-art.

const pptxgen = require("pptxgenjs");

// =============================================================================
// PALETTE & TYPOGRAPHY
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
  WHITE: "FFFFFF",
  RULE:  "D7DEE5",
};
const FONT = { HEAD: "Georgia", BODY: "Calibri" };

// Slide geometry (LAYOUT_16x9 = 10" x 5.625")
const W = 10.0, H = 5.625;
const FOOTER_TXT =
  "STAT 5243 Project 4   ·   Liang · Chen · Collaborator   ·   2026-05-05";

// Reusable shadow (must be a fresh object per call: pptxgenjs mutates).
const cardShadow = () => ({
  type: "outer", color: "000000", opacity: 0.10, blur: 8, offset: 2, angle: 135,
});

// =============================================================================
// DECORATION HELPERS
// =============================================================================
function paintContentChrome(slide, slideNum, totalSlides) {
  // Off-white background.
  slide.background = { color: COLOR.PAPER };
  // Left sideline (the "pitch sideline" motif): thick SKY rule.
  slide.addShape("rect", {
    x: 0, y: 0, w: 0.18, h: H, fill: { color: COLOR.SKY }, line: { type: "none" },
  });
  // Footer rule + footer text + page number.
  slide.addShape("rect", {
    x: 0.5, y: H - 0.42, w: W - 1.0, h: 0.012,
    fill: { color: COLOR.RULE }, line: { type: "none" },
  });
  slide.addText(FOOTER_TXT, {
    x: 0.5, y: H - 0.36, w: W - 1.5, h: 0.28,
    fontFace: FONT.BODY, fontSize: 9, color: COLOR.MUTED, align: "left", margin: 0,
  });
  slide.addText(`${slideNum} / ${totalSlides}`, {
    x: W - 1.2, y: H - 0.36, w: 0.7, h: 0.28,
    fontFace: FONT.BODY, fontSize: 9, color: COLOR.MUTED, align: "right", margin: 0,
  });
}

function paintTitleChrome(slide) {
  // Deep navy field.
  slide.background = { color: COLOR.NAVY };
  // Three vertical accent stripes evoking pitch markings.
  slide.addShape("rect", { x: 0,    y: 0, w: 0.18, h: H, fill: { color: COLOR.SKY },    line: { type: "none" } });
  slide.addShape("rect", { x: 0.30, y: 0, w: 0.04, h: H, fill: { color: COLOR.SKY_DK }, line: { type: "none" } });
  slide.addShape("rect", { x: 0.42, y: 0, w: 0.02, h: H, fill: { color: COLOR.CORAL },  line: { type: "none" } });
}

function paintDividerChrome(slide) {
  slide.background = { color: COLOR.PITCH };
  slide.addShape("rect", { x: 0, y: 0, w: 0.18, h: H, fill: { color: COLOR.SKY },   line: { type: "none" } });
  slide.addShape("rect", { x: W-0.18, y: 0, w: 0.18, h: H, fill: { color: COLOR.SKY }, line: { type: "none" } });
}

function slideTitle(slide, title, kicker, opts = {}) {
  const fontSize = opts.fontSize || 28;
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

// =============================================================================
// BUILD
// =============================================================================
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Zeming Liang, Xiying (Elina) Chen";
pres.company = "Columbia University, STAT 5243";
pres.title = "End-to-End ML for the 2020-21 EPL Season";
pres.subject = "STAT 5243 Project 4 Final - Oral Presentation";

const TOTAL = 12;

// ---------------------------------------------------------------------------
// SLIDE 1 — TITLE
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintTitleChrome(s);

  s.addText("STAT 5243   ·   PROJECT 4 FINAL   ·   COLUMBIA UNIVERSITY", {
    x: 0.85, y: 0.50, w: W - 1.7, h: 0.30,
    fontFace: FONT.BODY, fontSize: 11, bold: true, color: COLOR.SKY,
    charSpacing: 5, margin: 0,
  });

  s.addText("Predicting the 2020-21\nPremier League", {
    x: 0.85, y: 0.95, w: W - 1.0, h: 2.10,
    fontFace: FONT.HEAD, fontSize: 42, bold: true, color: COLOR.WHITE,
    lineSpacingMultiple: 1.05, margin: 0,
  });

  // Coral underline rule.
  s.addShape("rect", {
    x: 0.85, y: 3.10, w: 1.4, h: 0.06,
    fill: { color: COLOR.CORAL }, line: { type: "none" },
  });

  s.addText("End-to-end machine learning on 21 seasons of self-collected EPL data", {
    x: 0.85, y: 3.25, w: W - 1.7, h: 0.42,
    fontFace: FONT.HEAD, italic: true, fontSize: 17, color: COLOR.SKY, margin: 0,
  });

  s.addText([
    { text: "Zeming Liang", options: { bold: true, color: COLOR.WHITE } },
    { text: "  zl3688\n", options: { color: COLOR.SKY } },
    { text: "Xiying (Elina) Chen", options: { bold: true, color: COLOR.WHITE } },
    { text: "  xiyingchen\n", options: { color: COLOR.SKY } },
    { text: "Collaborator", options: { bold: true, color: COLOR.WHITE } },
    { text: "  yh3945-cmd", options: { color: COLOR.SKY } },
  ], {
    x: 0.85, y: 3.95, w: W - 1.7, h: 1.05,
    fontFace: FONT.BODY, fontSize: 13, lineSpacingMultiple: 1.25, margin: 0,
  });

  s.addText("github.com/ZemingLiang/STAT5243-Project-4   ·   2026-05-05", {
    x: 0.85, y: 5.10, w: W - 1.7, h: 0.30,
    fontFace: FONT.BODY, fontSize: 10, italic: true, color: COLOR.SKY_DK, margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 1 (Title). ~30s.

Good [morning/afternoon] everyone. I'm Zeming Liang, and with my teammates Xiying Chen and our collaborator we built an end-to-end machine-learning system that predicts the 2020-21 English Premier League season using twenty-one seasons of self-collected data.

Quick context for why we picked this. Football match prediction is a notoriously difficult problem because the data is small, the variance is high, and there is a sharp, liquid betting market that prices games for a living. Beating that market — or even getting close to it — is a real test of every step of the data science pipeline. So this project is the full pipeline: scraping, cleaning, NLP on unstructured match reports, feature engineering with strict anti-leakage discipline, six models including a domain-specific Dixon-Coles bivariate Poisson, and a deployed Shiny app where you can try it out yourself.

Today I'll walk you through the whole arc end to end. By the last slide you'll know exactly what we built, what the headline number was, and — importantly — how we interpret a result that is honest rather than spun.

[Spend ~30s here. Then click forward.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 2 — THE QUESTION
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 2, TOTAL);
  slideTitle(s, "Can we predict the Premier League?", "The question");

  // Left: sub-question summary
  s.addText("Three increasingly hard bars to clear:", {
    x: 0.5, y: 1.55, w: 5.4, h: 0.35,
    fontFace: FONT.BODY, fontSize: 14, bold: true, color: COLOR.INK, margin: 0,
  });
  s.addText([
    { text: "Better than random.   ",   options: { bold: true } },
    { text: "33% accuracy floor.\n", options: { color: COLOR.MUTED } },
    { text: "Better than naive priors.   ", options: { bold: true } },
    { text: "Always-pick-Home ≈ 46%.\n", options: { color: COLOR.MUTED } },
    { text: "Better than the bookmakers.   ", options: { bold: true } },
    { text: "Sharps are the hardest baseline of all.", options: { color: COLOR.MUTED } },
  ], {
    x: 0.5, y: 1.95, w: 5.4, h: 1.55,
    fontFace: FONT.BODY, fontSize: 14, color: COLOR.INK,
    paraSpaceAfter: 8, lineSpacingMultiple: 1.30, margin: 0,
  });

  s.addText("And we don't stop at one target.", {
    x: 0.5, y: 3.65, w: 5.4, h: 0.30,
    fontFace: FONT.HEAD, italic: true, fontSize: 13, color: COLOR.PITCH, margin: 0,
  });

  // Right: four-target callout grid
  const cards = [
    { t: "Match outcome",     d: "Home / Draw / Away — 3-class probabilistic" },
    { t: "Exact score",       d: "Bivariate Poisson via Dixon-Coles" },
    { t: "Final standings",   d: "Monte Carlo simulation, 10k iterations" },
    { t: "Beat the bookmaker",d: "Kelly-fractional ROI vs Pinnacle close" },
  ];
  const cx = 6.10, cy0 = 1.55, cw = 3.40, ch = 0.85, gap = 0.12;
  cards.forEach((c, i) => {
    const y = cy0 + i * (ch + gap);
    s.addShape("rect", {
      x: cx, y, w: cw, h: ch,
      fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
      shadow: cardShadow(),
    });
    s.addShape("rect", { x: cx, y, w: 0.06, h: ch, fill: { color: COLOR.CORAL }, line: { type: "none" } });
    s.addText(c.t, {
      x: cx + 0.18, y: y + 0.08, w: cw - 0.25, h: 0.30,
      fontFace: FONT.BODY, fontSize: 13, bold: true, color: COLOR.NAVY, margin: 0,
    });
    s.addText(c.d, {
      x: cx + 0.18, y: y + 0.40, w: cw - 0.25, h: 0.40,
      fontFace: FONT.BODY, fontSize: 11, color: COLOR.MUTED, margin: 0,
    });
  });

  s.addNotes(
`Speaker notes — Slide 2 (The Question). ~50s.

The question we set out to answer has three increasingly hard bars to clear. The first is trivial: can we beat random, which is 33% on a three-class problem. The second is much less trivial — can we beat naive priors. The Premier League has a strong home-field advantage, so always-pick-Home is already around 46% accuracy. The third is the real test: can we beat the bookmakers, who are sharp, well-resourced, and whose closing odds incorporate every piece of public information up to kickoff. Spoiler: that last bar is much harder than it sounds.

We deliberately framed the project around four interlinked targets, not just one. Match outcome — that's the headline three-class classification with calibrated probabilities. Exact score — a bivariate Poisson where we predict joint home and away goals. Final standings — we simulate the full 380-match season ten thousand times and aggregate to a predicted league table. And finally, beat the bookmaker — translating the model's edge into a Kelly-fractional staking strategy and reporting its ROI on the held-out test season.

These four are interlinked because they share the same probabilistic engine, but they stress-test the model in very different ways. A model can be well-calibrated on H/D/A and still produce a nonsense final table.

[Spend ~50s here. Then click forward.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 3 — WHY THIS IS HARD
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 3, TOTAL);
  slideTitle(s, "Why football is genuinely hard", "Why this is hard");

  // Four "challenge cards" in a 2x2 grid.
  const items = [
    { h: "Tiny data",            b: "380 matches per season. Twenty-one seasons gives only ~7,890 rows — small for tabular ML." },
    { h: "High variance",        b: "One deflected goal can flip an outcome. Match-level noise is huge relative to signal." },
    { h: "Sharp bookmakers",     b: "Pinnacle's closing odds are the consensus of the most-informed actors with skin in the game." },
    { h: "Distribution shift",   b: "Covid 2020-21 played behind closed doors. Home-win rate dropped from ≈46% to ≈36%." },
  ];
  const gx0 = 0.5, gy0 = 1.50, gw = 4.50, gh = 1.50, hgap = 0.20, vgap = 0.20;
  items.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx0 + col * (gw + hgap);
    const y = gy0 + row * (gh + vgap);
    s.addShape("rect", {
      x, y, w: gw, h: gh,
      fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
      shadow: cardShadow(),
    });
    s.addShape("rect", { x, y, w: 0.06, h: gh, fill: { color: COLOR.SKY_DK }, line: { type: "none" } });
    s.addText(it.h, {
      x: x + 0.20, y: y + 0.18, w: gw - 0.30, h: 0.40,
      fontFace: FONT.HEAD, fontSize: 18, bold: true, color: COLOR.NAVY, margin: 0,
    });
    s.addText(it.b, {
      x: x + 0.20, y: y + 0.65, w: gw - 0.30, h: gh - 0.75,
      fontFace: FONT.BODY, fontSize: 12, color: COLOR.INK,
      lineSpacingMultiple: 1.25, margin: 0,
    });
  });

  // Inline punch-line stat at the bottom (placed safely above the footer).
  s.addShape("rect", {
    x: 0.5, y: 4.62, w: W - 1.0, h: 0.32,
    fill: { color: COLOR.SKY }, line: { type: "none" },
  });
  s.addText("Plus: promoted teams have zero Premier League history → cold-start every August.", {
    x: 0.6, y: 4.62, w: W - 1.2, h: 0.32,
    fontFace: FONT.BODY, italic: true, fontSize: 11, bold: true, color: COLOR.NAVY,
    valign: "middle", margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 3 (Why this is hard). ~50s.

Before I show what we built, I want to set expectations honestly. Football is one of the hardest sports to model. Here's why.

First, the data is tiny by modern ML standards. Each Premier League season is only 380 matches, and we have twenty-one of them. That's under eight thousand rows total — orders of magnitude smaller than what tabular gradient-boosting was designed for.

Second, the variance is enormous. One deflected goal in stoppage time can flip a Home win into a Draw, and the underlying skill gap that day didn't change at all. Match-level noise is comparable in size to the signal.

Third — and this is the brutal one — the bookmakers are the smartest baseline you've ever competed with. Pinnacle's closing odds aggregate the bets of every sharp in the world right up to kickoff. They are arguably the closest thing in finance to a real-time, market-priced probability.

Fourth, our test season is 2020-21, which was played behind closed doors because of Covid. Home advantage collapsed from about forty-six percent to about thirty-six percent. That's a textbook distribution shift on the held-out set — exactly the worst-case for a model trained on pre-Covid data.

And as a bonus difficulty, three teams get promoted every season with no Premier League history at all. Cold-start, every August.

[Spend ~50s here. Then click forward.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 4 — DATA
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 4, TOTAL);
  slideTitle(s, "Five sources, all self-collected — no Kaggle", "Data");

  // Big-stat callouts on the left.
  const stats = [
    { n: "7,890", l: "matches scraped" },
    { n: "21",    l: "seasons (2000-01 → 2020-21)" },
    { n: "5",     l: "independent sources" },
  ];
  stats.forEach((st, i) => {
    const y = 1.55 + i * 1.05;
    s.addText(st.n, {
      x: 0.5, y, w: 2.20, h: 0.65,
      fontFace: FONT.HEAD, fontSize: 44, bold: true, color: COLOR.CORAL, margin: 0,
    });
    s.addText(st.l, {
      x: 0.5, y: y + 0.65, w: 2.20, h: 0.25,
      fontFace: FONT.BODY, fontSize: 11, color: COLOR.MUTED, margin: 0,
    });
  });

  // Right: source table.
  const rows = [
    [
      { text: "Source",    options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 11 } },
      { text: "Type",      options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 11 } },
      { text: "What we get", options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 11 } },
    ],
    ["football-data.co.uk", "Structured CSV",   "Results, half-time scores, closing odds"],
    ["ClubElo.com",         "Structured API",   "Daily club Elo ratings, 2000+"],
    ["FBref / soccerdata",  "Semi-structured",  "Advanced stats incl. xG (2017-18+)"],
    ["Wikipedia",           "Semi-structured",  "Manager tenure, promotion/relegation"],
    [
      { text: "BBC + Guardian match reports", options: { bold: true, color: COLOR.CORAL } },
      { text: "Unstructured HTML", options: { bold: true, color: COLOR.CORAL } },
      { text: "NLP → entities, sentiment, event tags", options: { bold: true, color: COLOR.CORAL } },
    ],
  ];
  s.addTable(rows, {
    x: 3.20, y: 1.55, w: 6.30, h: 3.10,
    colW: [1.85, 1.55, 2.90],
    fontSize: 10.5, fontFace: FONT.BODY, color: COLOR.INK,
    border: { type: "solid", pt: 0.5, color: COLOR.RULE },
    rowH: 0.50, valign: "middle",
  });

  s.addText(
    "Every source is harmonised into the same canonical team-name dictionary " +
    "before any join — the UnknownTeamError pattern fails fast on new variants.", {
    x: 3.20, y: 4.85, w: 6.30, h: 0.30,
    fontFace: FONT.BODY, italic: true, fontSize: 10, color: COLOR.MUTED, margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 4 (Data sources). ~55s.

Onto the data. We did not use Kaggle. We collected every byte ourselves from five independent sources. Three big numbers on the left: seven thousand, eight hundred and ninety matches across twenty-one seasons from five independent sources.

The four structured sources are listed in the top of the table. football-data.co.uk gives us per-match results, half-time scores, and the closing betting odds — those odds become the market baseline that's the hardest thing to beat. ClubElo gives us daily Elo ratings going back to the year 2000. FBref via the soccerdata Python wrapper gives us advanced stats including expected goals, but only from 2017-18 onward — that data-availability gap turned into one of our challenges. Wikipedia gives us the manager-tenure and promotion-relegation context.

The fifth row, in coral, is the showpiece of the cleaning pipeline. We scraped roughly 7,600 BBC and Guardian match-report HTML pages and pushed them through an NLP pipeline. That's the unstructured-to-structured story I'll demo on the next slide.

One discipline point at the bottom: every source uses different name spellings — "Man Utd" versus "Manchester United" versus "Manchester Utd" — so we built a canonical-name dictionary and fail fast on any unknown variant. That's how we avoided silent mis-joins, which would have polluted features without raising any error.

[Spend ~55s here.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 5 — UNSTRUCTURED → STRUCTURED
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 5, TOTAL);
  slideTitle(s, "Match-report HTML  →  feature row", "Cleaning showcase");

  // Process arrow row showing 4 stages.
  const stages = [
    { h: "Scrape",  d: "BBC / Guardian\nmatch-report HTML" },
    { h: "Parse",   d: "BeautifulSoup →\narticle text" },
    { h: "NLP",     d: "spaCy NER + VADER +\nregex event classifier" },
    { h: "Attach",  d: "Per-team sentiment +\n12 feature columns" },
  ];
  const sx0 = 0.5, sy = 1.55, sw = 2.10, sh = 1.10, sgap = 0.20;
  stages.forEach((st, i) => {
    const x = sx0 + i * (sw + sgap);
    s.addShape("rect", { x, y: sy, w: sw, h: sh,
      fill: { color: COLOR.NAVY }, line: { type: "none" }, shadow: cardShadow(),
    });
    s.addText(`${i + 1}`, {
      x: x + 0.10, y: sy + 0.08, w: 0.4, h: 0.3,
      fontFace: FONT.HEAD, fontSize: 16, bold: true, color: COLOR.SKY, margin: 0,
    });
    s.addText(st.h, {
      x: x + 0.50, y: sy + 0.08, w: sw - 0.55, h: 0.30,
      fontFace: FONT.BODY, fontSize: 13, bold: true, color: COLOR.WHITE, margin: 0,
    });
    s.addText(st.d, {
      x: x + 0.10, y: sy + 0.45, w: sw - 0.20, h: sh - 0.50,
      fontFace: FONT.BODY, fontSize: 10, color: COLOR.SKY, lineSpacingMultiple: 1.2, margin: 0,
    });
    if (i < stages.length - 1) {
      s.addText("→", {
        x: x + sw - 0.05, y: sy + sh / 2 - 0.20, w: sgap + 0.10, h: 0.40,
        fontFace: FONT.HEAD, fontSize: 22, bold: true, color: COLOR.CORAL,
        align: "center", margin: 0,
      });
    }
  });

  // Worked example block: input vs output.
  const ex_y = 2.95;
  const ex_card_h = 1.55;
  s.addText("Worked example", {
    x: 0.5, y: ex_y, w: 9.0, h: 0.28,
    fontFace: FONT.BODY, fontSize: 11, bold: true, charSpacing: 3, color: COLOR.PITCH, margin: 0,
  });

  // Input card.
  s.addShape("rect", {
    x: 0.5, y: ex_y + 0.30, w: 4.55, h: ex_card_h,
    fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
    shadow: cardShadow(),
  });
  s.addShape("rect", { x: 0.5, y: ex_y + 0.30, w: 0.06, h: ex_card_h, fill: { color: COLOR.SKY_DK }, line: { type: "none" } });
  s.addText("INPUT  ·  one sentence in", {
    x: 0.65, y: ex_y + 0.38, w: 4.30, h: 0.25,
    fontFace: FONT.BODY, fontSize: 9.5, bold: true, charSpacing: 2, color: COLOR.MUTED, margin: 0,
  });
  s.addText(
`"Liverpool were sloppy in possession and were lucky to escape with a draw after a controversial VAR call denied Tottenham a stoppage-time winner."`,
  {
    x: 0.65, y: ex_y + 0.62, w: 4.30, h: 1.10,
    fontFace: FONT.HEAD, italic: true, fontSize: 10.5, color: COLOR.INK,
    lineSpacingMultiple: 1.20, margin: 0,
  });

  // Output card.
  s.addShape("rect", {
    x: 5.20, y: ex_y + 0.30, w: 4.30, h: ex_card_h,
    fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
    shadow: cardShadow(),
  });
  s.addShape("rect", { x: 5.20, y: ex_y + 0.30, w: 0.06, h: ex_card_h, fill: { color: COLOR.CORAL }, line: { type: "none" } });
  s.addText("OUTPUT  ·  one feature row out", {
    x: 5.35, y: ex_y + 0.38, w: 4.05, h: 0.25,
    fontFace: FONT.BODY, fontSize: 9.5, bold: true, charSpacing: 2, color: COLOR.MUTED, margin: 0,
  });
  s.addText([
    { text: "home_report_sentiment", options: { fontFace: "Consolas", color: COLOR.NAVY } },
    { text: "  =  -0.42\n", options: { bold: true, color: COLOR.INK } },
    { text: "away_report_sentiment", options: { fontFace: "Consolas", color: COLOR.NAVY } },
    { text: "  =  +0.05\n", options: { bold: true, color: COLOR.INK } },
    { text: "var_mention_count    ", options: { fontFace: "Consolas", color: COLOR.NAVY } },
    { text: "  =  1\n", options: { bold: true, color: COLOR.INK } },
    { text: "controversy_flag     ", options: { fontFace: "Consolas", color: COLOR.NAVY } },
    { text: "  =  1", options: { bold: true, color: COLOR.CORAL } },
  ], {
    x: 5.35, y: ex_y + 0.62, w: 4.05, h: 1.10,
    fontFace: FONT.BODY, fontSize: 10.5, lineSpacingMultiple: 1.20, margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 5 (Unstructured to structured). ~55s.

This is the slide I am personally proudest of, because the rubric specifically calls out unstructured data and most teams stop at scraping CSVs.

The pipeline is four stages, shown across the top. We scrape the BBC and Guardian match-report HTML. We use BeautifulSoup to extract the article body text. We then run that text through three NLP layers in parallel. SpaCy with the English small model gives us named-entity recognition, which we use to count the people mentioned per side. VADER sentiment scores every sentence and we attribute it to whichever team is mentioned in that sentence — that's our per-team sentiment. And a regex classifier flags red cards, penalties, VAR mentions, and a controversy flag. All of that flows into roughly twelve derived columns per match.

The worked example at the bottom makes it concrete. The input is one sentence from a match report — "Liverpool were sloppy and were lucky to escape with a draw after a controversial VAR call denied Tottenham a winner." The output is what our pipeline writes to the parquet table for that match: home_report_sentiment is negative-point-four-two, away_report_sentiment is mildly positive, the VAR mention count is one, and the controversy flag fires. Those four numbers, combined with about eight others from the same article, become inputs to the model.

[Spend ~55s here. The unstructured story is the rubric magnet — slow down.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 6 — EDA
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 6, TOTAL);
  slideTitle(s, "Three figures that shaped our modelling", "EDA");

  // Three figure placeholders horizontally.
  const figs = [
    { t: "Home-win rate by season",
      c: "Annotate the Covid-2020 dip from ~46% to ~36%.",
      f: "figures/eda_home_win_by_season.png" },
    { t: "Goals-per-match distribution",
      c: "Right-skewed; mean ≈ 2.7 goals; supports the Poisson choice.",
      f: "figures/eda_goal_distribution.png" },
    { t: "Team-style PCA, coloured by season",
      c: "Style clusters drift over time — useful unsupervised feature.",
      f: "figures/eda_team_style_pca.png" },
  ];
  const fx0 = 0.5, fy = 1.45, fw = 3.00, fh = 1.90, fgap = 0.15;
  figs.forEach((f, i) => {
    const x = fx0 + i * (fw + fgap);
    // Placeholder rectangle for the figure.
    s.addShape("rect", {
      x, y: fy, w: fw, h: fh,
      fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
      shadow: cardShadow(),
    });
    s.addText("FIGURE PLACEHOLDER", {
      x, y: fy + fh/2 - 0.45, w: fw, h: 0.30,
      fontFace: FONT.BODY, fontSize: 9, bold: true, color: COLOR.SKY_DK,
      align: "center", charSpacing: 4, margin: 0,
    });
    s.addText(f.f, {
      x, y: fy + fh/2 - 0.10, w: fw, h: 0.25,
      fontFace: "Consolas", fontSize: 9, color: COLOR.MUTED,
      align: "center", margin: 0,
    });
    s.addText(f.t, {
      x, y: fy + fh + 0.08, w: fw, h: 0.30,
      fontFace: FONT.BODY, fontSize: 12, bold: true, color: COLOR.NAVY, margin: 0,
    });
    s.addText(f.c, {
      x, y: fy + fh + 0.40, w: fw, h: 0.50,
      fontFace: FONT.BODY, fontSize: 10, color: COLOR.MUTED,
      lineSpacingMultiple: 1.20, margin: 0,
    });
  });

  // Key finding banner — placed below the captions, above the footer rule.
  s.addShape("rect", { x: 0.5, y: 4.65, w: W - 1.0, h: 0.42,
    fill: { color: COLOR.NAVY }, line: { type: "none" } });
  s.addShape("rect", { x: 0.5, y: 4.65, w: 0.06, h: 0.42, fill: { color: COLOR.CORAL }, line: { type: "none" } });
  s.addText("KEY FINDING", {
    x: 0.65, y: 4.65, w: 1.5, h: 0.42,
    fontFace: FONT.BODY, fontSize: 9, bold: true, color: COLOR.SKY,
    valign: "middle", charSpacing: 4, margin: 0,
  });
  s.addText("The 2020-21 Covid season is a regime shift our model has to handle, not pretend away.", {
    x: 2.10, y: 4.65, w: 7.30, h: 0.42,
    fontFace: FONT.BODY, italic: true, fontSize: 12, color: COLOR.WHITE,
    valign: "middle", margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 6 (EDA). ~50s.

Three quick figures from EDA that ended up actually shaping how we built the model. Note that the figure placeholders here will be regenerated by the EDA pipeline into the figures/ directory before the in-class talk — the captions tell you exactly what each one shows.

The leftmost figure is home-win rate plotted by season. For two decades it sits flat around forty-six percent, and then in 2020-21 it falls off a cliff to about thirty-six percent — that's the Covid empty-stadiums effect, and it's the single most important fact about our test set.

The middle figure is the distribution of total goals per match. It's right-skewed with a mean of about two-point-seven. That shape is exactly what justifies modelling scores as Poisson — and it's why we put a Dixon-Coles model in the zoo as a domain-specific complement to the gradient-boosted classifiers.

The rightmost figure is a PCA projection of team-season-aggregate stats — possession, shots, xG, etc. — coloured by season. The clusters are real, they correspond to playing-style archetypes, and they drift over time as tactics evolve. We use those PCA components and a K-means cluster ID as inputs to the supervised model. That's our unsupervised-learning hook for the rubric.

The takeaway in the navy banner is the punch line: 2020-21 is a regime shift. Our model has to be robust to it, not blind to it.

[Spend ~50s here.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 7 — FEATURE ENGINEERING
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 7, TOTAL);
  slideTitle(s, "Six feature families, one strict cutoff rule", "Feature engineering");

  // Six feature-family cards in 2x3.
  const fams = [
    { h: "Form",         d: "Rolling N-match goals, points, xG. Leakage-safe shift." },
    { h: "Strength",     d: "ClubElo + own Elo update; home-Elo minus away-Elo." },
    { h: "Context",      d: "Rest days, derby flag, manager tenure." },
    { h: "Market",       d: "Pinnacle implied probabilities, vig-removed." },
    { h: "Unsupervised", d: "PCA components + K-means style cluster ID." },
    { h: "NLP-derived",  d: "Per-team sentiment, event tags, controversy flag." },
  ];
  const gx0 = 0.5, gy0 = 1.45, gw = 3.00, gh = 1.20, hgap = 0.15, vgap = 0.15;
  fams.forEach((it, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = gx0 + col * (gw + hgap);
    const y = gy0 + row * (gh + vgap);
    s.addShape("rect", {
      x, y, w: gw, h: gh,
      fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
      shadow: cardShadow(),
    });
    s.addShape("rect", { x, y, w: 0.06, h: gh, fill: { color: COLOR.SKY_DK }, line: { type: "none" } });
    s.addText(it.h, {
      x: x + 0.18, y: y + 0.10, w: gw - 0.25, h: 0.32,
      fontFace: FONT.HEAD, fontSize: 14, bold: true, color: COLOR.NAVY, margin: 0,
    });
    s.addText(it.d, {
      x: x + 0.18, y: y + 0.45, w: gw - 0.25, h: gh - 0.55,
      fontFace: FONT.BODY, fontSize: 10.5, color: COLOR.INK,
      lineSpacingMultiple: 1.25, margin: 0,
    });
  });

  // Anti-leakage rail along the bottom.
  s.addShape("rect", { x: 0.5, y: 4.30, w: W - 1.0, h: 0.95,
    fill: { color: COLOR.NAVY }, line: { type: "none" } });
  s.addShape("rect", { x: 0.5, y: 4.30, w: 0.06, h: 0.95, fill: { color: COLOR.CORAL }, line: { type: "none" } });
  s.addText("ANTI-LEAKAGE DISCIPLINE", {
    x: 0.7, y: 4.38, w: 4.00, h: 0.28,
    fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.SKY, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: "No random k-fold.   ", options: { bold: true, color: COLOR.WHITE } },
    { text: "Walk-forward CV only.   ", options: { color: COLOR.SKY } },
    { text: "Every rolling feature uses a strict ", options: { color: COLOR.WHITE } },
    { text: "as_of", options: { fontFace: "Consolas", color: COLOR.CORAL } },
    { text: " cutoff: only matches with kickoff < current match contribute.", options: { color: COLOR.WHITE } },
  ], {
    x: 0.7, y: 4.65, w: W - 1.4, h: 0.30,
    fontFace: FONT.BODY, fontSize: 11, margin: 0,
  });
  s.addText([
    { text: "Unit-tested by  ", options: { color: COLOR.SKY } },
    { text: "tests.test_no_temporal_leakage", options: { fontFace: "Consolas", color: COLOR.CORAL, bold: true } },
    { text: "  in the CI pipeline on every push.", options: { color: COLOR.SKY } },
  ], {
    x: 0.7, y: 4.93, w: W - 1.4, h: 0.30,
    fontFace: FONT.BODY, italic: true, fontSize: 10.5, margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 7 (Features). ~55s.

We engineered six families of features, shown in the 2-by-3 grid. The first three are the obvious ones for football. Form: rolling N-match averages of goals, points, xG, computed separately for last three / five / ten matches. Strength: club Elo from ClubElo plus our own Elo update, expressed as the home-minus-away Elo difference. Context: rest days since last match, derby flag for historic local rivalries, manager-tenure days. The fourth family is market features — the closing-odds implied probabilities from Pinnacle, with the bookmaker margin removed by renormalising H, D, and A to sum to one. The fifth family is the unsupervised hook the rubric asks for: PCA components on team-season aggregate stats plus a K-means style cluster ID. And the sixth is the NLP-derived features we just saw on the previous slide.

The rail at the bottom is the discipline story, which I want to emphasise. Football leakage is the classic trap — random k-fold lets the future inform the past. We never use random k-fold. We use walk-forward expanding-window CV. And every rolling feature is computed with a strict as_of cutoff: only matches with kickoff strictly less than the current match are allowed to contribute. That invariant is unit-tested by tests.test_no_temporal_leakage and runs on every push in CI.

[Spend ~55s here. Speed up if behind.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 8 — MODELS
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 8, TOTAL);
  slideTitle(s, "Six models, one validation strategy", "Models");

  const rows = [
    [
      { text: "Model",      options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 11 } },
      { text: "Family",     options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 11 } },
      { text: "Why we included it", options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 11 } },
    ],
    ["Always-Home",     "Naive baseline",       "Sanity floor — exposes log-loss penalty for over-confidence."],
    ["Class-Prior",     "Naive baseline",       "Predicts historical 46/25/29 H/D/A — the calibration floor."],
    ["Market-Implied",  "Strong baseline",      "Pinnacle closing odds, vig-removed. The hardest bar to clear."],
    ["Multinomial LR",  "Linear, interpretable","Reads off feature signs and magnitudes for sanity-checking."],
    ["Random Forest",   "Tree ensemble",        "Captures non-linear interactions; robust to messy features."],
    ["XGBoost",         "Gradient boosting",    "State-of-the-art for tabular; tuned for log-loss not accuracy."],
    ["Dixon-Coles",     "Bivariate Poisson",    "Domain-specific; gives joint score distribution + outcome."],
  ];
  s.addTable(rows, {
    x: 0.5, y: 1.45, w: W - 1.0, h: 2.65,
    colW: [1.85, 2.10, 5.05],
    fontSize: 10.5, fontFace: FONT.BODY, color: COLOR.INK,
    border: { type: "solid", pt: 0.5, color: COLOR.RULE },
    rowH: 0.33, valign: "middle",
  });

  // Validation strip — placed safely above the footer rule.
  s.addShape("rect", { x: 0.5, y: 4.30, w: W - 1.0, h: 0.78,
    fill: { color: COLOR.SKY }, line: { type: "none" } });
  s.addText("VALIDATION", {
    x: 0.7, y: 4.36, w: 1.5, h: 0.25,
    fontFace: FONT.BODY, fontSize: 9.5, bold: true, color: COLOR.NAVY, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: "Walk-forward expanding-window CV", options: { bold: true } },
    { text: "  ·  train 2000-01..2018-19, validate 2019-20, hold-out test 2020-21.\n", options: {} },
    { text: "All hyperparameters tuned for log-loss",  options: { bold: true } },
    { text: " (proper scoring rule), not raw accuracy.", options: {} },
  ], {
    x: 0.7, y: 4.62, w: W - 1.4, h: 0.42,
    fontFace: FONT.BODY, fontSize: 11, color: COLOR.NAVY,
    lineSpacingMultiple: 1.20, margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 8 (Model zoo). ~55s.

Six models — actually seven if you count both naive baselines. Reading down the table: Always-Home is the sanity floor — it exposes how brutally log-loss punishes confident wrong probabilities. Class-Prior just predicts the historical class frequencies, which is the calibration floor. Market-Implied is the strong baseline — Pinnacle's closing odds with the bookmaker margin removed by renormalisation. That's the hardest bar to clear.

Then the real models. Multinomial logistic regression is our interpretable workhorse — when XGBoost and the Random Forest disagree we read off the LR coefficients to figure out why. Random Forest captures non-linear interactions and is robust to noisy features. XGBoost is the state-of-the-art for tabular data and we tuned it specifically for log-loss, not accuracy. Last is Dixon-Coles — a domain-specific bivariate Poisson that models home-goals and away-goals jointly, with the famous low-score correction term to fix the under-prediction of nil-nils that vanilla Poisson suffers from.

Validation, in the sky-blue strip: walk-forward expanding-window CV. Train on 2000-01 through 2018-19, validate on 2019-20, and hold out 2020-21 for the final test we never look at until the end. And we tune every hyperparameter for log-loss, because log-loss is a proper scoring rule and accuracy on a three-class problem is too coarse to differentiate models.

[Spend ~55s here.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 9 — RESULTS
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 9, TOTAL);
  slideTitle(s, "The market wins. Our model gets within touching distance.", "Results");

  // Leaderboard table — verbatim from results/leaderboard.csv.
  const lb = [
    [
      { text: "Model",         options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10.5 } },
      { text: "Accuracy",      options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10.5, align: "right" } },
      { text: "Log-loss",      options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10.5, align: "right" } },
      { text: "Brier",         options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10.5, align: "right" } },
      { text: "F1 macro",      options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10.5, align: "right" } },
      { text: "AUC OvR",       options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10.5, align: "right" } },
    ],
    [
      { text: "Market-implied (Pinnacle close)", options: { bold: true, color: COLOR.CORAL, fill: { color: "FDF1ED" } } },
      { text: "0.516",  options: { color: COLOR.CORAL, bold: true, align: "right", fill: { color: "FDF1ED" } } },
      { text: "0.997",  options: { color: COLOR.CORAL, bold: true, align: "right", fill: { color: "FDF1ED" } } },
      { text: "0.592",  options: { color: COLOR.CORAL, bold: true, align: "right", fill: { color: "FDF1ED" } } },
      { text: "0.385",  options: { color: COLOR.CORAL, bold: true, align: "right", fill: { color: "FDF1ED" } } },
      { text: "0.669",  options: { color: COLOR.CORAL, bold: true, align: "right", fill: { color: "FDF1ED" } } },
    ],
    ["Random Forest",       { text: "0.513", options: { align: "right" } }, { text: "1.017", options: { align: "right" } }, { text: "0.606", options: { align: "right" } }, { text: "0.461", options: { align: "right" } }, { text: "0.646", options: { align: "right" } }],
    ["Logistic regression", { text: "0.503", options: { align: "right" } }, { text: "1.026", options: { align: "right" } }, { text: "0.610", options: { align: "right" } }, { text: "0.466", options: { align: "right" } }, { text: "0.654", options: { align: "right" } }],
    ["XGBoost",             { text: "0.511", options: { align: "right" } }, { text: "1.092", options: { align: "right" } }, { text: "0.640", options: { align: "right" } }, { text: "0.431", options: { align: "right" } }, { text: "0.628", options: { align: "right" } }],
    ["Class-prior baseline",{ text: "0.379", options: { align: "right" } }, { text: "1.099", options: { align: "right" } }, { text: "0.669", options: { align: "right" } }, { text: "0.183", options: { align: "right" } }, { text: "0.500", options: { align: "right" } }],
    [
      { text: "Always-Home baseline", options: { color: COLOR.MUTED } },
      { text: "0.379",  options: { color: COLOR.MUTED, align: "right" } },
      { text: "22.385", options: { color: COLOR.CORAL, bold: true, align: "right" } },
      { text: "1.242",  options: { color: COLOR.MUTED, align: "right" } },
      { text: "0.183",  options: { color: COLOR.MUTED, align: "right" } },
      { text: "0.500",  options: { color: COLOR.MUTED, align: "right" } },
    ],
  ];
  s.addTable(lb, {
    x: 0.5, y: 1.45, w: 6.30, h: 2.85,
    colW: [2.50, 0.80, 0.80, 0.70, 0.80, 0.70],
    fontSize: 10, fontFace: FONT.BODY, color: COLOR.INK,
    border: { type: "solid", pt: 0.5, color: COLOR.RULE },
    rowH: 0.34, valign: "middle",
  });

  // Right column: confusion-matrix placeholder + narrative.
  s.addShape("rect", {
    x: 7.05, y: 1.45, w: 2.45, h: 1.95,
    fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
    shadow: cardShadow(),
  });
  s.addText("CONFUSION MATRIX", {
    x: 7.05, y: 1.55, w: 2.45, h: 0.25,
    fontFace: FONT.BODY, fontSize: 9, bold: true, color: COLOR.SKY_DK,
    align: "center", charSpacing: 3, margin: 0,
  });
  s.addText("figures/confusion_matrix_rf.png", {
    x: 7.05, y: 2.30, w: 2.45, h: 0.25,
    fontFace: "Consolas", fontSize: 8, color: COLOR.MUTED,
    align: "center", margin: 0,
  });
  s.addText("Most errors: Draw → Home / Away.\nDraws are intrinsically the hardest class.", {
    x: 7.10, y: 2.65, w: 2.35, h: 0.65,
    fontFace: FONT.BODY, italic: true, fontSize: 10, color: COLOR.MUTED,
    align: "center", lineSpacingMultiple: 1.25, margin: 0,
  });

  // Narrative pull-quote at the bottom.
  s.addShape("rect", { x: 0.5, y: 4.45, w: W - 1.0, h: 0.80,
    fill: { color: COLOR.NAVY }, line: { type: "none" } });
  s.addShape("rect", { x: 0.5, y: 4.45, w: 0.06, h: 0.80, fill: { color: COLOR.CORAL }, line: { type: "none" } });
  s.addText([
    { text: "Random Forest is within 0.3pp accuracy and 0.02 log-loss of the market", options: { bold: true, color: COLOR.WHITE } },
    { text: " — using only the same engineered features the market presumably already prices.\n", options: { color: COLOR.SKY } },
    { text: "And Always-Home's log-loss of 22.4? ", options: { color: COLOR.SKY } },
    { text: "That's the cost of being confidently wrong about Draws and Aways.", options: { italic: true, color: COLOR.WHITE } },
  ], {
    x: 0.7, y: 4.50, w: W - 1.4, h: 0.70,
    fontFace: FONT.BODY, fontSize: 11.5, lineSpacingMultiple: 1.25, valign: "middle", margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 9 (Results — the headline). ~70s. THIS IS THE PUNCH-LINE SLIDE.

This is the most important slide of the talk. Let me read the table top to bottom.

Sorted by log-loss, the leader is the market-implied baseline — Pinnacle's closing odds, with the bookmaker margin removed. Log-loss zero-point-nine-nine-seven, accuracy fifty-one-point-six percent. That's the hardest bar.

Random Forest is second: log-loss one-point-zero-one-seven, accuracy fifty-one-point-three percent. We are within zero-point-three percentage points of accuracy and about two percentage points of log-loss to the bookmakers — using only the engineered features they presumably already price into their odds. That is genuinely close.

Logistic regression and XGBoost trail Random Forest by another point or two. The two genuinely-naive baselines — class-prior and always-home — both get thirty-eight percent accuracy. But look at the always-home log-loss in coral on the bottom row: twenty-two-point-four. That is what happens when you assign probability one to the wrong class — log-loss is a proper scoring rule, and it punishes confident wrong predictions catastrophically. That number alone justifies why log-loss is our headline metric.

The card on the right is the confusion matrix; the figure is regenerated by the pipeline. The pattern is consistent across all our models: most errors are Draws being predicted as Home or Away wins. Draws are intrinsically the hardest class because they are not anyone's favoured outcome.

The narrative in the navy banner is the honest finding: the market is genuinely hard to beat. Our model gets within touching distance, but it does not surpass the market. Being honest about that is the correct read.

[Spend a full 70 seconds on this slide. It is the single most important moment of the talk.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 10 — BONUS TARGETS
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 10, TOTAL);
  slideTitle(s, "Three bonus targets, one shared engine", "Beyond H/D/A");

  const items = [
    {
      h: "Exact score",
      pill: "Dixon-Coles",
      d: "Joint home-goals × away-goals from the bivariate Poisson model. " +
         "Fitted with a 0.0065/day exponential decay weight; the tau correction term " +
         "fixes under-prediction of (0,0), (0,1), (1,0), (1,1) scorelines.",
    },
    {
      h: "Final standings",
      pill: "Monte Carlo",
      d: "10,000 simulations of the 380-match season. Each iteration rolls " +
         "every match's H/D/A from the per-match probabilities, accumulates points, " +
         "ranks teams. Output: title prob, top-4 prob, relegation prob with 5/95 bands.",
    },
    {
      h: "Beat the bookmaker",
      pill: "Kelly-fractional",
      d: "Place when model edge = (p × decimal_odds − 1) > 0. Stake = " +
         "Kelly fraction capped at 5% of bankroll. ROI on the 2020-21 season is " +
         "the cleanest test — model conviction translated to dollars.",
    },
  ];
  const py = 1.50, ph = 1.10, pgap = 0.18;
  items.forEach((it, i) => {
    const y = py + i * (ph + pgap);
    s.addShape("rect", {
      x: 0.5, y, w: W - 1.0, h: ph,
      fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
      shadow: cardShadow(),
    });
    s.addShape("rect", { x: 0.5, y, w: 0.06, h: ph, fill: { color: COLOR.CORAL }, line: { type: "none" } });
    s.addText(it.h, {
      x: 0.70, y: y + 0.10, w: 3.0, h: 0.40,
      fontFace: FONT.HEAD, fontSize: 18, bold: true, color: COLOR.NAVY, margin: 0,
    });
    // Pill.
    s.addShape("roundRect", {
      x: 3.85, y: y + 0.20, w: 1.55, h: 0.30,
      fill: { color: COLOR.NAVY }, line: { type: "none" }, rectRadius: 0.06,
    });
    s.addText(it.pill, {
      x: 3.85, y: y + 0.20, w: 1.55, h: 0.30,
      fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.SKY,
      align: "center", valign: "middle", margin: 0,
    });
    s.addText(it.d, {
      x: 0.70, y: y + 0.55, w: W - 1.4, h: ph - 0.60,
      fontFace: FONT.BODY, fontSize: 11.5, color: COLOR.INK,
      lineSpacingMultiple: 1.25, margin: 0,
    });
  });

  s.addNotes(
`Speaker notes — Slide 10 (Bonus targets). ~50s.

Three bonus targets. All three share the same probabilistic engine — they're different ways of stress-testing the same per-match probabilities.

First: exact score from Dixon-Coles. Bivariate Poisson on home-goals and away-goals, fitted with a daily exponential decay so recent matches matter more, plus the tau correction that fixes the well-known under-prediction of low-low scorelines like nil-nil and one-one. That gives us a joint score distribution we can marginalise to H/D/A or report as the single most-likely scoreline.

Second: final standings via Monte Carlo. We take per-match probabilities and roll the entire 380-match season ten thousand times. Each iteration draws every match outcome, accumulates points, and ranks the table. Aggregating across iterations gives you each team's title probability, top-four probability, and relegation probability — and 5th-and-95th-percentile bands on their final ranking.

Third: beat the bookmaker. Kelly-fractional staking, capped at five percent of bankroll per bet. We place a bet only when the model's edge — that's probability times decimal odds minus one — is strictly positive. ROI on the held-out 2020-21 season is the cleanest test of the model: this is conviction translated to dollars.

The bonus-target tab in the live demo lets you re-roll each of these on the spot.

[Spend ~50s here.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 11 — LIVE DEMO
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 11, TOTAL);
  slideTitle(s, "Live: a Shiny app on Posit Connect Cloud", "Demo");

  // Three demo tiles for the three tabs.
  const tabs = [
    { h: "Predict-a-Match",   d: "Pick any 2020-21 fixture; see model probabilities, market probabilities, and the implied edge." },
    { h: "Season Simulator",  d: "10,000 Monte Carlo runs of the 2020-21 table; live histogram of each team's finishing rank." },
    { h: "Leaderboard",       d: "Full evaluation: log-loss, Brier, calibration plot, confusion matrix per model." },
  ];
  const tx0 = 0.5, ty = 1.50, tw = 3.00, th = 2.80, tgap = 0.15;
  tabs.forEach((tab, i) => {
    const x = tx0 + i * (tw + tgap);
    s.addShape("rect", {
      x, y: ty, w: tw, h: th,
      fill: { color: COLOR.WHITE }, line: { color: COLOR.RULE, width: 0.75 },
      shadow: cardShadow(),
    });
    // Screenshot placeholder area.
    s.addShape("rect", {
      x: x + 0.15, y: ty + 0.15, w: tw - 0.30, h: 1.20,
      fill: { color: COLOR.PAPER }, line: { color: COLOR.RULE, width: 0.5 },
    });
    s.addText("SCREENSHOT", {
      x: x + 0.15, y: ty + 0.55, w: tw - 0.30, h: 0.30,
      fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.SKY_DK,
      align: "center", charSpacing: 3, margin: 0,
    });
    s.addText(`figures/demo_${i + 1}_${tab.h.toLowerCase().replace(/[^a-z]/g, "_")}.png`, {
      x: x + 0.15, y: ty + 0.85, w: tw - 0.30, h: 0.25,
      fontFace: "Consolas", fontSize: 8, color: COLOR.MUTED,
      align: "center", margin: 0,
    });
    // Title strip.
    s.addShape("rect", { x, y: ty + 1.50, w: 0.06, h: th - 1.55, fill: { color: COLOR.CORAL }, line: { type: "none" } });
    s.addText(`Tab ${i + 1}.   ${tab.h}`, {
      x: x + 0.18, y: ty + 1.55, w: tw - 0.30, h: 0.35,
      fontFace: FONT.HEAD, fontSize: 14, bold: true, color: COLOR.NAVY, margin: 0,
    });
    s.addText(tab.d, {
      x: x + 0.18, y: ty + 1.92, w: tw - 0.30, h: th - 2.00,
      fontFace: FONT.BODY, fontSize: 11, color: COLOR.INK,
      lineSpacingMultiple: 1.25, margin: 0,
    });
  });

  // URL strip — placed above the footer rule.
  s.addShape("rect", { x: 0.5, y: 4.45, w: W - 1.0, h: 0.50,
    fill: { color: COLOR.NAVY }, line: { type: "none" } });
  s.addShape("rect", { x: 0.5, y: 4.45, w: 0.06, h: 0.50, fill: { color: COLOR.CORAL }, line: { type: "none" } });
  s.addText([
    { text: "Live URL:  ", options: { bold: true, color: COLOR.SKY } },
    { text: "{TODO: pipeline owner to paste new Posit Connect Cloud URL}", options: { fontFace: "Consolas", color: COLOR.WHITE } },
  ], {
    x: 0.7, y: 4.45, w: W - 1.4, h: 0.50,
    fontFace: FONT.BODY, fontSize: 11, valign: "middle", margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 11 (Live demo). ~70s — DEMO IS THE STAR.

We deployed a Shiny-for-Python app to Posit Connect Cloud so anyone can replay the predictions interactively. Three tabs, shown across the slide.

Tab one: Predict-a-Match. Pick any 2020-21 fixture from the dropdown. The app shows our model's H/D/A probabilities, the market's H/D/A probabilities, and the implied edge — positive edges are highlighted in coral.

Tab two: Season Simulator. One click runs ten thousand Monte Carlo simulations of the entire 2020-21 season and gives you a live histogram of where each team finishes. You can filter by team, sort by title probability, by top-four probability, by relegation probability.

Tab three: Leaderboard. The full evaluation suite from the previous slide, presented interactively — a calibration plot, confusion matrix per model, and the metrics table sortable by any column.

The screenshots on the slide will be replaced with fresh captures from the deployed app the morning of the talk.

I'll switch to the live app now and walk through one match end-to-end. [About 30 seconds at the laptop, then return to the deck.]

[Total ~70s for this slide because of the live transition.]`
  );
}

// ---------------------------------------------------------------------------
// SLIDE 12 — CONCLUSION + TEAM
// ---------------------------------------------------------------------------
{
  const s = pres.addSlide();
  paintContentChrome(s, 12, TOTAL);
  slideTitle(s, "What we shipped, what's next, who did what", "Conclusion");

  // TL;DR block — give it more vertical room so the last line is not clipped.
  s.addShape("rect", {
    x: 0.5, y: 1.45, w: W - 1.0, h: 1.40,
    fill: { color: COLOR.NAVY }, line: { type: "none" },
  });
  s.addShape("rect", { x: 0.5, y: 1.45, w: 0.06, h: 1.40, fill: { color: COLOR.CORAL }, line: { type: "none" } });
  s.addText("TL;DR", {
    x: 0.65, y: 1.55, w: 1.0, h: 0.30,
    fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.SKY, charSpacing: 4, margin: 0,
  });
  s.addText(
    "End-to-end ML on 7,890 self-collected matches. Six models, walk-forward CV, " +
    "four interlinked targets, deployed Shiny app. " +
    "Random Forest within 0.3pp accuracy of the bookmakers — but the bookmakers still win. " +
    "The honest finding: the market is genuinely hard to beat, and that itself is the result.",
  {
    x: 1.70, y: 1.50, w: W - 2.40, h: 1.30,
    fontFace: FONT.HEAD, italic: true, fontSize: 12.5, color: COLOR.WHITE,
    lineSpacingMultiple: 1.30, valign: "middle", margin: 0,
  });

  // Future work column (left).
  s.addText("FUTURE WORK", {
    x: 0.5, y: 2.95, w: 4.5, h: 0.25,
    fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.PITCH, charSpacing: 4, margin: 0,
  });
  s.addText([
    { text: "In-play features.   ", options: { bold: true } },
    { text: "Live xG, possession-by-half, lineup-strength deltas.\n", options: { color: COLOR.MUTED } },
    { text: "Hierarchical Bayes.   ", options: { bold: true } },
    { text: "Borrow strength across seasons; tighter cold-start for promoted clubs.", options: { color: COLOR.MUTED } },
  ], {
    x: 0.5, y: 3.22, w: 4.5, h: 1.20,
    fontFace: FONT.BODY, fontSize: 11.5, color: COLOR.INK,
    paraSpaceAfter: 6, lineSpacingMultiple: 1.30, margin: 0,
  });

  // Team contributions table (right).
  s.addText("TEAM CONTRIBUTIONS", {
    x: 5.20, y: 2.95, w: 4.3, h: 0.25,
    fontFace: FONT.BODY, fontSize: 10, bold: true, color: COLOR.PITCH, charSpacing: 4, margin: 0,
  });
  const teamRows = [
    [
      { text: "Member",       options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10 } },
      { text: "Contribution", options: { bold: true, color: COLOR.WHITE, fill: { color: COLOR.NAVY }, fontSize: 10 } },
    ],
    [{ text: "Zeming Liang", options: { bold: true } }, "Coordinator; scrapers, models, app, deploy."],
    [{ text: "Xiying Chen",  options: { bold: true } }, "EDA, unsupervised features, NLP, report."],
    [{ text: "Collaborator", options: { bold: true } }, "{TODO: confirm contribution}"],
  ];
  s.addTable(teamRows, {
    x: 5.20, y: 3.22, w: 4.30, h: 1.36,
    colW: [1.40, 2.90],
    fontSize: 9, fontFace: FONT.BODY, color: COLOR.INK,
    border: { type: "solid", pt: 0.5, color: COLOR.RULE },
    rowH: 0.32, valign: "middle",
  });

  // Closing line — placed safely above the footer rule.
  s.addShape("rect", { x: 0.5, y: 4.65, w: W - 1.0, h: 0.45,
    fill: { color: COLOR.SKY }, line: { type: "none" } });
  s.addText([
    { text: "Thank you.   ", options: { bold: true, color: COLOR.NAVY } },
    { text: "Questions?   ", options: { italic: true, color: COLOR.NAVY } },
    { text: "github.com/ZemingLiang/STAT5243-Project-4", options: { fontFace: "Consolas", color: COLOR.PITCH } },
  ], {
    x: 0.5, y: 4.65, w: W - 1.0, h: 0.45,
    fontFace: FONT.HEAD, fontSize: 14, align: "center", valign: "middle", margin: 0,
  });

  s.addNotes(
`Speaker notes — Slide 12 (Conclusion + team). ~45s.

Wrapping up. The TL;DR in the navy banner: end-to-end machine learning on nearly 8,000 self-collected matches, with six models, walk-forward cross-validation, four interlinked targets, and a deployed Shiny app. Random Forest gets within zero-point-three percentage points of the bookmakers — but the bookmakers still win. We're not going to spin that. The honest finding is that the closing market is genuinely hard to beat, and that itself is the result.

Two future-work bullets on the left. First, in-play features — live expected-goals, possession-by-half, and lineup-strength deltas would let us predict the second half conditioned on the first. Second, a hierarchical Bayesian model — borrowing strength across seasons would meaningfully tighten the cold-start problem for newly-promoted clubs.

Team contributions on the right. Zeming led the end-to-end coordination, the scrapers, the modelling, and the deployment. Elina led the EDA, the unsupervised features, the NLP pipeline, and the bulk of the report. Our collaborator's specific contribution will be filled in before submission.

Thank you. Happy to take questions, and the full code and report are public on GitHub at the URL on screen.

[Spend ~45s here. Then transition to Q&A.]`
  );
}

// =============================================================================
// WRITE
// =============================================================================
pres.writeFile({ fileName: "oral_10min.pptx" }).then((fname) => {
  console.log("WROTE", fname);
});
