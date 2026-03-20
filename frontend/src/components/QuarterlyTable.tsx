import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { QuarterlyData } from "../types";
import { formatCurrency } from "../utils";

interface QuarterlyTableProps {
  quarters: QuarterlyData[];
}

export const QuarterlyTable = memo(function QuarterlyTable({ quarters }: QuarterlyTableProps) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden mb-12">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white">Quarterly Breakdown</h3>
        <button className="text-xs font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors flex items-center">
          Export CSV <ChevronRight className="w-3 h-3 ml-1" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-950/50">
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Date
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Revenue
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Op Income
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Net Income
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                EPS
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Gross Margin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {quarters.map((q, idx) => (
              <tr
                key={idx}
                className="hover:bg-zinc-800/50 transition-colors group"
              >
                <td className="px-6 py-4 text-sm font-medium text-white">
                  {q.date}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                  {typeof q.revenue === "number" ? formatCurrency(q.revenue) : "-"}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                  {typeof q.operatingIncome === "number"
                    ? formatCurrency(q.operatingIncome)
                    : "-"}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                  {typeof q.netIncome === "number"
                    ? formatCurrency(q.netIncome)
                    : "-"}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-zinc-400">
                  {typeof q.eps === "number" ? q.eps.toFixed(2) : "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${q.grossMargin || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-white">
                      {typeof q.grossMargin === "number"
                        ? q.grossMargin.toFixed(1)
                        : "0.0"}
                      %
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
