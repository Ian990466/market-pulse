---
name: stock-analyze
description: Query stock watchlist — multi-model valuation, grade, risk flags, and detailed analysis
user-invocable: true
metadata: {"openclaw":{"always":true,"os":["darwin","linux","win32"]}}
---

## Overview

This skill reads pre-generated JSON reports from the quantitative analysis system and answers questions about stock valuations in natural language.

Reports are located at:
  ~/Desktop/Ian/stock-tracker/analytics/reports/<TICKER>/<YYYYMMDD>.json

Always use the latest dated file available for each ticker.

## Key fields to interpret

| Field | Meaning |
|---|---|
| zone | Current price zone: "Strong Buy", "Fair Buy", "Hold/Watch", "Overvalued" |
| grade | Quality score A+ to D (sector-adjusted, 6-factor weighted) |
| grade_score | Raw numeric score (higher = better) |
| signal | Key narrative flags, e.g. "Earnings accelerating · PEG 0.50 undervalued" |
| risk_flags | Array of risk warnings (e.g. "High debt/equity 2.1x", "Unprofitable") |
| my_fair_low | Composite fair value — low estimate |
| my_fair_mid | Composite fair value — mid (primary target) |
| my_fair_high | Composite fair value — high estimate |
| upside_pct | % upside (positive) or downside (negative) from current price to fair_mid |
| pe_fair_value | PE-model fair value (mid) |
| dcf_fair_value | DCF intrinsic value per share |
| valuation_methods | Array of {name, value, weight} showing each model used |
| sector | Sector classification (mega_tech, high_growth, semiconductor, etc.) |
| peg | PEG ratio (PE / EPS growth). <1 = undervalued, >2 = expensive |
| roic | Return on Invested Capital (%) |

## Single stock query

When the user asks about one stock, reply with a structured analysis:

**Format:**

## TICKER — Company Name
**Price:** $XXX | **Fair Value:** $XXX – $XXX – $XXX (low/mid/high)
**Zone:** Strong Buy | **Grade:** A+ (82pts) | **Upside:** +61%

### Valuation Models
- PE Model: $XXX (60% weight)
- DCF Model: $XXX (40% weight)

### Quality Metrics
- PEG: X.XX | ROE: XX% | ROIC: XX% | FCF Yield: X.X%
- Gross Margin: XX% | Op Margin: XX% | Net Margin: XX%

### Signals
- Earnings accelerating
- PEG 0.50 undervalued

### Risk Flags
- (list any risk_flags, or "No material risks identified")

### Summary
1-2 sentence investment thesis explaining WHY this is a Strong Buy / Fair Buy / Hold / Overvalued, referencing the key data points.

## Watchlist summary

When the user asks for a full summary or "how is the watchlist", read all latest JSONs and produce:

### 1. Zone Distribution
Group all stocks by zone, sorted by upside_pct within each group:

Strong Buy (X stocks):
  NVDA  $172 → FV $389 (+126%) | A+ | Earnings accelerating
  ...

Fair Buy (X stocks):
  MSFT  $381 → FV $520 (+36%) | A  | Pullback 31%
  ...

Hold/Watch (X stocks):
  ...

Overvalued (X stocks):
  TSLA  $367 → FV $238 (-35%) | D  | 3 risks
  ...

### 2. Top Picks (highest upside with grade A- or better)
List the top 3-5 stocks by upside_pct that also have a strong grade.

### 3. Risk Watchlist
List any stocks with 2+ risk flags, with the flags enumerated.

### 4. Market Sentiment
One-line summary based on the zone distribution (e.g., "17/21 stocks in buy territory — broadly undervalued market").

## Language

Reply in the same language the user used (English or Traditional Chinese).
