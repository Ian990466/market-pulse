import { memo } from "react";
import { BarChart3 } from "lucide-react";
import { StockData } from "../types";
import { cn } from "../utils";

interface EfficiencyMetricsProps {
  stock: StockData;
}

function colorForValue(
  value: number | null | undefined,
  thresholds: { good: number; warn: number; inverse?: boolean },
): string {
  if (value === null || value === undefined) return "text-zinc-500";
  const { good, warn, inverse } = thresholds;
  if (inverse) {
    if (value <= good) return "text-emerald-400";
    if (value <= warn) return "text-amber-400";
    return "text-rose-400";
  }
  if (value >= good) return "text-emerald-400";
  if (value >= warn) return "text-amber-400";
  return "text-rose-400";
}

function fmt(val: number | null | undefined, suffix = ""): string {
  if (val === null || val === undefined) return "N/A";
  return val.toFixed(2) + suffix;
}

export const EfficiencyMetrics = memo(function EfficiencyMetrics({
  stock,
}: EfficiencyMetricsProps) {
  const rows: {
    label: string;
    value: string;
    color: string;
    tooltip?: string;
  }[] = [
    {
      label: "Return on Equity (ROE)",
      value: fmt(stock.roe, "%"),
      color: colorForValue(stock.roe, { good: 20, warn: 10 }),
      tooltip: "Net income / shareholders' equity",
    },
    {
      label: "Return on Invested Capital",
      value: fmt(stock.roic, "%"),
      color: colorForValue(stock.roic, { good: 15, warn: 8 }),
      tooltip: "NOPAT / invested capital",
    },
    {
      label: "PEG Ratio",
      value:
        stock.peg !== null && stock.peg !== undefined
          ? stock.peg.toFixed(2)
          : "N/A",
      color: colorForValue(stock.peg, { good: 1.0, warn: 2.0, inverse: true }),
      tooltip: "PE / EPS growth rate. <1 = undervalued",
    },
    {
      label: "FCF Yield",
      value: fmt(stock.fcf_yield, "%"),
      color: colorForValue(stock.fcf_yield, { good: 5, warn: 2 }),
      tooltip: "Free cash flow per share / price",
    },
    {
      label: "EV/EBITDA",
      value:
        stock.ev_ebitda !== null && stock.ev_ebitda !== undefined
          ? stock.ev_ebitda.toFixed(1)
          : "N/A",
      color: colorForValue(stock.ev_ebitda, {
        good: 15,
        warn: 30,
        inverse: true,
      }),
    },
    {
      label: "Piotroski F-Score",
      value:
        stock.piotroski_score !== null && stock.piotroski_score !== undefined
          ? `${stock.piotroski_score}/9`
          : "N/A",
      color: colorForValue(stock.piotroski_score, { good: 7, warn: 4 }),
      tooltip:
        "9-factor financial health score (profitability, leverage, efficiency)",
    },
  ];

  const riskRows: { label: string; value: string; color: string }[] = [
    {
      label: "Current Ratio",
      value: fmt(stock.current_ratio),
      color: colorForValue(stock.current_ratio, { good: 1.5, warn: 1.0 }),
    },
    {
      label: "Debt / Equity",
      value: fmt(stock.debt_equity, "x"),
      color: colorForValue(stock.debt_equity, {
        good: 0.5,
        warn: 1.5,
        inverse: true,
      }),
    },
    {
      label: "Beta",
      value: fmt(stock.beta),
      color: colorForValue(stock.beta, { good: 1.2, warn: 2.0, inverse: true }),
    },
  ];

  return (
    <div className="bg-zinc-900 text-white p-6 rounded-2xl border border-zinc-800 shadow-xl">
      <h3 className="text-lg font-bold mb-5 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
        Quality & Risk
      </h3>

      {/* Quality metrics */}
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">{row.label}</span>
            <span className={cn("font-mono font-bold text-sm", row.color)}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-zinc-800" />

      {/* Risk metrics */}
      <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider mb-3">
        Risk Indicators
      </p>
      <div className="space-y-4">
        {riskRows.map((row) => (
          <div key={row.label} className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">{row.label}</span>
            <span className={cn("font-mono font-bold text-sm", row.color)}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
