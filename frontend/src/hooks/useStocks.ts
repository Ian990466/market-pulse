import { useState, useMemo, useEffect } from "react";
import { StockData, ComparisonMetric } from "../types";

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
          // Ensure new v2 fields have defaults for backward compat with old reports
          const normalized = data.map((s) => ({
            ...s,
            sector: s.sector || "",
            pe_fair_value: s.pe_fair_value ?? null,
            dcf_fair_value: s.dcf_fair_value ?? null,
            valuation_methods: s.valuation_methods || [],
            upside_pct: s.upside_pct ?? null,
            grade_score: s.grade_score ?? 0,
            risk_flags: s.risk_flags || [],
            quarterly_eps: s.quarterly_eps || [],
          }));
          setStocks(normalized);
          setSelectedTicker(normalized[0].ticker);
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
