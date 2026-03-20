import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { StockData } from "../types";

export function useStockReport(
  selectedTicker: string,
  selectedDate: string,
  setStocks: Dispatch<SetStateAction<StockData[]>>,
) {
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTicker || !selectedDate) return;
    setIsReportLoading(true);
    fetch(`/api/reports/${selectedTicker}/${selectedDate}`)
      .then((res) => {
        if (!res.ok) throw new Error("No report");
        return res.json();
      })
      .then((data: StockData) => {
        setStocks((prev) =>
          prev.map((s) =>
            s.ticker === selectedTicker ? { ...s, ...data } : s,
          ),
        );
        setIsReportLoading(false);
        setError(null);
      })
      .catch(() => {
        setIsReportLoading(false);
        setError("Failed to load report data.");
      });
  }, [selectedTicker, selectedDate, setStocks]);

  return { isReportLoading, error };
}
