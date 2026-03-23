---
name: stock-fetch
description: Fetch latest stock data for Ian's watchlist via yfinance — runs v2 multi-model analysis
user-invocable: true
metadata: {"openclaw":{"requires":{"bins":["python3"]},"os":["darwin","linux"]}}
---

## Overview

This skill runs Ian's quantitative analysis script (v2) to pull fresh data from Yahoo Finance (yfinance) and update all JSON reports.

## How to fetch

Run the following command:

  cd /home/ian/Desktop/Ian/stock-tracker/analytics && python3 analyzer.py

The script will:
1. Fetch data for all 21 tickers in the watchlist
2. Calculate PEG, ROIC, and FCF metrics
3. Run PE-model and DCF valuation
4. Generate weighted composite fair values
5. Assign sector-adjusted grades (A+ to D)
6. Generate signals and risk flags
7. Save results to reports/<TICKER>/<YYYYMMDD>.json

## After fetching

Once the script completes, automatically run /stock-analyze to summarize the updated watchlist grouped by zone and report back to the user.

## Error handling

If the script fails with a missing dependency, tell the user to run:
  pip install yfinance

If a specific ticker errors, the script continues — note any failed tickers in the summary.
