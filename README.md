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