import { useState, useMemo, useEffect } from "react";
import { StockData, ComparisonMetric } from "../types";

function createStub(ticker: string): StockData {
  return {
    ticker,
    name: ticker,
    price: 0,
    market_cap: 0,
    ttm_pe: null,
    forward_pe: null,
    peg: null,
    ps_ratio: null,
    ev_ebitda: null,
    gross_margin: null,
    op_margin: null,
    net_margin: null,
    roe: null,
    roic: null,
    rev_growth_yoy: null,
    eps_growth_yoy: null,
    beta: null,
    debt_equity: null,
    current_ratio: null,
    high_52w: 0,
    low_52w: 0,
    fcf_per_share: null,
    fcf_yield: null,
    quarterly_revenue: [],
    quarterly_eps: [],
    my_fair_low: 0,
    my_fair_mid: 0,
    my_fair_high: 0,
    grade: "-",
    signal: "-",
    zone: "-",
  };
}

// createStub is available for future use when loading tickers before reports arrive
void createStub;

export function useStocks() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [comparisonMetric, setComparisonMetric] = useState<ComparisonMetric | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports/latest")
      .then((res) => res.json())
      .then((data: StockData[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setStocks(data);
          setSelectedTicker(data[0].ticker);
          setError(null);
        }
      })
      .catch((err) => {
        console.error("Error fetching latest reports:", err);
        setError("Failed to load stocks. Please refresh the page.");
      });
  }, []);

  const selectedStock = useMemo(
    () => stocks.find((s) => s.ticker === selectedTicker) || stocks[0],
    [selectedTicker, stocks],
  );

  const filteredStocks = useMemo(
    () =>
      stocks.filter(
        (s) =>
          s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, stocks],
  );

  return {
    stocks,
    setStocks,
    selectedTicker,
    setSelectedTicker,
    searchQuery,
    setSearchQuery,
    selectedStock,
    filteredStocks,
    comparisonMetric,
    setComparisonMetric,
    error,
  };
}
