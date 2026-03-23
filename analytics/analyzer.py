import json
import math
import os
import sys
from datetime import datetime
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

# CAPM assumptions
RISK_FREE_RATE = 0.043          # 10Y US Treasury yield (~4.3%)
EQUITY_RISK_PREMIUM = 0.055     # historical average ~5.5%
WACC_FLOOR = 0.07              # minimum 7% discount rate
WACC_CAP = 0.18                # maximum 18% discount rate

# DCF assumptions
DCF_TERMINAL_GROWTH = 0.03     # 3% perpetual growth
DCF_PROJECTION_YEARS = 10
DCF_FCF_GROWTH_DECAY = 0.85    # growth rate decays 15% per year toward terminal
DCF_TERMINAL_VALUE_CAP = 0.75  # terminal value cannot exceed 75% of total DCF

# Margin of Safety
MARGIN_OF_SAFETY_DEFAULT = 0.20   # 20% discount for normal stocks
MARGIN_OF_SAFETY_SPECULATIVE = 0.30  # 30% for speculative


# ==================== DATA MODELS ====================
@dataclass
class StockData:
    ticker: str
    name: str = ""
    sector: str = ""
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

    # Multi-model valuation
    pe_fair_value: Optional[float] = None
    dcf_fair_value: Optional[float] = None
    valuation_methods: List[Dict] = field(default_factory=list)

    # Composite analysis
    my_fair_low: float = 0
    my_fair_mid: float = 0
    my_fair_high: float = 0
    upside_pct: Optional[float] = None
    grade: str = ""
    grade_score: int = 0
    signal: str = ""
    zone: str = ""
    risk_flags: List[str] = field(default_factory=list)

    # ---- NEW v3 fields ----
    wacc: Optional[float] = None                    # CAPM-derived discount rate
    piotroski_score: Optional[int] = None           # F-Score 0-9
    piotroski_details: List[str] = field(default_factory=list)  # which factors passed
    margin_of_safety: Optional[float] = None        # MoS percentage applied
    buy_price: Optional[float] = None               # fair_mid × (1 - MoS)
    peer_rank: Dict = field(default_factory=dict)    # {metric: {rank, total, percentile}}


# ==================== QUANTITATIVE ENGINE ====================

class QuantEngine:
    PE_RANGES = {
        "mega_tech":     {"low": 20, "mid": 28, "high": 35},
        "high_growth":   {"low": 25, "mid": 35, "high": 50},
        "semiconductor": {"low": 20, "mid": 30, "high": 45},
        "saas":          {"low": 50, "mid": 75, "high": 100},
        "defense":       {"low": 25, "mid": 35, "high": 50},
        "healthcare":    {"low": 14, "mid": 20, "high": 26},
        "speculative":   {"low": None, "mid": None, "high": None},
        "meme":          {"low": 40, "mid": 80, "high": 130},
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

    SECTOR_GRADE_ADJUSTMENTS = {
        "saas":          {"pe_penalty_threshold": 120, "margin_bonus_threshold": 60},
        "mega_tech":     {"pe_penalty_threshold": 45,  "margin_bonus_threshold": 40},
        "high_growth":   {"pe_penalty_threshold": 60,  "margin_bonus_threshold": 50},
        "semiconductor": {"pe_penalty_threshold": 55,  "margin_bonus_threshold": 40},
        "healthcare":    {"pe_penalty_threshold": 30,  "margin_bonus_threshold": 25},
        "defense":       {"pe_penalty_threshold": 55,  "margin_bonus_threshold": 25},
        "meme":          {"pe_penalty_threshold": 150, "margin_bonus_threshold": 20},
        "speculative":   {"pe_penalty_threshold": 200, "margin_bonus_threshold": 10},
    }

    @classmethod
    def get_sector(cls, ticker: str) -> str:
        return cls.SECTOR_MAP.get(ticker, "speculative")

    # ---- CAPM-based WACC ----
    @classmethod
    def calculate_wacc(cls, stock: StockData, info: dict) -> float:
        beta = stock.beta if stock.beta and stock.beta > 0 else 1.0
        cost_of_equity = RISK_FREE_RATE + beta * EQUITY_RISK_PREMIUM

        # For companies with significant debt, blend with cost of debt
        total_debt = info.get("totalDebt", 0) or 0
        market_cap = info.get("marketCap", 0) or 0

        if total_debt > 0 and market_cap > 0:
            debt_ratio = total_debt / (total_debt + market_cap)
            equity_ratio = 1 - debt_ratio
            cost_of_debt = 0.05 * (1 - 0.21)  # ~5% pre-tax, 21% tax shield
            wacc = equity_ratio * cost_of_equity + debt_ratio * cost_of_debt
        else:
            wacc = cost_of_equity

        wacc = max(WACC_FLOOR, min(wacc, WACC_CAP))
        stock.wacc = round(wacc * 100, 2)
        return wacc

    # ---- Manual PEG calculation ----
    @classmethod
    def calculate_peg(cls, stock: StockData) -> StockData:
        if stock.peg is not None and stock.peg > 0:
            return stock
        if (stock.forward_pe and stock.forward_pe > 0
                and stock.eps_growth_yoy and stock.eps_growth_yoy > 0):
            stock.peg = round(stock.forward_pe / stock.eps_growth_yoy, 2)
        return stock

    # ---- ROIC calculation (FIXED: uses operating income, not EBITDA) ----
    @classmethod
    def calculate_roic(cls, stock: StockData, info: dict, income_stmt=None) -> StockData:
        try:
            # Try to get EBIT from income statement first (most accurate)
            ebit = None
            if income_stmt is not None and not income_stmt.empty:
                ebit = _safe_get(income_stmt, "Operating Income", income_stmt.columns[0])
                if ebit:
                    # Annualize if quarterly (multiply by 4 is rough but reasonable)
                    # Actually use TTM: sum last 4 quarters
                    ttm_ebit = 0
                    for col in income_stmt.columns[:4]:
                        q_ebit = _safe_get(income_stmt, "Operating Income", col)
                        if q_ebit:
                            ttm_ebit += q_ebit
                    if ttm_ebit > 0:
                        ebit = ttm_ebit

            # Fallback: estimate EBIT from EBITDA - D&A
            if not ebit or ebit <= 0:
                ebitda = info.get("ebitda", 0)
                # yfinance doesn't provide D&A directly, so approximate
                # EBIT ≈ EBITDA × operating_margin / ebitda_margin
                if ebitda and ebitda > 0 and stock.op_margin and stock.ev_ebitda:
                    total_rev = info.get("totalRevenue", 0)
                    if total_rev and total_rev > 0:
                        ebit = total_rev * (stock.op_margin / 100)

            total_debt = info.get("totalDebt", 0) or 0
            total_equity = info.get("totalStockholderEquity", 0) or 0
            cash = info.get("totalCash", 0) or 0

            if ebit and ebit > 0 and (total_debt or total_equity):
                effective_tax = 0.21
                nopat = ebit * (1 - effective_tax)
                invested_capital = total_debt + total_equity - cash
                if invested_capital > 0:
                    stock.roic = round(nopat / invested_capital * 100, 2)
        except Exception:
            pass
        return stock

    # ---- DCF Model (v3: CAPM WACC + terminal value cap) ----
    @classmethod
    def calculate_dcf(cls, stock: StockData, info: dict, wacc: float) -> Optional[float]:
        fcf = info.get("freeCashflow")
        shares = info.get("sharesOutstanding")

        if not fcf or not shares or fcf <= 0 or shares <= 0:
            return None

        growth_rate = (stock.rev_growth_yoy or 10) / 100
        growth_rate = max(0.03, min(growth_rate, 0.50))

        projected_fcf = []
        current_fcf = fcf
        current_growth = growth_rate

        for year in range(1, DCF_PROJECTION_YEARS + 1):
            current_fcf = current_fcf * (1 + current_growth)
            projected_fcf.append(current_fcf / (1 + wacc) ** year)
            current_growth = DCF_TERMINAL_GROWTH + (current_growth - DCF_TERMINAL_GROWTH) * DCF_FCF_GROWTH_DECAY

        pv_fcf_sum = sum(projected_fcf)

        # Terminal value with sanity check
        if wacc <= DCF_TERMINAL_GROWTH:
            return None  # invalid: discount rate must exceed terminal growth

        terminal_fcf = current_fcf * (1 + DCF_TERMINAL_GROWTH)
        terminal_value = terminal_fcf / (wacc - DCF_TERMINAL_GROWTH)
        pv_terminal = terminal_value / (1 + wacc) ** DCF_PROJECTION_YEARS

        # Cap terminal value contribution
        total_uncapped = pv_fcf_sum + pv_terminal
        if total_uncapped > 0:
            terminal_pct = pv_terminal / total_uncapped
            if terminal_pct > DCF_TERMINAL_VALUE_CAP:
                # Scale down terminal to max allowed proportion
                max_terminal = pv_fcf_sum * (DCF_TERMINAL_VALUE_CAP / (1 - DCF_TERMINAL_VALUE_CAP))
                pv_terminal = max_terminal

        intrinsic_total = pv_fcf_sum + pv_terminal
        intrinsic_per_share = intrinsic_total / shares

        return round(intrinsic_per_share, 2) if intrinsic_per_share > 0 else None

    # ---- Piotroski F-Score ----
    @classmethod
    def calculate_piotroski(cls, stock: StockData, info: dict, income_stmt=None, balance_sheet=None, cashflow_stmt=None) -> StockData:
        score = 0
        details = []

        # --- Profitability (4 points) ---

        # 1. Positive net income
        net_income = info.get("netIncomeToCommon", 0) or 0
        if net_income > 0:
            score += 1
            details.append("Net income positive")

        # 2. Positive ROA (net income / total assets)
        total_assets = info.get("totalAssets", 0) or 0
        if net_income > 0 and total_assets > 0:
            roa = net_income / total_assets
            if roa > 0:
                score += 1
                details.append(f"ROA positive ({roa:.1%})")

        # 3. Positive operating cash flow
        op_cashflow = info.get("operatingCashflow", 0) or 0
        if op_cashflow > 0:
            score += 1
            details.append("Operating CF positive")

        # 4. Cash flow from operations > net income (quality of earnings)
        if op_cashflow > net_income and net_income != 0:
            score += 1
            details.append("OCF > Net Income (accrual quality)")

        # --- Leverage / Liquidity (3 points) ---

        # 5. Decreasing leverage (D/E ratio) — use current vs threshold
        if stock.debt_equity is not None and stock.debt_equity < 1.0:
            score += 1
            details.append(f"Low leverage (D/E {stock.debt_equity:.2f})")

        # 6. Improving current ratio (> 1.0 = liquid)
        if stock.current_ratio is not None and stock.current_ratio > 1.0:
            score += 1
            details.append(f"Liquid (CR {stock.current_ratio:.1f})")

        # 7. No dilution (shares outstanding not increasing significantly)
        # Check if buyback yield is positive or shares are stable
        shares = info.get("sharesOutstanding", 0) or 0
        float_shares = info.get("floatShares", 0) or 0
        if shares > 0 and float_shares > 0:
            dilution = (shares - float_shares) / float_shares
            if dilution < 0.02:  # less than 2% dilution
                score += 1
                details.append("Minimal dilution")
        elif shares > 0:
            # If we can't determine dilution, give benefit of doubt for profitable companies
            if net_income > 0:
                score += 1
                details.append("Shares stable (assumed)")

        # --- Operating Efficiency (2 points) ---

        # 8. Improving gross margin
        if stock.gross_margin is not None and stock.gross_margin > 30:
            score += 1
            details.append(f"Gross margin {stock.gross_margin:.0f}%")

        # 9. Improving asset turnover (revenue / total assets)
        total_revenue = info.get("totalRevenue", 0) or 0
        if total_revenue > 0 and total_assets > 0:
            asset_turnover = total_revenue / total_assets
            if asset_turnover > 0.3:
                score += 1
                details.append(f"Asset turnover {asset_turnover:.2f}")

        stock.piotroski_score = score
        stock.piotroski_details = details
        return stock

    # ---- Multi-model fair value (v3: uses CAPM WACC) ----
    @classmethod
    def calculate_buy_zones(cls, stock: StockData, info: dict, wacc: float) -> StockData:
        sector = cls.get_sector(stock.ticker)
        pe_range = cls.PE_RANGES[sector]
        methods = []

        pe_fair_low = pe_fair_mid = pe_fair_high = None

        if sector == "speculative" or stock.forward_pe is None or stock.forward_pe <= 0:
            rng = stock.high_52w - stock.low_52w
            if rng > 0:
                pe_fair_low = round(stock.low_52w + rng * 0.15)
                pe_fair_mid = round(stock.low_52w + rng * 0.35)
                pe_fair_high = round(stock.low_52w + rng * 0.60)
                methods.append({"name": "52W Percentile", "value": pe_fair_mid, "weight": 100})
        else:
            implied_eps = stock.price / stock.forward_pe if stock.forward_pe else 0
            if implied_eps > 0:
                pe_fair_low = round(pe_range["low"] * implied_eps)
                pe_fair_mid = round(pe_range["mid"] * implied_eps)
                pe_fair_high = round(pe_range["high"] * implied_eps)
                stock.pe_fair_value = pe_fair_mid
                methods.append({"name": "PE Model", "value": pe_fair_mid, "weight": 60})

        # DCF model with per-stock WACC
        dcf_value = cls.calculate_dcf(stock, info, wacc)
        if dcf_value and dcf_value > 0:
            stock.dcf_fair_value = dcf_value
            dcf_weight = 40 if methods else 70
            methods.append({"name": "DCF Model", "value": dcf_value, "weight": dcf_weight})

        stock.valuation_methods = methods

        # Weighted composite
        if methods:
            total_weight = sum(m["weight"] for m in methods)
            weighted_mid = sum(m["value"] * m["weight"] for m in methods) / total_weight

            if pe_fair_low is not None and pe_fair_high is not None:
                if pe_fair_mid and pe_fair_mid > 0:
                    scale = weighted_mid / pe_fair_mid
                    stock.my_fair_low = round(pe_fair_low * scale)
                    stock.my_fair_mid = round(weighted_mid)
                    stock.my_fair_high = round(pe_fair_high * scale)
                else:
                    stock.my_fair_low = pe_fair_low
                    stock.my_fair_mid = round(weighted_mid)
                    stock.my_fair_high = pe_fair_high
            else:
                stock.my_fair_low = round(weighted_mid * 0.75)
                stock.my_fair_mid = round(weighted_mid)
                stock.my_fair_high = round(weighted_mid * 1.30)

        # Upside %
        if stock.my_fair_mid > 0 and stock.price > 0:
            stock.upside_pct = round((stock.my_fair_mid / stock.price - 1) * 100, 1)

        # Zone classification
        if stock.price <= stock.my_fair_low:
            stock.zone = "Strong Buy"
        elif stock.price <= stock.my_fair_mid:
            stock.zone = "Fair Buy"
        elif stock.price <= stock.my_fair_high:
            stock.zone = "Hold/Watch"
        else:
            stock.zone = "Overvalued"

        return stock

    # ---- Margin of Safety ----
    @classmethod
    def calculate_margin_of_safety(cls, stock: StockData) -> StockData:
        sector = cls.get_sector(stock.ticker)
        if sector == "speculative":
            mos = MARGIN_OF_SAFETY_SPECULATIVE
        else:
            mos = MARGIN_OF_SAFETY_DEFAULT

        # Adjust MoS based on financial quality (Piotroski)
        if stock.piotroski_score is not None:
            if stock.piotroski_score >= 7:
                mos = max(0.10, mos - 0.05)  # strong financials → less margin needed
            elif stock.piotroski_score <= 3:
                mos = min(0.40, mos + 0.10)  # weak financials → more margin needed

        stock.margin_of_safety = round(mos * 100, 1)

        if stock.my_fair_mid > 0:
            stock.buy_price = round(stock.my_fair_mid * (1 - mos))

        return stock

    # ---- Sector-adjusted grading (v3: incorporates F-Score) ----
    @classmethod
    def calculate_grade(cls, stock: StockData) -> StockData:
        sector = cls.get_sector(stock.ticker)
        adj = cls.SECTOR_GRADE_ADJUSTMENTS.get(sector, cls.SECTOR_GRADE_ADJUSTMENTS["speculative"])
        score = 50

        # 1. PEG score (weight 20%)
        peg = stock.peg
        if peg and peg > 0:
            if peg < 0.8:    score += 15
            elif peg < 1.2:  score += 10
            elif peg < 2.0:  score += 5
            elif peg > 3.0:  score -= 10

        # 2. Gross margin — sector-adjusted (weight 18%)
        if stock.gross_margin is not None:
            margin_bonus = adj["margin_bonus_threshold"]
            if stock.gross_margin > margin_bonus + 30:   score += 12
            elif stock.gross_margin > margin_bonus + 10: score += 8
            elif stock.gross_margin > margin_bonus:      score += 4
            elif stock.gross_margin < margin_bonus - 20: score -= 5

        # 3. Revenue growth (weight 18%)
        if stock.rev_growth_yoy is not None:
            if stock.rev_growth_yoy > 40:    score += 12
            elif stock.rev_growth_yoy > 20:  score += 8
            elif stock.rev_growth_yoy > 10:  score += 4
            elif stock.rev_growth_yoy < 0:   score -= 10

        # 4. Forward PE — sector-adjusted (weight 14%)
        if stock.forward_pe is not None:
            threshold = adj["pe_penalty_threshold"]
            if stock.forward_pe < threshold * 0.4:   score += 10
            elif stock.forward_pe < threshold * 0.7: score += 5
            elif stock.forward_pe > threshold * 1.5: score -= 10
            elif stock.forward_pe > threshold:       score -= 5

        # 5. Beta / risk (weight 8%)
        if stock.beta is not None:
            if stock.beta < 1.0:   score += 5
            elif stock.beta > 2.5: score -= 8
            elif stock.beta > 2.0: score -= 5

        # 6. ROE / ROIC (weight 8%)
        efficiency = stock.roic if stock.roic is not None else stock.roe
        if efficiency is not None:
            if efficiency > 30:   score += 6
            elif efficiency > 15: score += 3
            elif efficiency < 0:  score -= 5

        # 7. Piotroski F-Score (weight 10%) — NEW in v3
        if stock.piotroski_score is not None:
            if stock.piotroski_score >= 8:   score += 10
            elif stock.piotroski_score >= 6: score += 6
            elif stock.piotroski_score >= 4: score += 2
            elif stock.piotroski_score <= 2: score -= 8

        # Bonus: strong FCF yield (weight 4%)
        if stock.fcf_yield and stock.fcf_yield > 5:
            score += 4
        elif stock.fcf_yield and stock.fcf_yield > 3:
            score += 2

        stock.grade_score = score

        if score >= 85:   stock.grade = "A+"
        elif score >= 76: stock.grade = "A"
        elif score >= 68: stock.grade = "A-"
        elif score >= 60: stock.grade = "B+"
        elif score >= 52: stock.grade = "B"
        elif score >= 46: stock.grade = "B-"
        elif score >= 40: stock.grade = "C+"
        elif score >= 34: stock.grade = "C"
        elif score >= 28: stock.grade = "C-"
        else:             stock.grade = "D"

        return stock

    # ---- Enhanced signals + risk flags ----
    @classmethod
    def generate_signal(cls, stock: StockData) -> StockData:
        signals = []
        risks = []

        # === SIGNALS ===
        if stock.high_52w > 0:
            pct_from_high = (stock.price / stock.high_52w - 1) * 100
            if pct_from_high < -40:
                signals.append(f"Down {abs(pct_from_high):.0f}% from high")
            elif pct_from_high < -20:
                signals.append(f"Pullback {abs(pct_from_high):.0f}%")
            elif pct_from_high > -5:
                signals.append("Near 52W high")

        if stock.peg and stock.peg > 0:
            if stock.peg < 0.8:
                signals.append(f"PEG {stock.peg:.2f} undervalued")
            elif stock.peg > 3:
                signals.append(f"PEG {stock.peg:.2f} overvalued")

        if stock.forward_pe and stock.ttm_pe:
            if stock.forward_pe < stock.ttm_pe * 0.7:
                signals.append("Earnings accelerating")
            elif stock.forward_pe > stock.ttm_pe * 1.3:
                signals.append("Earnings decelerating")

        if stock.gross_margin and stock.gross_margin > 75:
            signals.append(f"High gross margin {stock.gross_margin:.0f}%")

        if stock.fcf_yield and stock.fcf_yield > 5:
            signals.append(f"Strong FCF yield {stock.fcf_yield:.1f}%")

        if stock.upside_pct is not None and stock.upside_pct > 50:
            signals.append(f"↑{stock.upside_pct:.0f}% upside to fair value")

        # v3: Piotroski signal
        if stock.piotroski_score is not None:
            if stock.piotroski_score >= 8:
                signals.append(f"F-Score {stock.piotroski_score}/9 (strong)")
            elif stock.piotroski_score <= 2:
                signals.append(f"F-Score {stock.piotroski_score}/9 (weak)")

        # v3: Buy price signal
        if stock.buy_price and stock.price <= stock.buy_price:
            signals.append(f"Below MoS buy price ${stock.buy_price}")

        # === RISK FLAGS ===
        if stock.debt_equity is not None and stock.debt_equity > 1.5:
            risks.append(f"High debt/equity {stock.debt_equity:.1f}x")

        if stock.net_margin is not None and stock.net_margin < 0:
            risks.append("Unprofitable (negative net margin)")

        if stock.beta is not None and stock.beta > 2.5:
            risks.append(f"High volatility (beta {stock.beta:.1f})")

        if stock.rev_growth_yoy is not None and stock.rev_growth_yoy < -5:
            risks.append(f"Revenue declining {stock.rev_growth_yoy:.0f}% YoY")

        if stock.eps_growth_yoy is not None and stock.eps_growth_yoy < -20:
            risks.append(f"EPS declining {stock.eps_growth_yoy:.0f}% YoY")

        if stock.current_ratio is not None and stock.current_ratio < 1.0:
            risks.append(f"Low liquidity (current ratio {stock.current_ratio:.1f})")

        if stock.ttm_pe is not None and stock.ttm_pe > 100:
            risks.append(f"Extreme valuation (PE {stock.ttm_pe:.0f})")

        if stock.zone == "Overvalued" and stock.upside_pct is not None:
            risks.append(f"Trading {abs(stock.upside_pct):.0f}% above fair value")

        # v3: Piotroski risk
        if stock.piotroski_score is not None and stock.piotroski_score <= 3:
            risks.append(f"Weak fundamentals (F-Score {stock.piotroski_score}/9)")

        stock.signal = " · ".join(signals) if signals else "Neutral"
        stock.risk_flags = risks

        return stock

    # ---- Peer percentile ranking ----
    @classmethod
    def calculate_peer_rankings(cls, all_stocks: List[StockData]) -> List[StockData]:
        """
        Rank each stock within its sector across key metrics.
        Returns percentile (0-100, higher = better) for each metric.
        """
        # Group by sector
        sector_groups: Dict[str, List[StockData]] = {}
        for s in all_stocks:
            sector = cls.get_sector(s.ticker)
            sector_groups.setdefault(sector, []).append(s)

        metrics_config = {
            "forward_pe":     {"attr": "forward_pe",     "lower_is_better": True},
            "gross_margin":   {"attr": "gross_margin",   "lower_is_better": False},
            "rev_growth":     {"attr": "rev_growth_yoy", "lower_is_better": False},
            "roic":           {"attr": "roic",           "lower_is_better": False},
            "fcf_yield":      {"attr": "fcf_yield",      "lower_is_better": False},
            "peg":            {"attr": "peg",            "lower_is_better": True},
            "piotroski":      {"attr": "piotroski_score","lower_is_better": False},
        }

        for sector, stocks in sector_groups.items():
            total = len(stocks)
            if total < 2:
                # Solo in sector — no meaningful ranking, but still set defaults
                for s in stocks:
                    s.peer_rank = {m: {"rank": 1, "total": 1, "percentile": 50} for m in metrics_config}
                continue

            for metric_name, config in metrics_config.items():
                attr = config["attr"]
                lower_better = config["lower_is_better"]

                # Get stocks with valid values for this metric
                valued = [(s, getattr(s, attr)) for s in stocks if getattr(s, attr) is not None]
                if not valued:
                    continue

                # Sort: for "lower is better", ascending rank 1 = lowest value = best
                valued.sort(key=lambda x: x[1], reverse=not lower_better)

                for rank_idx, (s, _) in enumerate(valued, 1):
                    if not s.peer_rank:
                        s.peer_rank = {}
                    percentile = round((1 - (rank_idx - 1) / len(valued)) * 100)
                    s.peer_rank[metric_name] = {
                        "rank": rank_idx,
                        "total": len(valued),
                        "percentile": percentile,
                    }

        return all_stocks


# === Helper functions ===
def _pct(val):
    if val is None:
        return None
    return round(val * 100, 2)


def _safe_get(df, row_name, col):
    try:
        val = df.loc[row_name, col]
        if hasattr(val, 'item'):
            return val.item()
        return float(val) if val and str(val) != 'nan' else None
    except Exception:
        return None


def _clean(obj):
    if isinstance(obj, float) and math.isnan(obj):
        return None
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean(v) for v in obj]
    return obj


# ==================== MAIN ====================

def main():
    print("=" * 60)
    print("Ian Watchlist Quantitative Analysis System  v3.0")
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{len(WATCHLIST)} tickers")
    print("=" * 60)

    run_yfinance_full()


def run_yfinance_full():
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

            # === Sector ===
            sector = QuantEngine.get_sector(ticker)
            stock.sector = sector

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
            stock.beta = info.get("beta")
            stock.debt_equity = info.get("debtToEquity")
            if stock.debt_equity:
                stock.debt_equity = round(stock.debt_equity / 100, 2)
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

            # === Quarterly income statement ===
            income_stmt = None
            try:
                inc = t.quarterly_income_stmt
                if inc is not None and not inc.empty:
                    income_stmt = inc
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
                    stock.quarterly_eps = [
                        {"date": q["date"], "eps": q["eps"]}
                        for q in quarters if q["eps"] != 0
                    ]
            except Exception as qe:
                print(f"(quarterly: {qe})", end=" ")

            # === Manual calculations ===
            stock = QuantEngine.calculate_peg(stock)
            stock = QuantEngine.calculate_roic(stock, info, income_stmt)

            # === v3: CAPM WACC ===
            wacc = QuantEngine.calculate_wacc(stock, info)

            # === v3: Piotroski F-Score ===
            stock = QuantEngine.calculate_piotroski(stock, info)

            # === Quantitative analysis (order matters) ===
            stock = QuantEngine.calculate_buy_zones(stock, info, wacc)
            stock = QuantEngine.calculate_grade(stock)
            stock = QuantEngine.calculate_margin_of_safety(stock)
            stock = QuantEngine.generate_signal(stock)

            all_stocks.append(stock)
            upside_str = f"+{stock.upside_pct}%" if stock.upside_pct and stock.upside_pct > 0 else f"{stock.upside_pct}%"
            risk_str = f" | RISKS: {len(stock.risk_flags)}" if stock.risk_flags else ""
            fscore_str = f" | F:{stock.piotroski_score}" if stock.piotroski_score is not None else ""
            buy_str = f" | Buy≤${stock.buy_price}" if stock.buy_price else ""
            print(f"${stock.price:.2f} | {stock.grade} ({stock.grade_score}) | {stock.zone} | WACC {stock.wacc}%{fscore_str}{buy_str} | {upside_str}{risk_str}")

        except Exception as e:
            print(f"ERROR: {e}")

    # === v3: Peer rankings (must run after all stocks collected) ===
    if all_stocks:
        all_stocks = QuantEngine.calculate_peer_rankings(all_stocks)

    # === Save per-ticker JSON files ===
    today = datetime.now().strftime("%Y%m%d")

    for s in all_stocks:
        ticker_dir = os.path.join(OUTPUT_DIR, s.ticker)
        os.makedirs(ticker_dir, exist_ok=True)
        json_path = os.path.join(ticker_dir, f"{today}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(_clean(asdict(s)), f, indent=2, ensure_ascii=False)

    print(f"\nSaved {len(all_stocks)} tickers to {OUTPUT_DIR}/{{TICKER}}/{today}.json")
    print(f"Done. {len(all_stocks)} tickers processed.")


# ==================== SCHEDULER (optional) ====================

def setup_daily_schedule():
    try:
        import schedule
        import time

        schedule.every().day.at("06:00").do(main)

        print("Scheduled daily run at 06:00")
        print("Press Ctrl+C to stop\n")

        while True:
            schedule.run_pending()
            time.sleep(60)
    except ImportError:
        print("schedule not installed. Run: pip install schedule")
        print("Or use a cron job:")
        print("  crontab -e")
        print("  0 6 * * * cd /path/to/project && python analyzer.py")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--schedule":
        setup_daily_schedule()
    else:
        main()
