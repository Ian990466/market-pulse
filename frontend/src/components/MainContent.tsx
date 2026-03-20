import { LayoutDashboard, RefreshCw, AlertTriangle } from "lucide-react";
import { StockData, ComparisonMetric } from "../types";
import { StockHeader } from "./StockHeader";
import { MetricsGrid } from "./MetricsGrid";
import { FinancialChart } from "./FinancialChart";
import { EfficiencyMetrics } from "./EfficiencyMetrics";
import { QuarterlyTable } from "./QuarterlyTable";
import { FairValueGauge } from "./FairValueGauge";

interface MainContentProps {
  stock: StockData | undefined;
  selectedDate: string;
  isLoading: boolean;
  onCompare: (metric: ComparisonMetric) => void;
  error?: string | null;
}

export function MainContent({
  stock,
  selectedDate,
  isLoading,
  onCompare,
  error,
}: MainContentProps) {
  return (
    <main className="flex-1 overflow-y-auto p-8 bg-zinc-950 custom-scrollbar relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl px-5 py-4 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {stock ? (
        <div className="max-w-7xl mx-auto">
          <StockHeader stock={stock} selectedDate={selectedDate} />
          <MetricsGrid stock={stock} onCompare={onCompare} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <FinancialChart stock={stock} />
            <div className="space-y-8">
              <FairValueGauge
                current={stock.price}
                low={stock.my_fair_low}
                mid={stock.my_fair_mid}
                high={stock.my_fair_high}
              />
              <EfficiencyMetrics stock={stock} />
            </div>
          </div>

          <QuarterlyTable quarters={stock.quarterly_revenue} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500">
          <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg">No stocks found.</p>
        </div>
      )}
    </main>
  );
}
