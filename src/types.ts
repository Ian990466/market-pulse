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

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  market_cap: number;
  ttm_pe: number | null;
  forward_pe: number | null;
  peg: number | null;
  ps_ratio: number | null;
  ev_ebitda: number | null;
  gross_margin: number;
  op_margin: number;
  net_margin: number;
  roe: number;
  roic: number | null;
  rev_growth_yoy: number | null;
  eps_growth_yoy: number | null;
  beta: number | null;
  debt_equity: number | null;
  current_ratio: number | null;
  high_52w: number;
  low_52w: number;
  fcf_per_share: number;
  fcf_yield: number;
  quarterly_revenue: QuarterlyData[];
  quarterly_eps: any[];
  my_fair_low: number;
  my_fair_mid: number;
  my_fair_high: number;
  grade: string;
  signal: string;
  zone: string;
}
