---
name: stock-news
description: Deep research news digest for stock watchlist — cross-ticker theme analysis, sentiment, and key signals
user-invocable: true
metadata: {"openclaw":{"always":true,"os":["darwin","linux","win32"]}}
---

## Overview

This skill reads daily news JSON files collected by news_fetcher.py and produces a deep research style digest. It also cross-references the quantitative reports to link news events to valuation impact.

News files are located at:
  /home/ian/Desktop/Ian/stock-tracker/analytics/news/digest/<YYYYMMDD>.json

Quantitative reports are at:
  /home/ian/Desktop/Ian/stock-tracker/analytics/reports/<TICKER>/<YYYYMMDD>.json

Each article has these fields:
  - ticker: which stock this news is related to
  - title: article headline
  - provider: news source
  - published_at: publication timestamp
  - summary: short blurb (may be empty)
  - full_text: full article body (null if paywall/JS-only)
  - has_full_text: boolean

Always use full_text when available. Fall back to summary + title when full_text is null.

## How to produce the digest

Read the latest digest JSON AND the latest quantitative reports, then produce:

---

### 1. Macro & Cross-Market Themes
Identify narratives that affect multiple tickers (e.g. AI capex cycle, rate expectations, semiconductor supply chain, energy policy). Cite which tickers are affected and how.

### 2. Per-Sector Breakdown
Group the watchlist into sectors (Mega Tech, AI/Semis, SaaS, Defense, Nuclear, Speculative) and summarize:
  - Key news per sector (2-4 sentences)
  - Current sector valuation stance (from quant reports: how many stocks are in buy vs hold vs overvalued)

### 3. Individual Stock Signals
For each ticker that has meaningful news, write 1-3 bullet points:
  - What happened
  - Why it matters (catalyst or risk)
  - Sentiment: Positive / Negative / Neutral
  - Valuation context: current zone, upside %, any risk flags from quant report

Skip tickers with no news or only noise.

### 4. Watchlist Alerts
Flag any ticker where the news suggests:
  - Earnings surprise (beat or miss)
  - Guidance change
  - Major contract win or loss
  - Regulatory or legal risk
  - Insider activity
  - Significant price move that may change the valuation zone

### 5. Summary Sentiment Table
A compact table:
  Ticker | Zone | Upside | Sentiment | Key headline (one line)

---

## Style guidelines

- Write in Traditional Chinese unless the user asks for English
- Be direct and analytical, not promotional
- Prioritize signal over noise — skip generic market commentary
- When full_text is available, cite specific data points (numbers, quotes) from the article
- Cross-reference news with quantitative data (e.g., "NVDA reported record revenue, consistent with our A+ grade and +126% upside to fair value")
- Keep the total digest under 2000 words
