"""
=============================================================
Ian's Automated Quantitative Analysis System
=============================================================
Daily automated stock data fetch -> quantitative metrics -> buy zone report

Data Source: yfinance (Yahoo Finance) -- free, unlimited, no API key required

Install dependencies:
  pip install yfinance schedule

Usage:
  1. Run: python analyzer.py
  2. Optionally configure a cron job or scheduler for daily execution
=============================================================
"""

import json
import os
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict

# ==================== CONFIG ====================
WATCHLIST = [
    "GOOGL", "MSFT", "APP", "META", "NVDA", "AMZN", "TSLA", "UNH",
    "ALAB", "LITE", "AMD", "CRWD", "PLTR",
    "AVAV", "ONDS",
    "LEU", "OKLO", "SMR", "LTBR", "USAR",
    "ASTS",
]

OUTPUT_DIR = "reports"
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ==================== DATA MODELS ====================
@dataclass
class StockData:
    ticker: str
    name: str = ""
    price: float = 0
    market_cap: float = 0  # in billions

    # Valuation
    ttm_pe: Optional[float] = None
    forward_pe: Optional[float] = None
    peg: Optional[float] = None
    ps_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None

    # Profitability
    gross_margin: Optional[float] = None
    op_margin: Optional[float] = None
    net_margin: Optional[float] = None
    roe: Optional[float] = None
    roic: Optional[float] = None

    # Growth
    rev_growth_yoy: Optional[float] = None
    eps_growth_yoy: Optional[float] = None

    # Risk
    beta: Optional[float] = None
    debt_equity: Optional[float] = None
    current_ratio: Optional[float] = None

    # Price context
    high_52w: float = 0
    low_52w: float = 0

    # Cash flow
    fcf_per_share: Optional[float] = None
    fcf_yield: Optional[float] = None

    # Quarterly data
    quarterly_revenue: List[Dict] = field(default_factory=list)
    quarterly_eps: List[Dict] = field(default_factory=list)

    # My analysis
    my_fair_low: float = 0
    my_fair_mid: float = 0
    my_fair_high: float = 0
    grade: str = ""
    signal: str = ""
    zone: str = ""


# ==================== QUANTITATIVE ENGINE ====================

class QuantEngine:
    """Core quantitative analysis logic"""

    # Reasonable PE ranges by sector
    PE_RANGES = {
        "mega_tech":    {"low": 20, "mid": 28, "high": 35},     # MSFT, GOOGL, META, AMZN
        "high_growth":  {"low": 25, "mid": 35, "high": 50},     # APP, NVDA
        "semiconductor":{"low": 20, "mid": 30, "high": 45},     # ALAB, LITE, AMD
        "saas":         {"low": 50, "mid": 75, "high": 100},    # CRWD (non-GAAP)
        "defense":      {"low": 25, "mid": 35, "high": 50},     # AVAV, LEU
        "healthcare":   {"low": 14, "mid": 20, "high": 26},     # UNH
        "speculative":  {"low": None, "mid": None, "high": None}, # OKLO, SMR, USAR, LTBR, ONDS, ASTS
        "meme":         {"low": 40, "mid": 80, "high": 130},    # TSLA, PLTR
    }

    SECTOR_MAP = {
        "GOOGL": "mega_tech", "MSFT": "mega_tech", "META": "mega_tech", "AMZN": "mega_tech",
        "APP": "high_growth", "NVDA": "high_growth",
        "ALAB": "semiconductor", "LITE": "semiconductor", "AMD": "semiconductor",
        "CRWD": "saas",
        "PLTR": "meme", "TSLA": "meme",
        "UNH": "healthcare",
        "AVAV": "defense", "LEU": "defense",
        "OKLO": "speculative", "SMR": "speculative", "LTBR": "speculative",
        "USAR": "speculative", "ONDS": "speculative", "ASTS": "speculative",
    }

    @classmethod
    def calculate_buy_zones(cls, stock: StockData) -> StockData:
        """Core logic: calculate buy zones using forward PE x implied EPS"""
        sector = cls.SECTOR_MAP.get(stock.ticker, "speculative")
        pe_range = cls.PE_RANGES[sector]

        if sector == "speculative" or stock.forward_pe is None or stock.forward_pe <= 0:
            # Pre-earnings stocks: estimate using 52-week range percentiles
            rng = stock.high_52w - stock.low_52w
            stock.my_fair_low = round(stock.low_52w + rng * 0.15)
            stock.my_fair_mid = round(stock.low_52w + rng * 0.35)
            stock.my_fair_high = round(stock.low_52w + rng * 0.60)
        else:
            # Profitable stocks: forward PE x implied EPS
            implied_eps = stock.price / stock.forward_pe if stock.forward_pe else 0
            if implied_eps > 0:
                stock.my_fair_low = round(pe_range["low"] * implied_eps)
                stock.my_fair_mid = round(pe_range["mid"] * implied_eps)
                stock.my_fair_high = round(pe_range["high"] * implied_eps)

        # Determine current price zone
        if stock.price <= stock.my_fair_low:
            stock.zone = "Strong Buy"
        elif stock.price <= stock.my_fair_mid:
            stock.zone = "Fair Buy"
        elif stock.price <= stock.my_fair_high:
            stock.zone = "Hold/Watch"
        else:
            stock.zone = "Overvalued"

        return stock

    @classmethod
    def calculate_grade(cls, stock: StockData) -> StockData:
        """Grading logic: weighted score based on PEG, margins, growth, and risk"""
        score = 50  # starting score

        # PEG score (weight 25%)
        if stock.peg and stock.peg > 0:
            if stock.peg < 0.8: score += 15
            elif stock.peg < 1.2: score += 10
            elif stock.peg < 2.0: score += 5
            elif stock.peg > 3.0: score -= 10

        # Gross margin (weight 20%)
        if stock.gross_margin:
            if stock.gross_margin > 70: score += 12
            elif stock.gross_margin > 50: score += 8
            elif stock.gross_margin > 30: score += 4
            else: score -= 5

        # Revenue growth (weight 20%)
        if stock.rev_growth_yoy:
            if stock.rev_growth_yoy > 40: score += 12
            elif stock.rev_growth_yoy > 20: score += 8
            elif stock.rev_growth_yoy > 10: score += 4
            elif stock.rev_growth_yoy < 0: score -= 10

        # Forward PE reasonableness (weight 15%)
        if stock.forward_pe:
            if stock.forward_pe < 20: score += 10
            elif stock.forward_pe < 35: score += 5
            elif stock.forward_pe > 100: score -= 10
            elif stock.forward_pe > 60: score -= 5

        # Beta / risk (weight 10%)
        if stock.beta:
            if stock.beta < 1.0: score += 5
            elif stock.beta > 2.0: score -= 5
            elif stock.beta > 2.5: score -= 8

        # ROE (weight 10%)
        if stock.roe:
            if stock.roe > 30: score += 6
            elif stock.roe > 15: score += 3
            elif stock.roe < 0: score -= 5

        # Map score to grade
        if score >= 80: stock.grade = "A+"
        elif score >= 72: stock.grade = "A"
        elif score >= 65: stock.grade = "A-"
        elif score >= 58: stock.grade = "B+"
        elif score >= 52: stock.grade = "B"
        elif score >= 46: stock.grade = "B-"
        elif score >= 40: stock.grade = "C+"
        elif score >= 34: stock.grade = "C"
        elif score >= 28: stock.grade = "C-"
        else: stock.grade = "D"

        return stock

    @classmethod
    def generate_signal(cls, stock: StockData) -> StockData:
        """Generate text signals"""
        signals = []

        # 52-week position
        if stock.high_52w > 0:
            pct_from_high = (stock.price / stock.high_52w - 1) * 100
            if pct_from_high < -40: signals.append(f"Down {abs(pct_from_high):.0f}% from high")
            elif pct_from_high < -20: signals.append(f"Pullback {abs(pct_from_high):.0f}%")

        # PEG
        if stock.peg and stock.peg > 0:
            if stock.peg < 0.8: signals.append(f"PEG {stock.peg:.2f} undervalued")
            elif stock.peg > 3: signals.append(f"PEG {stock.peg:.2f} overvalued")

        # Forward PE vs historical
        if stock.forward_pe and stock.ttm_pe:
            if stock.forward_pe < stock.ttm_pe * 0.7:
                signals.append("Earnings accelerating")

        # Margin
        if stock.gross_margin and stock.gross_margin > 75:
            signals.append(f"High gross margin {stock.gross_margin:.0f}%")

        stock.signal = " · ".join(signals) if signals else "Neutral"
        return stock


# === Helper functions ===
def _pct(val):
    """Convert 0-1 ratio to percentage"""
    if val is None: return None
    return round(val * 100, 2)


def _safe_get(df, row_name, col):
    """Safely retrieve a value from a pandas DataFrame"""
    try:
        val = df.loc[row_name, col]
        if hasattr(val, 'item'):
            return val.item()
        return float(val) if val and str(val) != 'nan' else None
    except:
        return None



# ==================== MAIN ====================

def main():
    print("=" * 60)
    print(f"Ian Watchlist Quantitative Analysis System")
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{len(WATCHLIST)} tickers")
    print("=" * 60)

    # Use yfinance (completely free, no API key required)
    run_yfinance_full()


def run_yfinance_full():
    """
    yfinance-only mode
    - No API key required
    - Free unlimited
    - Data includes: real-time quote, PE, PEG, margins, Beta, quarterly financials
    """
    try:
        import yfinance as yf
    except ImportError:
        print("ERROR: yfinance not installed. Run: pip install yfinance")
        return

    print("Using yfinance (completely free)...\n")
    all_stocks = []

    for ticker in WATCHLIST:
        try:
            print(f"{ticker}...", end=" ")
            t = yf.Ticker(ticker)
            info = t.info or {}
            stock = StockData(ticker=ticker)

            # === Basic quote ===
            stock.name = info.get("shortName", info.get("longName", ""))
            stock.price = info.get("currentPrice", info.get("regularMarketPrice", 0))
            stock.market_cap = round(info.get("marketCap", 0) / 1e9, 2)
            stock.high_52w = info.get("fiftyTwoWeekHigh", 0)
            stock.low_52w = info.get("fiftyTwoWeekLow", 0)

            # === Valuation ===
            stock.ttm_pe = info.get("trailingPE")
            stock.forward_pe = info.get("forwardPE")
            stock.peg = info.get("pegRatio")
            stock.ps_ratio = info.get("priceToSalesTrailing12Months")
            stock.ev_ebitda = info.get("enterpriseToEbitda")

            # === Margins ===
            stock.gross_margin = _pct(info.get("grossMargins"))
            stock.op_margin = _pct(info.get("operatingMargins"))
            stock.net_margin = _pct(info.get("profitMargins"))

            # === Returns & risk ===
            stock.roe = _pct(info.get("returnOnEquity"))
            stock.roic = None  # not directly available from yfinance
            stock.beta = info.get("beta")
            stock.debt_equity = info.get("debtToEquity")
            if stock.debt_equity:
                stock.debt_equity = round(stock.debt_equity / 100, 2)  # yfinance returns as percentage
            stock.current_ratio = info.get("currentRatio")

            # === FCF ===
            fcf = info.get("freeCashflow")
            shares = info.get("sharesOutstanding")
            if fcf and shares and shares > 0:
                stock.fcf_per_share = round(fcf / shares, 2)
                if stock.price and stock.price > 0:
                    stock.fcf_yield = round(stock.fcf_per_share / stock.price * 100, 2)

            # === Growth ===
            stock.rev_growth_yoy = _pct(info.get("revenueGrowth"))
            stock.eps_growth_yoy = _pct(info.get("earningsGrowth"))

            # === Quarterly income statement (for trend charts) ===
            try:
                inc = t.quarterly_income_stmt
                if inc is not None and not inc.empty:
                    quarters = []
                    for col in inc.columns[:8]:
                        rev = _safe_get(inc, "Total Revenue", col)
                        gp = _safe_get(inc, "Gross Profit", col)
                        oi = _safe_get(inc, "Operating Income", col)
                        ni = _safe_get(inc, "Net Income", col)
                        eps_val = _safe_get(inc, "Diluted EPS", col)
                        if not eps_val:
                            eps_val = _safe_get(inc, "Basic EPS", col)
                        quarters.append({
                            "date": col.strftime("%Y-%m-%d") if hasattr(col, 'strftime') else str(col),
                            "revenue": round(rev / 1e6, 1) if rev else 0,
                            "grossProfit": round(gp / 1e6, 1) if gp else 0,
                            "operatingIncome": round(oi / 1e6, 1) if oi else 0,
                            "netIncome": round(ni / 1e6, 1) if ni else 0,
                            "eps": round(eps_val, 2) if eps_val else 0,
                            "grossMargin": round(gp / rev * 100, 1) if rev and gp and rev > 0 else 0,
                            "opMargin": round(oi / rev * 100, 1) if rev and oi and rev > 0 else 0,
                        })
                    stock.quarterly_revenue = quarters
            except Exception as qe:
                print(f"(quarterly: {qe})", end=" ")

            # === Quantitative analysis ===
            stock = QuantEngine.calculate_buy_zones(stock)
            stock = QuantEngine.calculate_grade(stock)
            stock = QuantEngine.generate_signal(stock)

            all_stocks.append(stock)
            print(f"${stock.price:.2f} | {stock.grade} | {stock.zone}")

        except Exception as e:
            print(f"ERROR: {e}")

    # === Save per-ticker JSON files ===
    today = datetime.now().strftime("%Y%m%d")
    import math

    def clean(obj):
        if isinstance(obj, float) and math.isnan(obj):
            return None
        if isinstance(obj, dict):
            return {k: clean(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [clean(v) for v in obj]
        return obj

    for s in all_stocks:
        ticker_dir = os.path.join(OUTPUT_DIR, s.ticker)
        os.makedirs(ticker_dir, exist_ok=True)
        json_path = os.path.join(ticker_dir, f"{today}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(clean(asdict(s)), f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(all_stocks)} tickers to {OUTPUT_DIR}/{{TICKER}}/{today}.json")
    print(f"Done. {len(all_stocks)} tickers processed.")


# ==================== SCHEDULER (optional) ====================

def setup_daily_schedule():
    """Schedule daily execution (Taiwan time AM 6:00 = after US market close)"""
    try:
        import schedule
        import time

        schedule.every().day.at("06:00").do(main)  # Taiwan time 6AM

        print("Scheduled daily run at 06:00")
        print("Press Ctrl+C to stop\n")

        while True:
            schedule.run_pending()
            time.sleep(60)
    except ImportError:
        print("schedule not installed. Run: pip install schedule")
        print("Or use a cron job:")
        print("  crontab -e")
        print("  0 6 * * * cd /path/to/project && python stock_analyzer.py")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--schedule":
        setup_daily_schedule()
    else:
        main()
