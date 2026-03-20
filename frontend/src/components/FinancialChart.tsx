import { memo, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StockData } from "../types";
import { formatCurrency, formatCompactNumber } from "../utils";

interface FinancialChartProps {
  stock: StockData;
}

export const FinancialChart = memo(function FinancialChart({ stock }: FinancialChartProps) {
  const chartData = useMemo(() => {
    if (!Array.isArray(stock.quarterly_revenue)) return [];
    return [...stock.quarterly_revenue]
      .filter((q) => q && typeof q.revenue === "number" && !isNaN(q.revenue))
      .reverse()
      .map((q) => ({
        date: q.date || "N/A",
        revenue: q.revenue || 0,
        netIncome: q.netIncome || 0,
      }));
  }, [stock]);

  return (
    <div className="lg:col-span-2 bg-zinc-900 p-8 rounded-2xl border border-zinc-800 shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold text-white">
          Financial Performance (Quarterly)
        </h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-100" />
            <span className="text-xs text-zinc-500 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500 font-medium">Net Income</span>
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#27272a"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={(val) => `$${formatCompactNumber(val)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                borderRadius: "12px",
                border: "1px solid #27272a",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "#fff" }}
              formatter={(value: number) => [formatCurrency(value), ""]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#ffffff"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRev)"
            />
            <Area
              type="monotone"
              dataKey="netIncome"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorInc)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
