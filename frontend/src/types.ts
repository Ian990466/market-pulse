export interface QuarterlyData {
  date: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  grossMargin: number;
  opMargin: number;
}

export interface QuarterlyEps {
  date: string;
  eps: number;
}

export interface ValuationMethod {
  name: string;
  value: number;
  weight: number;
}

export interface StockData {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  market_cap: number;
  ttm_pe: number | null;
  forward_pe: number | null;
  peg: number | null;
  ps_ratio: number | null;
  ev_ebitda: number | null;
  gross_margin: number | null;
  op_margin: number | null;
  net_margin: number | null;
  roe: number | null;
  roic: number | null;
  rev_growth_yoy: number | null;
  eps_growth_yoy: number | null;
  beta: number | null;
  debt_equity: number | null;
  current_ratio: number | null;
  high_52w: number;
  low_52w: number;
  fcf_per_share: number | null;
  fcf_yield: number | null;
  quarterly_revenue: QuarterlyData[];
  quarterly_eps: QuarterlyEps[];

  // Multi-model valuation
  pe_fair_value: number | null;
  dcf_fair_value: number | null;
  valuation_methods: ValuationMethod[];

  // Composite analysis
  my_fair_low: number;
  my_fair_mid: number;
  my_fair_high: number;
  upside_pct: number | null;
  grade: string;
  grade_score: number;
  signal: string;
  zone: string;
  risk_flags: string[];

  // v3 fields
  wacc: number | null;
  piotroski_score: number | null;
  piotroski_details: string[];
  margin_of_safety: number | null;
  buy_price: number | null;
  peer_rank: Record<
    string,
    { rank: number; total: number; percentile: number }
  >;
}

export type ComparisonMetric = "pe" | "margin" | "growth";

export interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: ComparisonMetric | null;
  stocks: StockData[];
}
