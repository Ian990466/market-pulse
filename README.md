# StockScope

Stock analysis dashboard with multi-model valuation, fundamental metrics, and automated data pipeline.

Built with [Google Stitch](https://stitch.withgoogle.com/) (frontend prototyping) + Claude Opus 4.6 (code generation).

## Architecture

```
analytics/            Python — data collection & quantitative analysis
  ├── analyzer.py       Multi-model valuation engine (PE, DCF, Speculative)
  ├── news_fetcher.py   News aggregation via yfinance + trafilatura
  └── reports/          Generated JSON reports by ticker/date

frontend/             React + TypeScript — visualization layer
  ├── server.ts         Express API serving report data
  └── src/
      ├── components/   FairValueGauge, FinancialChart, MetricsGrid, etc.
      └── hooks/        useStocks, useStockReport, useReportDates

skills/               Claude Code skills for OpenClaw AI-assisted analysis
```

## Features

- **Fair Value Gauge** — composite valuation from PE, DCF, and speculative models with zone classification (Strong Buy → Overvalued)
- **Financial Charts** — quarterly revenue, net income, EPS, and margin trends
- **Efficiency Metrics** — ROE, ROIC, FCF Yield, PEG, Debt/Equity, Current Ratio
- **Quality Grading** — sector-adjusted A+ to D scoring across 6 weighted factors
- **Risk Flags & Signals** — automated detection of high debt, earnings acceleration, undervaluation
- **Stock Comparison** — side-by-side P/E, margin, and growth analysis
- **News Digest** — cross-ticker theme analysis with full article extraction

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Recharts |
| Backend | Express 4, Node.js |
| Analytics | Python 3, yfinance, trafilatura |
| Animation | Motion (Framer Motion) |

## Setup

**Prerequisites:** Node.js, Python 3.8+

```bash
# Install dependencies
npm install
pip install yfinance trafilatura

# Start dev server (frontend + API on port 3000)
npm run dev
```

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # TypeScript type checking

# Analytics
python analytics/analyzer.py       # Fetch data & generate reports
python analytics/news_fetcher.py   # Fetch news articles
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/reports/tickers` | List all tracked tickers |
| `GET /api/reports/latest` | Latest reports for all stocks |
| `GET /api/reports/:ticker/dates` | Available report dates |
| `GET /api/reports/:ticker/:date` | Specific report by date |

## Watchlist

**Tech:** GOOGL, MSFT, META, AMZN, NVDA, TSLA, UNH, APP
**AI/Semi:** ALAB, LITE, AMD, CRWD, PLTR
**Defense/Space:** AVAV, ONDS, ASTS
**Nuclear:** LEU, OKLO, SMR, LTBR, USAR

## Data Flow

```
Yahoo Finance → analyzer.py → reports/*.json → Express API → React Dashboard
                                    ↑
              news_fetcher.py → news/*.json → Claude Skills → Digest
```

## Analyzer Methodology (v3)

Data source: yfinance (Yahoo Finance) — no API key required.

**Valuation models** (weighted composite):

| Model | Used when | Weight |
|-------|-----------|--------|
| PE-based | Forward PE available | 60% |
| DCF (10-yr FCF) | Free cash flow available | 40% (70% if PE unavailable) |
| 52W Percentile | Speculative / no PE | 100% |

**CAPM-based WACC** — per-stock discount rate:
- `Cost of Equity = Risk-Free Rate (4.3%) + Beta × ERP (5.5%)`
- Blended with after-tax cost of debt for levered companies
- Clamped to [7%, 18%]

**DCF assumptions:**
- 10-year projection, growth decays 15%/yr toward 3% terminal rate
- Terminal value capped at 75% of total DCF value

**Piotroski F-Score** — 9-factor financial health (0–9):
- Profitability (4): net income, ROA, operating CF, accrual quality
- Leverage/Liquidity (3): D/E ratio, current ratio, dilution
- Efficiency (2): gross margin, asset turnover

**Margin of Safety** applied to fair value → recommended buy price:
- Normal: 20% | Speculative: 30%
- F-Score ≥ 7 reduces by 5%; F-Score ≤ 3 adds 10%

**Grading** — sector-adjusted, 6-factor weighted score → A+ to D:
PEG, gross margin, revenue growth, forward PE, upside %, Piotroski score

## News Fetcher

Fetches news for all watchlist tickers via yfinance, attempts full article extraction with trafilatura, and saves structured JSON for downstream analysis.

**Output:**
- `news/<TICKER>/<YYYYMMDD>.json` — per-ticker articles
- `news/digest/<YYYYMMDD>.json` — combined daily digest (cross-ticker, deduplicated)

**Article fields:** ticker, title, url, provider, published_at, summary, full_text, has_full_text

Full text extraction uses trafilatura; falls back gracefully on paywalled or JS-rendered pages.