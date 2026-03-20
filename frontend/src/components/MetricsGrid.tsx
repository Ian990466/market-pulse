import { TrendingUp, DollarSign, BarChart3, Activity } from "lucide-react";
import { StockData, ComparisonMetric } from "../types";
import { MetricCard } from "./MetricCard";
import { formatCurrency } from "../utils";

interface MetricsGridProps {
  stock: StockData;
  onCompare: (metric: ComparisonMetric) => void;
}

export function MetricsGrid({ stock, onCompare }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Price"
        value={formatCurrency(stock.price)}
        subValue={`52W Range: ${formatCurrency(stock.low_52w)} - ${formatCurrency(stock.high_52w)}`}
        icon={DollarSign}
        trend={stock.price > stock.my_fair_mid ? "down" : "up"}
      />
      <MetricCard
        title="P/E Ratio"
        value={
          typeof stock.ttm_pe === "number" ? stock.ttm_pe.toFixed(2) : "N/A"
        }
        subValue={`Forward: ${typeof stock.forward_pe === "number" ? stock.forward_pe.toFixed(2) : "N/A"}`}
        icon={BarChart3}
        onClick={() => onCompare("pe")}
      />
      <MetricCard
        title="Gross Margin"
        value={`${(stock.gross_margin || 0).toFixed(1)}%`}
        subValue={`Op Margin: ${(stock.op_margin || 0).toFixed(1)}%`}
        icon={Activity}
        onClick={() => onCompare("margin")}
      />
      <MetricCard
        title="Rev Growth (YoY)"
        value={
          typeof stock.rev_growth_yoy === "number"
            ? `${stock.rev_growth_yoy.toFixed(1)}%`
            : "N/A"
        }
        subValue={`EPS Growth: ${typeof stock.eps_growth_yoy === "number" ? stock.eps_growth_yoy.toFixed(1) + "%" : "N/A"}`}
        icon={TrendingUp}
        trend={
          stock.rev_growth_yoy && stock.rev_growth_yoy > 15 ? "up" : "neutral"
        }
        onClick={() => onCompare("growth")}
      />
    </div>
  );
}
