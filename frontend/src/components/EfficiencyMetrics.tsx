import { memo } from "react";
import { BarChart3 } from "lucide-react";
import { StockData } from "../types";

interface EfficiencyMetricsProps {
  stock: StockData;
}

export const EfficiencyMetrics = memo(function EfficiencyMetrics({ stock }: EfficiencyMetricsProps) {
  return (
    <div className="bg-zinc-900 text-white p-8 rounded-2xl border border-zinc-800 shadow-xl">
      <h3 className="text-lg font-bold mb-6 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-emerald-500" />
        Efficiency Metrics
      </h3>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 text-sm">Return on Equity (ROE)</span>
          <span className="font-mono font-bold text-emerald-400">
            {typeof stock.roe === "number" ? stock.roe.toFixed(2) : "-"}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 text-sm">FCF Yield</span>
          <span className="font-mono font-bold text-white">
            {typeof stock.fcf_yield === "number"
              ? stock.fcf_yield.toFixed(2)
              : "-"}
            %
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 text-sm">Current Ratio</span>
          <span className="font-mono font-bold text-white">
            {stock.current_ratio?.toFixed(2) || "N/A"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 text-sm">Debt to Equity</span>
          <span className="font-mono font-bold text-white">
            {stock.debt_equity?.toFixed(2) || "N/A"}
          </span>
        </div>
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 text-sm">Beta (Volatility)</span>
            <span className="font-mono font-bold text-white">
              {stock.beta?.toFixed(2) || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
